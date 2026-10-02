/**
 * Porao – UddoktaPay পেমেন্ট ব্যাকএন্ড (Firebase Cloud Functions, Node 20)
 *
 * নিরাপত্তার নিয়ম:
 *  1. API key শুধু Secret Manager-এ থাকে, অ্যাপ/গিটে কখনো না।
 *  2. দাম ও কয়েন সংখ্যা সার্ভারে ঠিক করা, ক্লায়েন্ট শুধু প্যাকের নাম পাঠায়।
 *  3. কয়েন যোগ হয় শুধু UddoktaPay-এর verify-payment API দিয়ে নিশ্চিত হওয়ার পর
 *     (webhook/redirect-এর কথা বিশ্বাস করা হয় না)।
 *  4. টাকার অঙ্ক, orderId, uid মিলিয়ে দেখা হয়; একই invoice দুইবার কাজ করে না।
 *  5. Firestore transaction দিয়ে কয়েন যোগ, তাই দুইবার যোগ হওয়ার সুযোগ নেই।
 */
const functions = require('firebase-functions/v1');
const admin = require('firebase-admin');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();
const FV = admin.firestore.FieldValue;

const REGION = 'asia-south1';
const PROJECT = process.env.GCLOUD_PROJECT || 'porao-dd00d';
const FN_BASE = `https://${REGION}-${PROJECT}.cloudfunctions.net`;
const SECRETS = ['UDDOKTAPAY_API_KEY', 'UDDOKTAPAY_BASE_URL'];

// সার্ভারে নির্ধারিত প্যাক (ওয়েবের প্যাকের সাথে মিল রাখা)
const PACKS = {
  p5: { coins: 5, amount: 50 },
  p12: { coins: 12, amount: 100 },
};

const apiKey = () => (process.env.UDDOKTAPAY_API_KEY || '').trim();
const baseUrl = () => (process.env.UDDOKTAPAY_BASE_URL || '').trim().replace(/\/+$/, '');

const safeEqual = (a, b) => {
  const x = Buffer.from(String(a || ''));
  const y = Buffer.from(String(b || ''));
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

async function uddoktaPost(path, body) {
  const res = await fetch(`${baseUrl()}${path}`, {
    method: 'POST',
    headers: {
      accept: 'application/json',
      'content-type': 'application/json',
      'RT-UDDOKTAPAY-API-KEY': apiKey(),
    },
    body: JSON.stringify(body),
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`UddoktaPay ${path} ${res.status}`);
  return json;
}

/* ---------------- ১) অর্ডার তৈরি + পেমেন্ট লিংক ---------------- */
exports.createPayment = functions
  .region(REGION)
  .runWith({ secrets: SECRETS, timeoutSeconds: 30 })
  .https.onCall(async (data, context) => {
    if (!context.auth) {
      throw new functions.https.HttpsError('unauthenticated', 'আগে লগইন করুন।');
    }
    const uid = context.auth.uid;
    const pack = PACKS[String(data && data.packId)];
    if (!pack) throw new functions.https.HttpsError('invalid-argument', 'ভুল প্যাক।');

    // রেট লিমিট: ১০ মিনিটে সর্বোচ্চ ৫টা অর্ডার
    const recent = await db.collection('orders').where('uid', '==', uid).limit(30).get();
    const since = Date.now() - 10 * 60 * 1000;
    const count = recent.docs.filter((d) => {
      const t = d.data().createdAt;
      return t && t.toMillis && t.toMillis() > since;
    }).length;
    if (count >= 5) {
      throw new functions.https.HttpsError('resource-exhausted', 'কিছুক্ষণ পরে আবার চেষ্টা করুন।');
    }

    const userSnap = await db.collection('users').doc(uid).get();
    if (!userSnap.exists) throw new functions.https.HttpsError('failed-precondition', 'প্রোফাইল পাওয়া যায়নি।');
    const name = String(userSnap.data().name || 'Porao User').slice(0, 60);
    const email = context.auth.token.email || `${uid}@porao.app`;

    const orderRef = db.collection('orders').doc();
    const orderId = orderRef.id;
    const token = crypto.randomBytes(24).toString('hex');

    await orderRef.set({
      uid, packId: data.packId, coins: pack.coins, amount: pack.amount,
      status: 'created', createdAt: FV.serverTimestamp(),
    });
    // webhook টোকেন আলাদা কালেকশনে (ক্লায়েন্ট পড়তে পারে না)
    await db.collection('orderSecrets').doc(orderId).set({ token });

    const resp = await uddoktaPost('/api/checkout-v2', {
      full_name: name,
      email,
      amount: String(pack.amount),
      metadata: { orderId, uid },
      redirect_url: `${FN_BASE}/paymentReturn/${orderId}`,
      cancel_url: `${FN_BASE}/paymentReturn/${orderId}/cancel`,
      webhook_url: `${FN_BASE}/uddoktapayWebhook/${orderId}/${token}`,
      return_type: 'GET',
    });

    if (!resp.payment_url) {
      throw new functions.https.HttpsError('internal', 'পেমেন্ট লিংক তৈরি হয়নি।');
    }
    return { orderId, paymentUrl: resp.payment_url };
  });

/* ---------------- কয়েন যোগের মূল কাজ (idempotent) ---------------- */
async function fulfill(orderId, invoiceId) {
  if (!orderId || !invoiceId) return 'pending';
  const orderRef = db.collection('orders').doc(orderId);
  const first = await orderRef.get();
  if (!first.exists) return 'invalid';
  if (first.data().status === 'paid') return 'paid';

  // সরাসরি UddoktaPay থেকে যাচাই
  const v = await uddoktaPost('/api/verify-payment', { invoice_id: String(invoiceId) });
  const status = String(v.status || '').toUpperCase();
  if (status !== 'COMPLETED') return status === 'PENDING' ? 'pending' : 'failed';

  const order = first.data();
  const meta = typeof v.metadata === 'string' ? safeJson(v.metadata) : v.metadata || {};
  const metaOrder = meta.orderId || meta.order_id;
  if (metaOrder !== orderId || (meta.uid && meta.uid !== order.uid)) return 'invalid';
  if (Number(v.amount) !== Number(order.amount)) {
    await orderRef.update({ status: 'review', note: 'amount mismatch', invoiceId: String(invoiceId) });
    return 'invalid';
  }

  const invRef = db.collection('invoices').doc(String(invoiceId).replace(/\//g, '_'));
  const userRef = db.collection('users').doc(order.uid);

  await db.runTransaction(async (tx) => {
    const [o, inv] = await Promise.all([tx.get(orderRef), tx.get(invRef)]);
    if (o.data().status === 'paid') return;
    if (inv.exists) throw new Error('invoice already used');
    tx.update(orderRef, {
      status: 'paid', invoiceId: String(invoiceId),
      method: v.payment_method || '', trxId: v.transaction_id || '',
      paidAt: FV.serverTimestamp(),
    });
    tx.set(invRef, { orderId, uid: order.uid, at: FV.serverTimestamp() });
    tx.update(userRef, { coins: FV.increment(order.coins) });
    tx.set(db.collection('transactions').doc(), {
      uid: order.uid, orderId, coins: order.coins, amount: order.amount,
      method: v.payment_method || '', trxId: v.transaction_id || '',
      createdAt: FV.serverTimestamp(),
    });
  });
  return 'paid';
}

function safeJson(s) { try { return JSON.parse(s); } catch (e) { return {}; } }

/* ---------------- ২) Webhook (UddoktaPay সার্ভার থেকে) ---------------- */
exports.uddoktapayWebhook = functions
  .region(REGION)
  .runWith({ secrets: SECRETS, timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    try {
      if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
      const [, orderId, token] = req.path.split('/'); // /orderId/token
      const hdr = req.get('RT-UDDOKTAPAY-API-KEY');
      if (!safeEqual(hdr, apiKey())) return res.status(401).send('Unauthorized');

      const sec = await db.collection('orderSecrets').doc(String(orderId || '_')).get();
      if (!sec.exists || !safeEqual(sec.data().token, token)) return res.status(401).send('Unauthorized');

      const invoiceId = req.body && req.body.invoice_id;
      const result = await fulfill(orderId, invoiceId);
      return res.status(200).json({ ok: true, result });
    } catch (e) {
      console.error('webhook error', e.message);
      return res.status(500).send('Error');
    }
  });

/* ---------------- ৩) ব্রাউজারে ফেরার পেজ ---------------- */
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function page(title, msg, color) {
  return `<!doctype html><html lang="bn"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(title)}</title>
<style>body{font-family:system-ui,sans-serif;background:#F8FAFC;display:flex;min-height:100vh;align-items:center;justify-content:center;margin:0}
.c{background:#fff;border-radius:16px;padding:28px;max-width:360px;text-align:center;box-shadow:0 2px 12px #0002}
h1{color:${color};font-size:22px}a{display:inline-block;margin-top:16px;background:#2563EB;color:#fff;padding:12px 22px;border-radius:10px;text-decoration:none}</style>
</head><body><div class="c"><h1>${esc(title)}</h1><p>${esc(msg)}</p>
<a href="porao://payment">অ্যাপে ফিরে যান</a></div></body></html>`;
}

exports.paymentReturn = functions
  .region(REGION)
  .runWith({ secrets: SECRETS, timeoutSeconds: 30 })
  .https.onRequest(async (req, res) => {
    res.set('Cache-Control', 'no-store');
    res.set('Content-Security-Policy', "default-src 'none'; style-src 'unsafe-inline'");
    const parts = req.path.split('/').filter(Boolean); // [orderId, 'cancel'?]
    const orderId = parts[0];
    if (parts[1] === 'cancel') {
      return res.status(200).send(page('পেমেন্ট বাতিল', 'কোনো টাকা কাটা হয়নি।', '#DC2626'));
    }
    try {
      const result = await fulfill(orderId, req.query.invoice_id);
      if (result === 'paid') return res.status(200).send(page('✅ পেমেন্ট সফল', 'কয়েন আপনার অ্যাকাউন্টে যোগ হয়েছে।', '#16A34A'));
      if (result === 'pending') return res.status(200).send(page('⏳ যাচাই চলছে', 'কয়েক মিনিটের মধ্যে কয়েন যোগ হবে।', '#CA8A04'));
      return res.status(200).send(page('পেমেন্ট সম্পন্ন হয়নি', 'টাকা কেটে থাকলে সাপোর্টে যোগাযোগ করুন।', '#DC2626'));
    } catch (e) {
      console.error('return error', e.message);
      return res.status(200).send(page('⏳ যাচাই চলছে', 'কয়েক মিনিটের মধ্যে কয়েন যোগ হবে।', '#CA8A04'));
    }
  });

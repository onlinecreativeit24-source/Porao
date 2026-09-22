/* mod6.js – আইডি ভেরিফিকেশন: NID/পাসপোর্ট (শিক্ষক/অভিভাবক) বা স্কুল/কলেজ/বিশ্ববিদ্যালয়ের আইডি কার্ড (শিক্ষার্থী)।
   ছবি ছোট করে Firestore-এ (base64) জমা হয়, অ্যাডমিন প্যানেল থেকে অনুমোদন/বাতিল করা যায়। */
(function () {
  var MAXDIM = 1000, QUALITY = 0.62, MAXLEN = 850000;

  var st = document.createElement('style');
  st.textContent = `
  #dVerify .in{margin-top:4px}
  .vbadge{display:inline-flex;align-items:center;gap:6px;font-size:.85rem;font-weight:600;border-radius:999px;padding:5px 12px;margin-top:10px}
  .vbadge.ok{background:#E1F5EE;color:#0F6E56}
  .vbadge.pending{background:#FFF6DD;color:#8A6410}
  .vbadge.rejected{background:#FDEBEA;color:#B3261E}
  .vbadge.none{background:#F1F5F9;color:#3D4D5E}
  #vBadgeBox .btn{margin-top:8px}
  #vBadgeBox .vnote{font-size:.85rem;color:var(--muted);margin:6px 0 0}
  #verifyPanel{background:#fff;border:1.5px solid var(--primary);border-radius:14px;padding:14px;margin-bottom:14px}
  #verifyPanel h2{font-size:1.1rem;margin:0 0 8px}
  #verifyPanel .vrow{border:.5px solid var(--line);border-radius:12px;padding:10px;margin-bottom:10px;display:grid;gap:6px}
  #verifyPanel img{max-width:100%;border-radius:8px;border:.5px solid var(--line)}
  #verifyPanel .vacts{display:flex;gap:8px;margin-top:6px}
  `;
  document.head.appendChild(st);

  var DOCT = { nid: 'জাতীয় পরিচয়পত্র (NID)', passport: 'পাসপোর্ট', student: 'শিক্ষা প্রতিষ্ঠানের আইডি কার্ড' };
  var STATUS_LABEL = { pending: 'যাচাই চলছে', approved: 'ভেরিফায়েড', rejected: 'প্রত্যাখ্যাত' };

  /* ---------- সাবমিট ডায়ালগ ---------- */
  var d = document.createElement('dialog');
  d.id = 'dVerify';
  d.innerHTML =
    '<div class="dlg"><button type="button" class="x" data-close aria-label="বন্ধ করুন">×</button>' +
    '<h2>আইডি ভেরিফিকেশন</h2>' +
    '<p class="note" style="margin:0 0 10px">ছবি শুধু অ্যাডমিন যাচাইয়ের জন্য ব্যবহার হয়, অন্য কেউ দেখতে পায় না।</p>' +
    '<label>ডকুমেন্টের ধরন</label>' +
    '<div class="seg" id="vTypeSeg"></div>' +
    '<label for="vFile">ছবি বেছে নিন (স্পষ্ট, সব তথ্য দেখা যায় এমন)</label>' +
    '<input id="vFile" type="file" accept="image/*" capture="environment" class="in">' +
    '<img id="vPreview" style="max-width:100%;border-radius:10px;margin-top:8px;display:none">' +
    '<p class="note" id="vMsg"></p>' +
    '<button type="button" class="btn submit" id="vGo">জমা দিন</button></div>';
  document.body.appendChild(d);

  function typeOptionsFor(role) {
    if (role === 'student') return [['student', DOCT.student], ['nid', DOCT.nid]];
    return [['nid', DOCT.nid], ['passport', DOCT.passport]];
  }
  function openVerify() {
    if (!me || !profile) return;
    var opts = typeOptionsFor(profile.role);
    document.getElementById('vTypeSeg').innerHTML = opts.map(function (o, i) {
      return '<label><input type="radio" name="vtype" value="' + o[0] + '"' + (i === 0 ? ' checked' : '') + '><span>' + o[1] + '</span></label>';
    }).join('');
    document.getElementById('vFile').value = '';
    document.getElementById('vPreview').style.display = 'none';
    document.getElementById('vMsg').textContent = '';
    d.showModal();
  }

  function compress(file) {
    return new Promise(function (res, rej) {
      var img = new Image(), url = URL.createObjectURL(file);
      img.onload = function () {
        var w = img.width, h = img.height;
        if (w > MAXDIM) { h = Math.round(h * (MAXDIM / w)); w = MAXDIM; }
        var c = document.createElement('canvas'); c.width = w; c.height = h;
        c.getContext('2d').drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        res(c.toDataURL('image/jpeg', QUALITY));
      };
      img.onerror = function () { URL.revokeObjectURL(url); rej(new Error('ছবি পড়া যায়নি')); };
      img.src = url;
    });
  }

  document.getElementById('vFile').addEventListener('change', async function (e) {
    var f = e.target.files[0]; if (!f) return;
    var msg = document.getElementById('vMsg'); msg.textContent = 'ছবি প্রস্তুত হচ্ছে…';
    try {
      var data = await compress(f);
      if (data.length > MAXLEN) { msg.textContent = 'ছবিটি এখনো বড়। আরেকটু কাছ থেকে বা কম রেজোলিউশনে তুলুন।'; return; }
      var pv = document.getElementById('vPreview'); pv.src = data; pv.style.display = 'block';
      pv.dataset.val = data;
      msg.textContent = 'ছবি ঠিক আছে। এবার "জমা দিন" চাপুন।';
    } catch (err) { msg.textContent = 'ছবি প্রসেস করা যায়নি, আরেকবার চেষ্টা করুন।'; }
  });

  document.getElementById('vGo').addEventListener('click', async function () {
    var pv = document.getElementById('vPreview'), data = pv.dataset.val;
    if (!data) return document.getElementById('vMsg').textContent = 'আগে একটা ছবি বেছে নিন।';
    var type = document.querySelector('input[name=vtype]:checked').value;
    var btn = this; btn.disabled = true;
    try {
      await db.collection('verifications').doc(me.uid).set({
        uid: me.uid, name: profile.name || '', role: profile.role || '', docType: type,
        image: data, status: 'pending', createdAt: TS()
      });
      d.close(); toast('জমা হয়েছে। যাচাইয়ের পর প্রোফাইলে "ভেরিফায়েড" দেখাবে।');
      renderVBadge();
    } catch (e) { document.getElementById('vMsg').textContent = errMsg ? errMsg(e) : 'জমা হয়নি, আবার চেষ্টা করুন।'; }
    finally { btn.disabled = false; }
  });

  /* ---------- প্রোফাইলে ব্যাজ ---------- */
  async function renderVBadge() {
    var head = document.querySelector('#profileBody .profile-head');
    if (!head || !me || !profile) return;
    var old = document.getElementById('vBadgeBox'); if (old) old.remove();
    var box = document.createElement('div'); box.id = 'vBadgeBox';
    box.innerHTML = '<p class="vnote">লোড হচ্ছে…</p>';
    head.appendChild(box);
    try {
      var s = await db.collection('verifications').doc(me.uid).get();
      if (!s.exists) {
        box.innerHTML = '<span class="vbadge none">🆔 অ্যাকাউন্ট ভেরিফায়েড নয়</span><br>' +
          '<button class="btn sm line" id="vOpenBtn">আইডি ভেরিফাই করুন</button>';
      } else {
        var v = s.data();
        if (v.status === 'approved') box.innerHTML = '<span class="vbadge ok">✅ ভেরিফায়েড</span>';
        else if (v.status === 'pending') box.innerHTML = '<span class="vbadge pending">⏳ যাচাই চলছে</span><p class="vnote">' + esc(DOCT[v.docType] || '') + ' জমা দিয়েছেন।</p>';
        else box.innerHTML = '<span class="vbadge rejected">❌ প্রত্যাখ্যাত</span><p class="vnote">' + esc(v.note || 'ছবি স্পষ্ট ছিল না বা তথ্য মেলেনি।') + '</p><button class="btn sm line" id="vOpenBtn">আবার জমা দিন</button>';
      }
      var b = document.getElementById('vOpenBtn'); if (b) b.addEventListener('click', openVerify);
    } catch (e) { box.innerHTML = '<p class="vnote">ভেরিফিকেশনের তথ্য লোড হয়নি।</p>'; }
  }
  var pBox = document.getElementById('profileBody');
  if (pBox) new MutationObserver(function () { if (document.querySelector('#profileBody .profile-head') && !document.getElementById('vBadgeBox')) renderVBadge(); }).observe(pBox, { childList: true, subtree: true });

  /* ---------- অ্যাডমিন প্যানেল ---------- */
  function panelHtml() { return '<div id="verifyPanel"><h2>🆔 আইডি ভেরিফিকেশন</h2><div id="vpOut">লোড হচ্ছে…</div></div>'; }

  async function loadPending() {
    var out = document.getElementById('vpOut'); if (!out) return;
    try {
      var s = await db.collection('verifications').where('status', '==', 'pending').limit(30).get();
      if (s.empty) { out.innerHTML = '<p class="note">পেন্ডিং ভেরিফিকেশন নেই।</p>'; return; }
      out.innerHTML = s.docs.map(function (doc) {
        var v = doc.data();
        return '<div class="vrow" data-uid="' + doc.id + '">' +
          '<b>' + esc(v.name || '?') + '</b> <span class="badge">' + esc({ student: 'শিক্ষার্থী', teacher: 'শিক্ষক', parent: 'অভিভাবক' }[v.role] || v.role) + '</span>' +
          '<small>' + esc(DOCT[v.docType] || v.docType) + '</small>' +
          '<img src="' + v.image + '" alt="আইডি ছবি">' +
          '<div class="vacts"><button class="btn sm" data-vact="approve">অনুমোদন</button><button class="btn sm danger" data-vact="reject">বাতিল</button></div>' +
          '</div>';
      }).join('');
    } catch (e) { out.innerHTML = '<p class="note">লোড হয়নি: ' + esc(e.code || e.message) + '</p>'; }
  }

  document.body.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-vact]'); if (!b) return;
    var row = b.closest('.vrow'), uid = row.dataset.uid, act = b.dataset.vact;
    b.disabled = true;
    try {
      if (act === 'approve') {
        await db.collection('verifications').doc(uid).update({ status: 'approved', reviewedAt: TS() });
      } else {
        var note = prompt('বাতিলের কারণ (ঐচ্ছিক):') || '';
        await db.collection('verifications').doc(uid).update({ status: 'rejected', note: note.slice(0, 200), reviewedAt: TS() });
      }
      row.remove();
    } catch (e) { toast(errMsg ? errMsg(e) : 'সমস্যা হয়েছে'); b.disabled = false; }
  });

  function injectAdmin() {
    var box = document.getElementById('adminBody');
    if (!box || typeof isAdmin === 'undefined' || !isAdmin) return;
    if (document.getElementById('verifyPanel') || box.querySelector('.skel') || !box.firstChild) return;
    box.insertAdjacentHTML('afterbegin', panelHtml());
    loadPending();
  }
  var aBox = document.getElementById('adminBody');
  if (aBox) new MutationObserver(injectAdmin).observe(aBox, { childList: true });
})();

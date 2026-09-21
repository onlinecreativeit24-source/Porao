/* mod4.js – ইমেইল বার্তা সিস্টেম (EmailJS দিয়ে, অ্যাডমিন প্যানেল থেকে পাঠানো হয়)
   ১) লগইন করা ইউজারের ইমেইল mailList কালেকশনে জমা হয়
   ২) অ্যাডমিন প্যানেলে "ইমেইল রিমাইন্ডার" বক্স আসে: যারা সাইন আপ করেছে কিন্তু পোস্ট দেয়নি তাদের ইমেইল পাঠানো যায় */
(function () {
  var SITE = 'https://onlinecreativeit24-source.github.io/Porao/';
  var GAP = 24 * 60 * 60 * 1000;   /* একই জনকে ২৪ ঘণ্টার মধ্যে আবার পাঠানো হবে না */
  var MAX = 40;                    /* একবারে সর্বোচ্চ কতজনকে পাঠানো হবে */
  var LS = 'porao_emailjs';

  function cfg() { try { return JSON.parse(localStorage.getItem(LS) || '{}'); } catch (e) { return {}; } }
  function saveCfg(o) { try { localStorage.setItem(LS, JSON.stringify(o)); } catch (e) { /* ignore */ } }

  /* ---------- ১) ইউজারের ইমেইল জমা ---------- */
  var failUntil = 0;
  async function register() {
    if (!me || !profile || !me.email || /@porao\.app$/.test(me.email)) return;
    if (Date.now() < failUntil) return;
    var k = 'porao_ml_' + me.uid, v = (profile.role || '') + '|' + me.email;
    try { if (localStorage.getItem(k) === v) return; } catch (e) { /* ignore */ }
    try {
      await db.collection('mailList').doc(me.uid).set({
        uid: me.uid, email: me.email, name: profile.name || '', role: profile.role || 'student', updatedAt: TS()
      }, { merge: true });
      try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    } catch (e) { failUntil = Date.now() + 10 * 60 * 1000; /* রুলস না থাকলে ১০ মিনিট পর আবার চেষ্টা */ }
  }
  setInterval(register, 10000);

  /* ---------- ২) অ্যাডমিন প্যানেল ---------- */
  var st = document.createElement('style');
  st.textContent = `
  #mailPanel{background:#fff;border:1.5px solid var(--primary);border-radius:14px;padding:14px;margin-bottom:14px}
  #mailPanel h2{font-size:1.1rem;margin:0 0 6px}
  #mailPanel input{width:100%;padding:8px 10px;border:1.5px solid #C9D3DF;border-radius:10px;margin:4px 0 8px;font-size:.92rem}
  #mailPanel .mp-btns{display:flex;flex-wrap:wrap;gap:8px;margin-top:4px}
  #mailPanel .mp-out{margin-top:10px;font-size:.9rem;line-height:1.6;white-space:pre-line}
  `;
  document.head.appendChild(st);

  function loadSdk() {
    return new Promise(function (res, rej) {
      if (window.emailjs) return res();
      var s = document.createElement('script');
      s.src = 'https://cdn.jsdelivr.net/npm/@emailjs/browser@4/dist/email.min.js';
      s.onload = res; s.onerror = function () { rej(new Error('EmailJS লোড হয়নি, ইন্টারনেট চেক করুন।')); };
      document.head.appendChild(s);
    });
  }

  function subject() { return 'পড়াও: আপনার প্রথম পোস্টটি দিন'; }
  function message(u) {
    var r = u.role, name = u.name || 'বন্ধু', mid;
    if (r === 'teacher') {
      mid = 'আপনি পড়াওতে একজন শিক্ষক হিসেবে যোগ দিয়েছেন। "টিউশন দিতে চাই" পোস্ট দিলে শিক্ষার্থী ও অভিভাবকরা আপনাকে খুঁজে পাবে এবং সরাসরি ফোন করবে। এছাড়া "টিউটর চাই" পোস্টগুলো দেখে আপনিও যোগাযোগ করতে পারবেন।';
    } else if (r === 'parent') {
      mid = 'আপনি পড়াওতে অভিভাবক হিসেবে যোগ দিয়েছেন। সন্তানের জন্য "টিউটর চাই" পোস্ট দিলে আপনার এলাকার শিক্ষকরা দেখে সরাসরি আপনাকে ফোন করবেন।';
    } else {
      mid = 'আপনি পড়াওতে শিক্ষার্থী হিসেবে যোগ দিয়েছেন। "টিউটর চাই" পোস্ট দিলে আপনার এলাকার শিক্ষকরা দেখে সরাসরি আপনাকে ফোন করবেন।';
    }
    return 'প্রিয় ' + name + ',\n\nপড়াওতে যোগ দেওয়ার জন্য ধন্যবাদ। আপনি এখনো কোনো পোস্ট দেননি।\n\n' + mid +
      '\n\nকীভাবে পোস্ট করবেন:\n১. নিচের লিংকে গিয়ে লগইন করুন\n২. হলুদ "পোস্ট করুন" বাটন চাপুন\n৩. পোস্টের ধরন বেছে নিন\n৪. বিষয়, শ্রেণি, জেলা, এলাকা ও বেতন লিখুন\n৫. মোবাইল নম্বর দিন (এটা সবার সামনে দেখানো হয় না) এবং পোস্ট করুন\n\n' +
      'পড়াও খুলুন: ' + SITE + '\n\nধন্যবাদ,\nপড়াও টিম\n\n(এই মেইল আর না পেতে চাইলে উত্তরে জানান।)';
  }

  async function targets() {
    var ml = await db.collection('mailList').limit(500).get();
    var ps = await db.collection('posts').limit(1000).get();
    var posted = new Set(ps.docs.map(function (d) { return d.data().uid; }));
    var now = Date.now();
    return ml.docs.map(function (d) { return d.data(); }).filter(function (u) {
      if (!u.email || posted.has(u.uid)) return false;
      var last = u.lastMailAt && u.lastMailAt.toMillis ? u.lastMailAt.toMillis() : 0;
      return now - last >= GAP;
    });
  }

  function panelHtml() {
    var c = cfg();
    return '<div id="mailPanel"><h2>📧 ইমেইল রিমাইন্ডার</h2>' +
      '<p class="note" style="margin:0 0 8px">যারা সাইন আপ করেছে কিন্তু পোস্ট দেয়নি তাদের ইমেইল পাঠান। একবারে সর্বোচ্চ ' + MAX + ' জন, একই জনকে ২৪ ঘণ্টায় একবার।</p>' +
      '<input id="mpSvc" placeholder="EmailJS Service ID" value="' + esc(c.service || '') + '">' +
      '<input id="mpTpl" placeholder="EmailJS Template ID" value="' + esc(c.template || '') + '">' +
      '<input id="mpKey" placeholder="EmailJS Public Key" value="' + esc(c.key || '') + '">' +
      '<div class="mp-btns"><button class="btn sm line" data-mp="save">সেভ</button>' +
      '<button class="btn sm line" data-mp="count">কারা বাকি দেখুন</button>' +
      '<button class="btn sm" data-mp="send">ইমেইল পাঠান</button></div>' +
      '<div class="mp-out" id="mpOut"></div></div>';
  }

  function out(t) { var o = document.getElementById('mpOut'); if (o) o.textContent = t; }
  function readCfg() {
    var c = { service: document.getElementById('mpSvc').value.trim(), template: document.getElementById('mpTpl').value.trim(), key: document.getElementById('mpKey').value.trim() };
    saveCfg(c); return c;
  }

  var sending = false;
  async function onClick(e) {
    var b = e.target.closest('[data-mp]'); if (!b) return;
    var a = b.dataset.mp, c = readCfg();
    if (a === 'save') return out('সেভ হয়েছে।');
    try {
      out('খোঁজা হচ্ছে…');
      var list = await targets();
      if (a === 'count') {
        return out('ইমেইল পাঠানোর যোগ্য: ' + list.length + ' জন (যারা সাইন আপ করে পোস্ট দেয়নি এবং ২৪ ঘণ্টায় মেইল পায়নি)।\n' +
          (list.slice(0, 10).map(function (u) { return '• ' + (u.name || '?') + ' – ' + u.email; }).join('\n')));
      }
      if (sending) return;
      if (!c.service || !c.template || !c.key) return out('আগে EmailJS-এর তিনটা তথ্য বসিয়ে সেভ করুন।');
      if (!list.length) return out('পাঠানোর মতো কেউ নেই।');
      var batch = list.slice(0, MAX);
      if (!confirm(batch.length + ' জনকে ইমেইল পাঠানো হবে। চালিয়ে যাবেন?')) return out('বাতিল করা হয়েছে।');
      sending = true; b.disabled = true;
      await loadSdk();
      var ok = 0;
      for (var i = 0; i < batch.length; i++) {
        var u = batch[i];
        out('পাঠানো হচ্ছে… ' + (i + 1) + '/' + batch.length + ' (সফল ' + ok + ')');
        await emailjs.send(c.service, c.template, { to_email: u.email, to_name: u.name || 'বন্ধু', subject: subject(), message: message(u) }, { publicKey: c.key });
        await db.collection('mailList').doc(u.uid).update({ lastMailAt: TS() });
        ok++;
        await new Promise(function (r) { setTimeout(r, 1200); });
      }
      out('✅ ' + ok + ' জনকে ইমেইল পাঠানো হয়েছে।');
    } catch (err) {
      out('❌ ' + (err && (err.text || err.message || err.code) || 'সমস্যা হয়েছে') + '\n(EmailJS-এর তথ্য বা Firestore Rules চেক করুন)');
    } finally { sending = false; b.disabled = false; }
  }

  function inject() {
    var box = document.getElementById('adminBody');
    if (!box || typeof isAdmin === 'undefined' || !isAdmin) return;
    if (document.getElementById('mailPanel') || box.querySelector('.skel') || !box.firstChild) return;
    box.insertAdjacentHTML('afterbegin', panelHtml());
    document.getElementById('mailPanel').addEventListener('click', onClick);
  }
  var box = document.getElementById('adminBody');
  if (box) new MutationObserver(inject).observe(box, { childList: true });
})();

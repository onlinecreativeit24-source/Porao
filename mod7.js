/* mod7.js – আইডি ভেরিফিকেশন বাধ্যতামূলকতা:
   - নতুন অ্যাকাউন্ট (এই ফিচার চালুর পর তৈরি): সাইন আপের পরপরই ভেরিফিকেশন বাধ্যতামূলক পপআপ, ভেরিফাই বা অন্তত জমা না দেওয়া পর্যন্ত অন্য কাজ (পোস্ট, নম্বর দেখা) করা যাবে না।
   - পুরোনো অ্যাকাউন্ট (এই ফিচারের আগে তৈরি): ভেরিফিকেশন ঐচ্ছিক, শুধু মাঝে মাঝে অনুরোধের নোটিফিকেশন দেখাবে।
   এই ফাইলটা mod6.js-এর পরে লোড হওয়া আবশ্যক (verifications কালেকশন ও dVerify ডায়ালগ mod6.js বানায়)। */
(function () {
  /* এই তারিখের আগে তৈরি অ্যাকাউন্ট = পুরোনো (ঐচ্ছিক)। GitHub-এ mod7.js আপলোডের নিজের তারিখ এখানে বসান দরকার হলে। */
  var CUTOFF = new Date('2026-09-21T00:00:00Z').getTime();
  var REMIND_GAP = 5 * 60 * 60 * 1000; /* পুরোনোদের জন্য প্রতি ৫ ঘণ্টায় একবার নোটিফিকেশন */

  function isNewAccount() {
    if (!profile || !profile.createdAt || !profile.createdAt.toMillis) return false;
    return profile.createdAt.toMillis() >= CUTOFF;
  }

  /* ---------- বাধ্যতামূলক লক (নতুন অ্যাকাউন্ট) ---------- */
  var lockStyle = document.createElement('style');
  lockStyle.textContent = `
  #vLock{position:fixed;inset:0;z-index:80;background:rgba(10,25,40,.72);display:flex;align-items:center;justify-content:center;padding:20px}
  #vLock .card{background:#fff;border-radius:18px;max-width:420px;width:100%;padding:24px;text-align:center;max-height:88vh;overflow:auto}
  #vLock .ic{width:64px;height:64px;border-radius:50%;background:#FFF6DD;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 12px}
  #vLock h2{margin:0 0 8px;color:var(--primary)}
  #vLock p{color:var(--muted);line-height:1.7;margin:0 0 16px}
  #vLock .btn{width:100%;margin-top:8px}
  `;
  document.head.appendChild(lockStyle);

  var lockShown = false;
  function showLock(status) {
    if (document.getElementById('vLock')) return;
    lockShown = true;
    var box = document.createElement('div'); box.id = 'vLock';
    var body;
    if (status === 'pending') {
      body = '<div class="ic">⏳</div><h2>যাচাই চলছে</h2><p>আপনার আইডি জমা হয়েছে। অ্যাডমিন যাচাই করার পর আপনি পোস্ট করতে ও যোগাযোগ দেখতে পারবেন। সাধারণত কিছু সময়ের মধ্যেই হয়ে যায়।</p><button class="btn line" id="vlClose">পরে দেখব</button>';
    } else {
      body = '<div class="ic">🆔</div><h2>আইডি ভেরিফিকেশন প্রয়োজন</h2><p>নতুন অ্যাকাউন্টের জন্য আইডি ভেরিফিকেশন বাধ্যতামূলক। এটা সবার নিরাপত্তার জন্য, শিক্ষকদের জন্য NID/পাসপোর্ট, শিক্ষার্থীদের জন্য শিক্ষা প্রতিষ্ঠানের আইডি কার্ড বা NID দিন।</p><button class="btn" id="vlOpen">এখনই ভেরিফাই করুন</button>';
    }
    box.innerHTML = '<div class="card">' + body + '</div>';
    document.body.appendChild(box);
    var oc = document.getElementById('vlOpen'); if (oc) oc.addEventListener('click', function () { document.getElementById('dVerify').showModal(); });
    var cc = document.getElementById('vlClose'); if (cc) cc.addEventListener('click', function () { box.remove(); lockShown = false; });
  }

  async function checkLock() {
    if (!me || !profile || !isNewAccount()) return;
    if (document.querySelector('dialog[open]')) return;
    try {
      var s = await db.collection('verifications').doc(me.uid).get();
      if (!s.exists) return showLock('none');
      var v = s.data();
      if (v.status === 'pending') return showLock('pending');
      if (v.status === 'rejected') return showLock('none');
      /* approved হলে কিছু দেখাবে না */
      var box = document.getElementById('vLock'); if (box) box.remove();
    } catch (e) { /* চুপচাপ বাদ দিন */ }
  }
  setTimeout(checkLock, 4000);
  setInterval(checkLock, 60000);
  /* dVerify বন্ধ করলে আবার লক দেখানো (approved না হওয়া পর্যন্ত) */
  document.addEventListener('close', function (e) {
    if (e.target && e.target.id === 'dVerify') setTimeout(checkLock, 600);
  }, true);

  /* ---------- ঐচ্ছিক রিমাইন্ডার (পুরোনো অ্যাকাউন্ট) ---------- */
  var st2 = document.createElement('style');
  st2.textContent = `
  #dVOptIn .vo{text-align:center}
  #dVOptIn .ic{width:64px;height:64px;border-radius:50%;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 10px}
  #dVOptIn .btns{display:grid;gap:8px;margin-top:16px}
  #dVOptIn .btn{margin:0;width:100%}
  `;
  document.head.appendChild(st2);

  var od = document.createElement('dialog');
  od.id = 'dVOptIn';
  od.innerHTML = '<div class="dlg"><button type="button" class="x" data-close aria-label="বন্ধ করুন">×</button><div class="vo">' +
    '<div class="ic">🆔</div><h2>আইডি ভেরিফাই করবেন?</h2>' +
    '<p class="note">ভেরিফায়েড অ্যাকাউন্টে অন্যরা বেশি আস্থা রাখে। এটা এখনো ঐচ্ছিক, চাইলে না করলেও অ্যাপ স্বাভাবিকভাবে ব্যবহার করতে পারবেন।</p>' +
    '<div class="btns"><button class="btn" id="voOpen">এখনই ভেরিফাই করুন</button><button class="btn line" data-close>পরে করব</button><button class="link" id="voNever">আর দেখতে চাই না</button></div>' +
    '</div></div>';
  document.body.appendChild(od);
  od.addEventListener('click', function (e) {
    if (e.target.id === 'voOpen') { od.close(); document.getElementById('dVerify').showModal(); }
    if (e.target.id === 'voNever') { try { localStorage.setItem('porao_vopt_never_' + me.uid, '1'); } catch (er) {} od.close(); }
  });

  async function checkOptional() {
    if (!me || !profile || isNewAccount()) return;
    if (document.querySelector('dialog[open]')) return;
    try { if (localStorage.getItem('porao_vopt_never_' + me.uid)) return; } catch (e) {}
    var lastKey = 'porao_vopt_last_' + me.uid;
    var last = 0; try { last = +localStorage.getItem(lastKey) || 0; } catch (e) {}
    if (Date.now() - last < REMIND_GAP) return;
    try {
      var s = await db.collection('verifications').doc(me.uid).get();
      if (s.exists && s.data().status !== 'rejected') return; /* pending বা approved হলে আর বিরক্ত করা হবে না */
      try { localStorage.setItem(lastKey, String(Date.now())); } catch (e) {}
      od.showModal();
    } catch (e) { /* ignore */ }
  }
  setTimeout(checkOptional, 9000);
  setInterval(checkOptional, 10 * 60 * 1000);
})();

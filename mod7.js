/* mod7.js – ঐচ্ছিক আইডি ভেরিফিকেশন রিমাইন্ডার (সবার জন্য, বাধ্যতামূলক নয়)।
   যারা এখনো ভেরিফাই করেননি, তাদের প্রতি ৫ ঘণ্টায় একবার সুবিধাসহ একটা পপআপ দেখাবে। */
(function () {
  var REMIND_GAP = 5 * 60 * 60 * 1000;

  var st = document.createElement('style');
  st.textContent = `
  #dVOptIn .vo{text-align:center}
  #dVOptIn .ic{width:64px;height:64px;border-radius:50%;background:#E1F5EE;display:flex;align-items:center;justify-content:center;font-size:1.8rem;margin:0 auto 10px}
  #dVOptIn ul{text-align:left;margin:10px 0;padding-left:20px;line-height:1.8;font-size:.94rem;color:#2B3A35}
  #dVOptIn .btns{display:grid;gap:8px;margin-top:16px}
  #dVOptIn .btn{margin:0;width:100%}
  `;
  document.head.appendChild(st);

  var od = document.createElement('dialog');
  od.id = 'dVOptIn';
  od.innerHTML = '<div class="dlg"><button type="button" class="x" data-close aria-label="বন্ধ করুন">×</button><div class="vo">' +
    '<div class="ic">🆔</div><h2>আইডি ভেরিফাই করুন</h2>' +
    '<p class="note">এটা এখনো ঐচ্ছিক, না করলেও অ্যাপ স্বাভাবিকভাবে ব্যবহার করতে পারবেন। তবে ভেরিফাই করলে:</p>' +
    '<ul><li>✅ প্রোফাইল ও পোস্টের পাশে "ভেরিফায়েড" ব্যাজ দেখাবে</li>' +
    '<li>✅ আপনার পোস্ট ফিডে সবার আগে দেখানো হবে</li>' +
    '<li>✅ শিক্ষক হলে "সেরা শিক্ষক" তালিকায় ওপরে থাকবেন</li>' +
    '<li>✅ অভিভাবক ও শিক্ষার্থীরা আপনার ওপর বেশি আস্থা রাখবেন</li></ul>' +
    '<div class="btns"><button class="btn" id="voOpen">এখনই ভেরিফাই করুন</button><button class="btn line" data-close>পরে করব</button><button class="link" id="voNever">আর দেখতে চাই না</button></div>' +
    '</div></div>';
  document.body.appendChild(od);
  od.addEventListener('click', function (e) {
    if (e.target.id === 'voOpen') { od.close(); document.getElementById('dVerify').showModal(); }
    if (e.target.id === 'voNever') { try { localStorage.setItem('porao_vopt_never_' + me.uid, '1'); } catch (er) { /* ignore */ } od.close(); }
  });

  async function checkOptional() {
    if (!me || !profile) return;
    if (document.querySelector('dialog[open]')) return;
    try { if (localStorage.getItem('porao_vopt_never_' + me.uid)) return; } catch (e) { /* ignore */ }
    var lastKey = 'porao_vopt_last_' + me.uid;
    var last = 0; try { last = +localStorage.getItem(lastKey) || 0; } catch (e) { /* ignore */ }
    if (Date.now() - last < REMIND_GAP) return;
    try {
      var s = await db.collection('verifications').doc(me.uid).get();
      if (s.exists && s.data().status !== 'rejected') return; /* pending/approved হলে আর বিরক্ত করা হবে না */
      try { localStorage.setItem(lastKey, String(Date.now())); } catch (e) { /* ignore */ }
      od.showModal();
    } catch (e) { /* ignore */ }
  }
  setTimeout(checkOptional, 9000);
  setInterval(checkOptional, 10 * 60 * 1000);
})();

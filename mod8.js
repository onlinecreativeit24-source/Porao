/* mod8.js – ভেরিফায়েড ব্যাজ ও অগ্রাধিকার:
   - ফিডের পোস্টে ও "সেরা শিক্ষক" তালিকায় ভেরিফায়েড অ্যাকাউন্টের পাশে ✔ ব্যাজ দেখায়
   - ভেরিফায়েড অ্যাকাউন্টের পোস্ট/প্রোফাইল তালিকার ওপরে দেখায়
   - অ্যাডমিন অনুমোদন/বাতিল করলে সর্বজনীন ভেরিফাইড-তালিকা (settings/verifiedUsers) আপডেট হয় */
(function () {
  var verifiedSet = new Set();

  var st = document.createElement('style');
  st.textContent = `
  .vmini{display:inline-flex;align-items:center;gap:2px;background:#E1F5EE;color:#0F6E56;border-radius:999px;padding:1px 8px;font-size:.78rem;font-weight:700;margin-left:6px;vertical-align:middle;white-space:nowrap}
  `;
  document.head.appendChild(st);

  async function loadVerified() {
    try {
      var s = await db.collection('settings').doc('verifiedUsers').get();
      var d = s.exists ? s.data() : {};
      var ns = new Set();
      Object.keys(d).forEach(function (k) { if (d[k]) ns.add(k); });
      verifiedSet = ns;
    } catch (e) { /* ignore */ }
  }

  /* ---------- ফিড: ব্যাজ + ভেরিফায়েড আগে ---------- */
  function computeFeedList() {
    var t = $('#fType').value, d = $('#fDistrict').value.trim(), s = $('#fSubject').value.trim().toLowerCase();
    var list = allPosts.filter(function (p) {
      return p.status !== 'closed'
        && (!t || p.type === t)
        && (!d || ((p.district || '') + ' ' + (p.area || '')).includes(d))
        && (!s || ((p.subject || '') + ' ' + (p.title || '') + ' ' + (p.level || '')).toLowerCase().includes(s));
    });
    if (!d && myDistrict()) {
      var near = list.filter(isNear), rest = list.filter(function (p) { return !isNear(p); });
      list = near.concat(rest);
    }
    return list;
  }

  var feedBusy = false;
  function processFeed() {
    if (feedBusy) return; feedBusy = true;
    try {
      var feed = document.getElementById('feed'); if (!feed) return;
      var nodes = feed.querySelectorAll(':scope > .post');
      var list = computeFeedList();
      if (!nodes.length || nodes.length !== list.length) return;
      var pairs = [];
      for (var i = 0; i < nodes.length; i++) pairs.push({ el: nodes[i], p: list[i], v: verifiedSet.has(list[i].uid) });
      pairs.forEach(function (pr) {
        if (pr.v && !pr.el.querySelector('.vmini')) {
          var who = pr.el.querySelector('.who');
          if (who) { var b = document.createElement('span'); b.className = 'vmini'; b.title = 'ভেরিফায়েড অ্যাকাউন্ট'; b.textContent = '✔ ভেরিফায়েড'; who.appendChild(b); }
        }
      });
      var sorted = pairs.slice().sort(function (a, b) { return (b.v ? 1 : 0) - (a.v ? 1 : 0); });
      var changed = sorted.some(function (pr, i) { return pr.el !== pairs[i].el; });
      if (changed) {
        var ref = null;
        for (var c = feed.firstChild; c; c = c.nextSibling) { if (!(c.classList && c.classList.contains('post'))) { ref = c; break; } }
        sorted.forEach(function (pr) { feed.insertBefore(pr.el, ref); });
      }
    } catch (e) { /* নিরাপদভাবে বাদ দিন */ }
    finally { feedBusy = false; }
  }
  var feedEl = document.getElementById('feed');
  if (feedEl) new MutationObserver(function () { setTimeout(processFeed, 30); }).observe(feedEl, { childList: true });

  /* ---------- সেরা শিক্ষক তালিকা: ব্যাজ + ভেরিফায়েড আগে ---------- */
  var tutorBusy = false;
  function processTutors() {
    if (tutorBusy) return; tutorBusy = true;
    try {
      var box = document.getElementById('tutorList'); if (!box) return;
      var nodes = box.querySelectorAll(':scope > .tutor');
      if (typeof tutors === 'undefined' || !nodes.length || nodes.length !== tutors.length) return;
      var pairs = [];
      for (var i = 0; i < nodes.length; i++) pairs.push({ el: nodes[i], t: tutors[i], v: verifiedSet.has(tutors[i].id) });
      pairs.forEach(function (pr) {
        if (pr.v && !pr.el.querySelector('.vmini')) {
          var nameEl = pr.el.querySelector('.grow b');
          if (nameEl) { var b = document.createElement('span'); b.className = 'vmini'; b.title = 'ভেরিফায়েড শিক্ষক'; b.textContent = '✔'; nameEl.appendChild(b); }
        }
      });
      var sorted = pairs.slice().sort(function (a, b) { return (b.v ? 1 : 0) - (a.v ? 1 : 0); });
      var changed = sorted.some(function (pr, i) { return pr.el !== pairs[i].el; });
      if (changed) sorted.forEach(function (pr) { box.appendChild(pr.el); });
    } catch (e) { /* ignore */ }
    finally { tutorBusy = false; }
  }
  var tBox = document.getElementById('tutorList');
  if (tBox) new MutationObserver(function () { setTimeout(processTutors, 30); }).observe(tBox, { childList: true });

  /* ---------- শুরুতে ও নিয়মিত রিফ্রেশ ---------- */
  function refreshAll() { loadVerified().then(function () { processFeed(); processTutors(); }); }
  refreshAll();
  setInterval(refreshAll, 2 * 60 * 1000);

  /* ---------- অ্যাডমিন অনুমোদন/বাতিল করলে সর্বজনীন তালিকা আপডেট (mod6.js-এর পাশাপাশি) ---------- */
  document.body.addEventListener('click', async function (e) {
    var b = e.target.closest('[data-vact]'); if (!b) return;
    var row = b.closest('.vrow'); if (!row) return;
    var uid = row.dataset.uid, act = b.dataset.vact;
    try {
      var upd = {};
      if (act === 'approve') { upd[uid] = true; }
      else { upd[uid] = firebase.firestore.FieldValue.delete(); }
      await db.collection('settings').doc('verifiedUsers').set(upd, { merge: true });
      setTimeout(refreshAll, 500);
    } catch (er) { /* মূল অনুমোদন/বাতিল mod6.js দিয়েই হয়ে যায়, এটা শুধু ব্যাজের জন্য */ }
  });
})();

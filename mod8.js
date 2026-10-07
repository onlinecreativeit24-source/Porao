/* mod8.js – ভেরিফায়েড ব্যাজ:
   - ফিডের পোস্টে ও "সেরা শিক্ষক" তালিকায় ভেরিফায়েড অ্যাকাউন্টের পাশে ✔ ব্যাজ দেখায়
   - "সেরা শিক্ষক" তালিকায় ভেরিফায়েড শিক্ষক ওপরে থাকে (আঁকার আগেই সাজানো, তাই লাফায় না)
   - ফিডের পোস্টের ক্রম বদলায় না (নতুন পোস্ট সবার ওপরে থাকে)
   - অ্যাডমিন অনুমোদন/বাতিল করলে সর্বজনীন ভেরিফাইড-তালিকা (settings/verifiedUsers) আপডেট হয় */
(function () {
  var verifiedSet = new Set();

  var st = document.createElement('style');
  st.textContent = `
  .vmini{display:inline-flex;align-items:center;gap:2px;background:#E1F5EE;color:#0F6E56;border-radius:999px;padding:1px 8px;font-size:.78rem;font-weight:700;margin-left:6px;vertical-align:middle;white-space:nowrap}
  `;
  document.head.appendChild(st);

  function vKey() { return Array.from(verifiedSet).sort().join(','); }

  async function loadVerified() {
    try {
      var s = await db.collection('settings').doc('verifiedUsers').get();
      var d = s.exists ? s.data() : {};
      var ns = new Set();
      Object.keys(d).forEach(function (k) { if (d[k]) ns.add(k); });
      var before = vKey();
      verifiedSet = ns;
      return before !== vKey(); /* তালিকা বদলেছে কি না */
    } catch (e) { return false; }
  }

  /* ---------- ফিড: শুধু ব্যাজ, ক্রম বদলানো হয় না ---------- */
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
      for (var i = 0; i < nodes.length; i++) {
        if (verifiedSet.has(list[i].uid) && !nodes[i].querySelector('.vmini')) {
          var who = nodes[i].querySelector('.who');
          if (who) {
            var b = document.createElement('span');
            b.className = 'vmini';
            b.title = 'ভেরিফায়েড অ্যাকাউন্ট';
            b.textContent = '✔ ভেরিফায়েড';
            who.appendChild(b);
          }
        }
      }
    } catch (e) { /* নিরাপদভাবে বাদ দিন */ }
    finally { feedBusy = false; }
  }
  var feedEl = document.getElementById('feed');
  if (feedEl) new MutationObserver(function () { setTimeout(processFeed, 30); }).observe(feedEl, { childList: true });

  /* ---------- সেরা শিক্ষক তালিকা: আঁকার আগেই সাজানো + ব্যাজ ---------- */
  var origRenderTutors = renderTutors;
  renderTutors = function () {
    try {
      if (typeof tutors !== 'undefined' && tutors.length) {
        /* স্থিতিশীল সাজানো: ভেরিফায়েড আগে, বাকিদের রেটিং-ক্রম অপরিবর্তিত */
        tutors.sort(function (a, b) { return (verifiedSet.has(b.id) ? 1 : 0) - (verifiedSet.has(a.id) ? 1 : 0); });
      }
    } catch (e) { /* ignore */ }
    origRenderTutors();
    try {
      var nodes = document.querySelectorAll('#tutorList > .tutor');
      if (typeof tutors !== 'undefined' && nodes.length === tutors.length) {
        for (var i = 0; i < nodes.length; i++) {
          if (verifiedSet.has(tutors[i].id) && !nodes[i].querySelector('.vmini')) {
            var nameEl = nodes[i].querySelector('.grow b');
            if (nameEl) {
              var b = document.createElement('span');
              b.className = 'vmini';
              b.title = 'ভেরিফায়েড শিক্ষক';
              b.textContent = '✔';
              nameEl.appendChild(b);
            }
          }
        }
      }
    } catch (e) { /* ignore */ }
  };

  /* ---------- শুরুতে ও নিয়মিত রিফ্রেশ (তালিকা বদলালে তবেই আবার আঁকা) ---------- */
  function refreshAll() {
    loadVerified().then(function (changed) {
      processFeed();
      if (changed) renderTutors();
    });
  }
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

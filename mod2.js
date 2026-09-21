/* mod2.js – পোস্ট ডায়াগনস্টিক (শুধু লিংকের শেষে ?debug=1 দিলে চালু হয়, সাধারণ ইউজার কিছু দেখবে না) */
(function () {
  if (!/[?&]debug=1/.test(location.search)) return;
  var box = document.createElement('div');
  box.style.cssText = 'position:fixed;left:8px;right:8px;top:70px;bottom:90px;z-index:60;background:#fff;border:2px solid #1F5F8B;border-radius:12px;padding:12px;overflow:auto;font-size:13px;line-height:1.6;box-shadow:0 8px 30px rgba(0,0,0,.35)';
  box.innerHTML = '<button type="button" style="position:absolute;top:6px;right:10px;border:0;background:none;font-size:22px" onclick="this.parentNode.remove()">×</button><b>🔧 পোস্ট ডায়াগনস্টিক</b><div id="dbgOut" style="margin-top:8px">লোড হচ্ছে…</div>';
  document.body.appendChild(box);

  function cnt(arr, f) { var m = {}; arr.forEach(function (x) { var k = f(x) || '—'; m[k] = (m[k] || 0) + 1; }); return Object.keys(m).map(function (k) { return k + ': ' + m[k]; }).join(', ') || '—'; }

  async function run() {
    var o = [];
    o.push('👤 লগইন: ' + (me ? (me.email || me.uid) : 'নেই') + ' | রোল: ' + (profile ? profile.role : '-'));
    try {
      var s = await db.collection('posts').limit(300).get();
      var all = s.docs.map(function (d) { return Object.assign({ id: d.id }, d.data()); });
      o.push('📦 ডাটাবেসে মোট পোস্ট: <b>' + all.length + '</b>');
      o.push('ধরন: ' + cnt(all, function (p) { return p.type; }));
      o.push('কে দিয়েছে: ' + cnt(all, function (p) { return p.role; }));
      o.push('স্ট্যাটাস: ' + cnt(all, function (p) { return p.status; }));
      var noTime = all.filter(function (p) { return !p.createdAt; });
      if (noTime.length) o.push('⚠️ <b>' + noTime.length + 'টি পোস্টে createdAt নেই</b> (এগুলো ফিডে আসে না): ' + noTime.map(function (p) { return esc(p.title); }).join(' | '));
      all.sort(function (a, b) { return ((b.createdAt && b.createdAt.seconds) || 0) - ((a.createdAt && a.createdAt.seconds) || 0); });
      o.push('<b>সর্বশেষ ১০টি পোস্ট:</b>');
      all.slice(0, 10).forEach(function (p) {
        o.push('• ' + esc(p.title) + '<br>&nbsp;&nbsp;' + esc(p.role || '?') + ' / ' + esc(p.type || '?') + ' / ' + esc(p.status || '?') + ' / ' + esc(p.district || 'জেলা নেই') + ' / ' + esc(ago(p.createdAt) || 'সময় নেই'));
      });
    } catch (e) { o.push('❌ পোস্ট পড়া যায়নি: <b>' + esc(e.code || e.message) + '</b> (Firestore Rules বা লিমিট চেক করুন)'); }
    o.push('🖥️ ফিডে এখন দেখাচ্ছে: <b>' + allPosts.length + '</b>টি (লিমিট ' + postLimit + ')');
    o.push('🔍 ফিল্টার: ধরন="' + ($('#fType').value || 'সব') + '", জেলা="' + ($('#fDistrict').value || 'নেই') + '", বিষয়="' + ($('#fSubject').value || 'নেই') + '"');
    try {
      var t = await db.collection('tutors').limit(100).get();
      o.push('🎓 শিক্ষক তালিকায়: <b>' + t.size + '</b> জন');
    } catch (e) { o.push('❌ শিক্ষক পড়া যায়নি: ' + esc(e.code || e.message)); }
    document.getElementById('dbgOut').innerHTML = o.join('<br>');
  }
  setTimeout(run, 2500);
})();

/* mod3.js – যারা সাইন আপ করেছে কিন্তু এখনো পোস্ট দেয়নি, তাদের প্রতি ৫ ঘণ্টা পর পর বাংলায় বুঝিয়ে বার্তা দেখানো */
(function () {
  var EVERY = 5 * 60 * 60 * 1000; /* ৫ ঘণ্টা */
  var st = document.createElement('style');
  st.textContent = `
  #dRemind .rm{text-align:center}
  #dRemind .rm-ic{width:68px;height:68px;border-radius:50%;background:#FFF6DD;display:flex;align-items:center;justify-content:center;font-size:2rem;margin:2px auto 8px}
  #dRemind h2{padding:0;margin:0 0 6px;color:var(--primary)}
  #dRemind .rm-role{background:#E8F4FD;border:1px solid #B5D4F4;color:#0C447C;border-radius:12px;padding:10px 14px;line-height:1.7;text-align:left}
  #dRemind .rm-h{text-align:left;font-weight:600;margin:14px 0 4px}
  #dRemind ol.rm-steps{text-align:left;margin:0;padding:0;list-style:none;counter-reset:s}
  #dRemind ol.rm-steps li{counter-increment:s;display:flex;gap:10px;align-items:flex-start;padding:4px 0;line-height:1.5}
  #dRemind ol.rm-steps li::before{content:counter(s);flex:none;width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;font-size:.85rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
  #dRemind ul.rm-rules{text-align:left;margin:0;padding-left:20px;line-height:1.7;font-size:.92rem;color:#2B3A35}
  #dRemind .rm-btns{display:grid;gap:8px;margin-top:16px}
  #dRemind .rm-btns .btn{margin:0;width:100%}
  `;
  document.head.appendChild(st);

  var d = document.createElement('dialog');
  d.id = 'dRemind';
  d.innerHTML = '<div class="dlg"><button type="button" class="x" data-rm="later" aria-label="বন্ধ করুন">×</button><div class="rm" id="rmBody"></div></div>';
  document.body.appendChild(d);

  var TXT = {
    teacher: {
      ic: '🎓', t: 'আপনার প্রথম পোস্টটি দিন!',
      role: '<b>আপনি একজন শিক্ষক।</b> "টিউশন দিতে চাই" পোস্ট দিলে শিক্ষার্থী ও অভিভাবকরা আপনাকে খুঁজে পাবে এবং সরাসরি ফোন করবে। এছাড়া হোমের "টিউটর চাই" পোস্টগুলো দেখে আপনিও যোগাযোগ করতে পারবেন।',
      type: '"টিউশন দিতে চাই"',
      fill: 'কোন বিষয় ও কোন শ্রেণি পড়ান, জেলা ও এলাকা, বেতন এবং কত দিন পড়াতে পারবেন'
    },
    student: {
      ic: '📚', t: 'আপনার টিউটর চাওয়ার পোস্টটি দিন!',
      role: '<b>আপনি একজন শিক্ষার্থী।</b> "টিউটর চাই" পোস্ট দিলে আপনার এলাকার শিক্ষকরা তা দেখে সরাসরি আপনাকে ফোন করবেন। আপনি চাইলে হোমের "সেরা শিক্ষক" থেকেও শিক্ষক বেছে নিতে পারেন।',
      type: '"টিউটর চাই"',
      fill: 'কোন শ্রেণি ও বিষয়ের টিউটর লাগবে, জেলা ও এলাকা, বেতন কত দিতে পারবেন'
    },
    parent: {
      ic: '👨‍👩‍👧', t: 'সন্তানের জন্য টিউটর চেয়ে পোস্ট দিন!',
      role: '<b>আপনি একজন অভিভাবক।</b> "টিউটর চাই" পোস্ট দিলে আপনার এলাকার শিক্ষকরা তা দেখে সরাসরি আপনাকে ফোন করবেন।',
      type: '"টিউটর চাই"',
      fill: 'সন্তানের শ্রেণি ও বিষয়, জেলা ও এলাকা, বেতন কত দিতে পারবেন'
    }
  };

  function body(role) {
    var x = TXT[role] || TXT.student;
    return '<div class="rm-ic">' + x.ic + '</div><h2>' + x.t + '</h2>' +
      '<div class="rm-role">' + x.role + '</div>' +
      '<div class="rm-h">কীভাবে পোস্ট করবেন</div>' +
      '<ol class="rm-steps">' +
      '<li>নিচের মেনুর হলুদ <b>"পোস্ট করুন"</b> বাটন চাপুন</li>' +
      '<li>ধরন হিসেবে ' + x.type + ' বেছে নিন</li>' +
      '<li>লিখুন: ' + x.fill + '</li>' +
      '<li>নিজের মোবাইল নম্বর দিন (এটা সবার সামনে দেখানো হয় না)</li>' +
      '<li><b>"পোস্ট করুন"</b> চাপুন, ব্যস!</li></ol>' +
      '<div class="rm-h">পোস্টের নিয়ম</div>' +
      '<ul class="rm-rules"><li>সঠিক ও সত্য তথ্য দিন</li><li>ভুয়া, বিজ্ঞাপন বা অশোভন পোস্ট দেওয়া যাবে না</li><li>শুধু লগইন করা ব্যবহারকারী আপনার নম্বর দেখতে পায়</li><li>একটা পোস্ট দেওয়ার ১ মিনিট পর আবার পোস্ট দেওয়া যায়</li></ul>' +
      '<div class="rm-btns"><button type="button" class="btn" data-rm="post">এখনই পোস্ট করুন</button>' +
      '<button type="button" class="btn line" data-rm="later">পরে করব</button>' +
      '<button type="button" class="link" data-rm="never">আর এই বার্তা দেখতে চাই না</button></div>';
  }

  function key(k) { return 'porao_rm_' + k + '_' + (me ? me.uid : ''); }
  function get(k) { try { return localStorage.getItem(key(k)); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(key(k), v); } catch (e) { /* ignore */ } }

  d.addEventListener('click', function (e) {
    var b = e.target.closest('[data-rm]'); if (!b) return;
    var a = b.dataset.rm;
    if (a === 'never') set('never', '1');
    d.close();
    if (a === 'post') { try { openPost(); } catch (err) { /* ignore */ } }
  });

  var busy = false;
  async function check() {
    if (busy || !me || !profile || d.open) return;
    if (document.querySelector('dialog[open]')) return;
    if (get('never') || get('posted')) return;
    var last = +get('last') || 0;
    if (Date.now() - last < EVERY) return;
    busy = true;
    try {
      var s = await db.collection('posts').where('uid', '==', me.uid).limit(1).get();
      if (!s.empty) { set('posted', '1'); return; }
      document.getElementById('rmBody').innerHTML = body(profile.role);
      set('last', String(Date.now()));
      d.showModal();
    } catch (e) { /* চুপচাপ বাদ দিন */ }
    finally { busy = false; }
  }

  /* লগইন হওয়ার ৮ সেকেন্ড পর, এরপর প্রতি ১০ মিনিটে পরীক্ষা (অ্যাপ খোলা থাকলে) */
  setTimeout(check, 8000);
  setInterval(check, 10 * 60 * 1000);
})();

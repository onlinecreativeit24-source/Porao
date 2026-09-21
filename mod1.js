/* mod1.js – পাসওয়ার্ড রিসেট নোটিফিকেশন আরও সুন্দর করা */
(function () {
  var st = document.createElement('style');
  st.textContent = `
  #dReset .rs{text-align:center}
  #dReset .rs-ic{width:72px;height:72px;border-radius:50%;background:#E8F4FD;display:flex;align-items:center;justify-content:center;font-size:2.2rem;margin:4px auto 10px}
  #dReset .rs h2{padding:0;margin:0 0 6px;color:var(--primary)}
  #dReset .rs-mail{display:inline-block;max-width:100%;overflow-wrap:anywhere;background:#F1F5F9;border-radius:999px;padding:4px 14px;font-size:.9rem;color:var(--ink);margin:0 0 12px}
  #dReset .rs-warn{background:#FFF6DD;border:1px solid #E8D48A;color:#5B4300;border-radius:12px;padding:10px 14px;line-height:1.7;text-align:left}
  #dReset .rs-warn b{color:#B3261E}
  #dReset .rs-steps{text-align:left;margin:12px 0 0;padding:0;list-style:none;counter-reset:s}
  #dReset .rs-steps li{counter-increment:s;display:flex;gap:10px;align-items:flex-start;padding:6px 0;line-height:1.5}
  #dReset .rs-steps li::before{content:counter(s);flex:none;width:24px;height:24px;border-radius:50%;background:var(--primary);color:#fff;font-size:.85rem;font-weight:700;display:flex;align-items:center;justify-content:center;margin-top:1px}
  `;
  document.head.appendChild(st);

  var d = document.querySelector('#dReset .dlg');
  if (!d) return;
  d.innerHTML = `
    <button type="button" class="x" data-close aria-label="বন্ধ করুন">×</button>
    <div class="rs">
      <div class="rs-ic">📧</div>
      <h2>মেইল পাঠানো হয়েছে!</h2>
      <div class="rs-mail" id="rsMail"></div>
      <div class="rs-warn">🔔 আপনার পাসওয়ার্ড রিসেট লিংক জিমেইলে পাঠানো হয়েছে। ইনবক্সে না পেলে জিমেইলের <b>স্প্যাম (Spam)</b> ফোল্ডারটি দেখুন।</div>
      <ol class="rs-steps">
        <li>জিমেইল অ্যাপ বা ওয়েবসাইট খুলুন</li>
        <li><b>Spam</b> ফোল্ডারে পড়াও / Firebase থেকে আসা মেইলটি খুঁজুন</li>
        <li>মেইলটি খুলে <b>"স্প্যাম নয়" (Not spam)</b> চাপুন</li>
        <li>লিংকে ক্লিক করে নতুন পাসওয়ার্ড সেট করুন</li>
      </ol>
      <p class="note">Google দিয়ে খোলা অ্যাকাউন্টে পাসওয়ার্ড নেই, সেক্ষেত্রে "Google দিয়ে চালিয়ে যান" চাপুন।</p>
      <button type="button" class="btn submit" data-close>ঠিক আছে</button>
    </div>`;
})();

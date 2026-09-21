/* mod5.js – গোপনীয়তা নীতি ও শর্তাবলীর লিংক (ফুটার + সাইন আপ/লগইনে সম্মতির লেখা) */
(function () {
  var st = document.createElement('style');
  st.textContent = `
  #pFoot{max-width:760px;margin:8px auto 0;padding:14px 16px 28px;text-align:center;color:var(--muted);font-size:.88rem;line-height:1.9}
  #pFoot a{color:#185FA5;margin:0 6px}
  #consentNote{font-size:.85rem;color:var(--muted);text-align:center;margin:12px 0 0}
  #consentNote a{color:#185FA5}
  `;
  document.head.appendChild(st);

  var main = document.querySelector('main');
  if (main && !document.getElementById('pFoot')) {
    var f = document.createElement('footer');
    f.id = 'pFoot';
    f.innerHTML = '<a href="privacy.html">গোপনীয়তা নীতি</a>·<a href="terms.html">ব্যবহারের শর্তাবলী</a>·<a href="mailto:onlinecreativeit24@gmail.com">যোগাযোগ</a><br>© পড়াও';
    main.parentNode.insertBefore(f, main.nextSibling);
  }

  var go = document.getElementById('authGo');
  if (go && !document.getElementById('consentNote')) {
    var p = document.createElement('p');
    p.id = 'consentNote';
    p.innerHTML = 'চালিয়ে গেলে আপনি আমাদের <a href="terms.html" target="_blank" rel="noopener">ব্যবহারের শর্তাবলী</a> ও <a href="privacy.html" target="_blank" rel="noopener">গোপনীয়তা নীতি</a> মেনে নিচ্ছেন।';
    go.parentNode.insertBefore(p, go);
  }
})();

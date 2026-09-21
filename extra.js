/* extra.js – অটো-লোডার।
   mod1.js, mod2.js, mod3.js ... এই ক্রমে নিজে থেকে লোড করে, প্রথম যে ফাইল পাওয়া যায় না সেখানে থামে।
   নতুন আপডেট মানে শুধু পরের নম্বরের নতুন ফাইল বানিয়ে আপলোড করা। index.html আর ছুঁতে হবে না। */
(function () {
  var n = 1, v = Math.floor(Date.now() / 600000); /* ১০ মিনিটে একবার ক্যাশ রিফ্রেশ */
  function next() {
    var s = document.createElement('script');
    s.src = 'mod' + n + '.js?v=' + v;
    s.onload = function () { n++; next(); };
    s.onerror = function () { /* আর কোনো mod ফাইল নেই, লোডিং শেষ */ };
    document.body.appendChild(s);
  }
  next();
})();

// apollo.js: mobile nav toggle and carousel arrows for the apollo theme
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.ap-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
  }

  document.querySelectorAll('[data-aprow]').forEach(function (row) {
    var wrap = row.closest('.ap-row-wrap');
    if (!wrap) return;
    var prev = wrap.querySelector('.ap-arrow.prev');
    var next = wrap.querySelector('.ap-arrow.next');
    function scroll(dir) {
      var card = row.querySelector('.ap-scard, .ap-quote');
      var w = card ? card.getBoundingClientRect().width + 20 : 240;
      row.scrollBy({ left: dir * w * 2, behavior: 'smooth' });
    }
    if (prev) prev.addEventListener('click', function () { scroll(-1); });
    if (next) next.addEventListener('click', function () { scroll(1); });
  });
});

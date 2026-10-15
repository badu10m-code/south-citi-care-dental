// apollo.js: burger, stat counters, carousel arrows for the apollo theme
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.ap-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });
  }

  var countersDone = false;
  function runCounters() {
    if (countersDone) return;
    countersDone = true;
    document.querySelectorAll('.ap-stat b [data-count]').forEach(function (el) {
      var target = parseFloat(el.getAttribute('data-count'));
      var decimals = parseInt(el.getAttribute('data-decimals') || '0', 10);
      var start = null;
      function step(ts) {
        if (!start) start = ts;
        var p = Math.min((ts - start) / 1400, 1);
        var eased = 1 - Math.pow(1 - p, 3);
        el.textContent = (target * eased).toFixed(decimals);
        if (p < 1) requestAnimationFrame(step);
        else el.textContent = target.toFixed(decimals);
      }
      requestAnimationFrame(step);
    });
  }
  var stats = document.querySelector('.ap-stats');
  if (stats) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCounters(); io.disconnect(); } });
    }, { threshold: 0.3 });
    io.observe(stats);
  }

  document.querySelectorAll('[data-aprow]').forEach(function (row) {
    var wrap = row.closest('.ap-row-wrap');
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

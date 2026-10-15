// apollo.js: burger, stat counters, carousel arrows for the apollo theme
document.addEventListener('DOMContentLoaded', function () {
  var burger = document.querySelector('.nav-burger');
  var links = document.querySelector('.ap-links');
  if (burger && links) {
    burger.addEventListener('click', function () { links.classList.toggle('open'); });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});  }

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

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});  }
  var stats = document.querySelector('.ap-stats');
  if (stats) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { runCounters(); io.disconnect(); } });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});    }, { threshold: 0.3 });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});    io.observe(stats);
  }

  document.querySelectorAll('[data-aprow]').forEach(function (row) {
    var wrap = row.closest('.ap-row-wrap');
    var prev = wrap.querySelector('.ap-arrow.prev');
    var next = wrap.querySelector('.ap-arrow.next');
    function scroll(dir) {
      var card = row.querySelector('.ap-scard, .ap-quote');
      var w = card ? card.getBoundingClientRect().width + 20 : 240;
      row.scrollBy({ left: dir * w * 2, behavior: 'smooth' });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});    }
    if (prev) prev.addEventListener('click', function () { scroll(-1); });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});    if (next) next.addEventListener('click', function () { scroll(1); });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});  });

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});});

  // hero typewriter
  var tt = document.querySelector('.type-target');
  var caret = document.getElementById('type-caret');
  if (tt) {
    var phrase = tt.getAttribute('data-phrase') || '';
    var i = 0;
    setTimeout(function tick() {
      tt.textContent = phrase.slice(0, ++i);
      if (i < phrase.length) setTimeout(tick, 85);
      else setTimeout(function () { if (caret) caret.style.display = 'none'; }, 2600);
    }, 500);
  }
});
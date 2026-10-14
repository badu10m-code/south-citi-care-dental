// animations.js: counters, typewriter, word-by-word title, hero parallax
document.addEventListener('DOMContentLoaded', function () {
  // Animated counters
  var cio = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (!e.isIntersecting) return;
      cio.unobserve(e.target);
      var el = e.target, end = parseFloat(el.dataset.count), dec = el.dataset.decimals ? parseInt(el.dataset.decimals) : 0;
      var t0 = null;
      function step(ts) {
        if (!t0) t0 = ts;
        var p = Math.min((ts - t0) / 1400, 1);
        p = 1 - Math.pow(1 - p, 3);
        el.textContent = (end * p).toFixed(dec);
        if (p < 1) requestAnimationFrame(step);
      }
      requestAnimationFrame(step);
    });
  }, { threshold: 0.5 });
  document.querySelectorAll('[data-count]').forEach(function (el) { cio.observe(el); });

  // Typewriter
  var tw = document.getElementById('typewriter');
  if (tw) {
    var words = JSON.parse(tw.dataset.words);
    var wi = 0, ci = 0, del = false;
    (function tick() {
      var word = words[wi];
      tw.textContent = word.slice(0, ci);
      if (!del && ci < word.length) { ci++; setTimeout(tick, 70); }
      else if (!del && ci === word.length) { del = true; setTimeout(tick, 1600); }
      else if (del && ci > 0) { ci--; setTimeout(tick, 35); }
      else { del = false; wi = (wi + 1) % words.length; setTimeout(tick, 350); }
    })();
  }

  // Hero background parallax on scroll
  var heroBg = document.getElementById('hero-bg');
  if (heroBg && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var ticking = false;
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        var y = Math.min(window.scrollY, 900);
        heroBg.style.transform = 'translateY(' + (y * 0.22) + 'px)';
        ticking = false;
      });
    }, { passive: true });
  }

  // Word-by-word hero title (keeps the highlight span inside)
  document.querySelectorAll('.words-anim').forEach(function (el) {
    var frag = document.createDocumentFragment();
    Array.prototype.forEach.call(el.childNodes, function (node) {
      if (node.nodeType === 3) { // text node
        node.textContent.split(' ').forEach(function (w) {
          if (!w) return;
          var s = document.createElement('span');
          s.className = 'word'; s.textContent = w;
          frag.appendChild(s); frag.appendChild(document.createTextNode(' '));
        });
      } else if (node.nodeType === 1) {
        node.classList.add('word');
        frag.appendChild(node); frag.appendChild(document.createTextNode(' '));
      }
    });
    el.innerHTML = '';
    el.appendChild(frag);
    var i = 0;
    el.querySelectorAll('.word').forEach(function (w) {
      w.style.animationDelay = (0.25 + i * 0.09) + 's';
      i++;
    });
  });
});

// Shared interactions: reveal, 3D tilt, counters, typewriter, nav, parallax
document.addEventListener('DOMContentLoaded', function () {
  // Page fade-in
  document.body.classList.add('loaded');

  // Scroll reveal
  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  // 3D tilt cards
  document.querySelectorAll('[data-tilt]').forEach(function (card) {
    var glare = card.querySelector('.tilt-glare');
    card.addEventListener('mousemove', function (ev) {
      var r = card.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      card.style.transform = 'perspective(900px) rotateY(' + (x * 10) + 'deg) rotateX(' + (-y * 10) + 'deg) translateY(-4px)';
      if (glare) glare.style.background = 'radial-gradient(circle at ' + ((x + 0.5) * 100) + '% ' + ((y + 0.5) * 100) + '%, rgba(255,255,255,0.35), transparent 55%)';
    });
    card.addEventListener('mouseleave', function () {
      card.style.transform = '';
      if (glare) glare.style.background = 'transparent';
    });
  });

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

  // Hero parallax tooth
  var tooth = document.querySelector('.tooth-float');
  var hero = document.querySelector('.hero-3d');
  if (tooth && hero && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    hero.addEventListener('mousemove', function (ev) {
      var r = hero.getBoundingClientRect();
      var x = (ev.clientX - r.left) / r.width - 0.5;
      var y = (ev.clientY - r.top) / r.height - 0.5;
      tooth.style.transform = 'translate(' + (x * 26) + 'px,' + (y * 20) + 'px) rotateY(' + (x * 14) + 'deg) rotateX(' + (-y * 10) + 'deg)';
    });
    hero.addEventListener('mouseleave', function () { tooth.style.transform = ''; });
  }

  // Word-by-word hero title
  document.querySelectorAll('.words-anim').forEach(function (el) {
    var text = el.textContent; el.textContent = '';
    text.split(' ').forEach(function (w, i) {
      var s = document.createElement('span');
      s.className = 'word'; s.textContent = w;
      s.style.animationDelay = (0.25 + i * 0.09) + 's';
      el.appendChild(s); el.appendChild(document.createTextNode(' '));
    });
  });

  // Mobile nav
  var burger = document.querySelector('.nav-burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.querySelector('.nav-links').classList.toggle('open');
      burger.classList.toggle('active');
    });
  }

  // Footer year
  document.querySelectorAll('.fyear').forEach(function (el) { el.textContent = new Date().getFullYear(); });
});

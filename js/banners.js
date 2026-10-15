// banners.js: homepage banner strip + clinic video section, both driven by the cloud config
(function () {
  function activeBanners(d) {
    var cfg = (d && d.config) || {};
    return (cfg.banners || []).filter(function (b) { return b && b.active !== false; });
  }

  function renderStrip(d) {
    var wrap = document.getElementById('banner-slides');
    var section = document.getElementById('offer-strip');
    if (!wrap || !section) return;
    var list = activeBanners(d);
    if (!list.length) { section.hidden = true; return; }
    section.hidden = false;
    wrap.innerHTML = list.map(bannerHTML).join('');
    var slides = wrap.querySelectorAll('.banner-slide');
    var dots = document.getElementById('banner-dots');
    dots.innerHTML = list.map(function () { return '<button type="button" aria-label="Banner"></button>'; }).join('');
    var cur = 0;
    function show(i) {
      slides.forEach(function (s, j) { s.classList.toggle('on', i === j); });
      dots.querySelectorAll('button').forEach(function (b, j) { b.classList.toggle('on', i === j); });
      cur = i;
    }
    dots.addEventListener('click', function (ev) {
      var btns = Array.prototype.slice.call(dots.querySelectorAll('button'));
      var idx = btns.indexOf(ev.target);
      if (idx > -1) show(idx);
    });
    show(0);
    if (slides.length > 1) setInterval(function () { show((cur + 1) % slides.length); }, 5200);
  }

  function ytId(url) {
    var m = String(url || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(String(url || '').trim()) ? String(url).trim() : '');
  }

  function setupVideo(d) {
    var frame = document.getElementById('video-frame');
    var section = document.getElementById('clinic-video');
    var poster = document.getElementById('video-poster');
    var heroImg = document.getElementById('hero-img');
    if (!frame || !section) return;
    var cfg = (d && d.config) || {};
    var vid = ytId(cfg.heroVideo || 'XqKwE5-wdqw');
    if (heroImg && cfg.heroImage) heroImg.src = cfg.heroImage;
    var playing = false;
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting && vid && !playing) {
          playing = true;
          if (poster) poster.classList.add('playing');
          frame.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + vid +
            '?autoplay=1&mute=1&controls=0&loop=1&playlist=' + vid +
            '&modestbranding=1&rel=0&iv_load_policy=3&disablekb=1&fs=0&playsinline=1" ' +
            'allow="autoplay; encrypted-media" tabindex="-1" title="Clinic tour"></iframe>';
        } else if (!e.isIntersecting && playing) {
          playing = false;
          frame.innerHTML = '';
          if (poster) poster.classList.remove('playing');
        }
      });
    }, { threshold: 0.3 });
    io.observe(section);
  }

  if (typeof binLoad === 'function') {
    binLoad().then(function (d) { renderStrip(d); setupVideo(d); })
      .catch(function () { renderStrip(null); setupVideo(null); });
  } else {
    renderStrip(null); setupVideo(null);
  }
})();

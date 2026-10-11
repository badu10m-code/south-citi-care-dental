// tilt.js: 3D tilt + glare for [data-tilt] cards
document.addEventListener('DOMContentLoaded', function () {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
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
});

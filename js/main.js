// main.js: page fade-in, scroll reveal, mobile nav, footer year
document.addEventListener('DOMContentLoaded', function () {
  document.body.classList.add('loaded');

  var io = new IntersectionObserver(function (es) {
    es.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); io.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { io.observe(el); });

  var burger = document.querySelector('.nav-burger');
  if (burger) {
    burger.addEventListener('click', function () {
      document.querySelector('.nav-links').classList.toggle('open');
      burger.classList.toggle('active');
    });
  }
  document.querySelectorAll('.fyear').forEach(function (el) { el.textContent = new Date().getFullYear(); });
});

// gallery.js: lightbox viewer
document.addEventListener('DOMContentLoaded', function () {
  var lb = document.getElementById('lightbox'), img = lb.querySelector('img');
  document.querySelectorAll('[data-lightbox]').forEach(function (fig) {
    fig.addEventListener('click', function () { img.src = fig.dataset.lightbox; lb.classList.add('open'); });
  });
  lb.addEventListener('click', function () { lb.classList.remove('open'); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') lb.classList.remove('open'); });
});

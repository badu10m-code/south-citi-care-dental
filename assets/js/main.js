/* South Citi Care Dental - front-end behaviour */
(function () {
  // mobile nav
  var burger = document.querySelector('.burger');
  var nav = document.querySelector('.nav');
  if (burger && nav) {
    burger.addEventListener('click', function () {
      nav.classList.toggle('open');
      burger.setAttribute('aria-expanded', nav.classList.contains('open'));
    });
    nav.querySelectorAll('a').forEach(function (a) {
      a.addEventListener('click', function () { nav.classList.remove('open'); });
    });
  }

  // scroll reveals
  var obs = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('in'); obs.unobserve(e.target); }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  document.querySelectorAll('.reveal').forEach(function (el) { obs.observe(el); });

  // service list: sticky image swap
  var fig = document.querySelector('.svc-fig img');
  var cap = document.querySelector('.svc-fig figcaption');
  if (fig) {
    var defSrc = fig.getAttribute('src'), defCap = cap ? cap.textContent : '';
    document.querySelectorAll('.svc-row').forEach(function (row) {
      row.addEventListener('mouseenter', function () {
        var src = row.getAttribute('data-img');
        if (!src) return;
        fig.style.opacity = 0;
        setTimeout(function () { fig.setAttribute('src', src); fig.style.opacity = 1; }, 180);
        if (cap) cap.textContent = row.getAttribute('data-cap') || '';
      });
    });
    var wrap = document.querySelector('.svc-grid');
    if (wrap) wrap.addEventListener('mouseleave', function () { fig.setAttribute('src', defSrc); if (cap) cap.textContent = defCap; });
  }

  // appointment form -> localStorage + WhatsApp fallback
  var form = document.querySelector('form.book');
  if (form) {
    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var fd = new FormData(form);
      var appt = {
        name: (fd.get('name') || '').trim(),
        phone: (fd.get('phone') || '').trim(),
        service: fd.get('service') || '',
        date: fd.get('date') || '',
        slot: fd.get('slot') || '',
        note: (fd.get('note') || '').trim(),
        status: 'new',
        ts: new Date().toISOString()
      };
      if (!appt.name || !appt.phone) return;
      var list = [];
      try { list = JSON.parse(localStorage.getItem('scc_appointments') || '[]'); } catch (e) {}
      list.push(appt);
      try { localStorage.setItem('scc_appointments', JSON.stringify(list)); } catch (e) {}
      var ok = document.getElementById('form-ok');
      if (ok) {
        form.style.display = 'none';
        ok.style.display = 'block';
        ok.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
    });
  }

  // page year
  document.querySelectorAll('.yr').forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();

// South Citi Care Dental Clinic - interactions
document.addEventListener('DOMContentLoaded', function () {
  // Scroll reveal
  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (e) {
      if (e.isIntersecting) { e.target.classList.add('visible'); observer.unobserve(e.target); }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(function (el) { observer.observe(el); });

  // Booking form
  var form = document.getElementById('booking-form');
  if (form) {
    // min date = today
    var dateInput = document.getElementById('f-date');
    if (dateInput) { dateInput.min = new Date().toISOString().split('T')[0]; }

    form.addEventListener('submit', function (ev) {
      ev.preventDefault();
      var appt = {
        id: 'SCC-' + Date.now().toString(36).toUpperCase(),
        name: document.getElementById('f-name').value.trim(),
        phone: document.getElementById('f-phone').value.trim(),
        service: document.getElementById('f-service').value,
        date: document.getElementById('f-date').value,
        time: document.getElementById('f-time').value,
        message: document.getElementById('f-message').value.trim(),
        created: new Date().toISOString(),
        status: 'new'
      };
      // Demo storage (works until backend is connected)
      try {
        var all = JSON.parse(localStorage.getItem('scc_appointments') || '[]');
        all.push(appt);
        localStorage.setItem('scc_appointments', JSON.stringify(all));
      } catch (e) {}
      // Production endpoint (wired for Cloudflare deploy; silently skipped in demo)
      try {
        fetch('/api/appointments', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(appt)
        }).catch(function () {});
      } catch (e) {}

      form.style.display = 'none';
      var ok = document.getElementById('form-success');
      ok.classList.add('show');
      document.getElementById('ok-ref').textContent = appt.id;
      var waMsg = 'Hello South Citi Care Dental Clinic, I would like to book an appointment.%0A%0AName: ' + encodeURIComponent(appt.name) +
        '%0APhone: ' + encodeURIComponent(appt.phone) +
        '%0AService: ' + encodeURIComponent(appt.service) +
        '%0APreferred: ' + encodeURIComponent(appt.date + ' ' + appt.time) +
        '%0AReference: ' + appt.id;
      document.getElementById('ok-wa').href = 'https://wa.me/919903450487?text=' + waMsg;
    });
  }

  // Admin panel
  var gate = document.getElementById('admin-gate');
  var panel = document.getElementById('admin-panel');
  if (gate) {
    var ADMIN_PASS = 'scc-admin-2026'; // change before real use
    var saved = sessionStorage.getItem('scc_admin_ok');
    if (saved === '1') showPanel();

    document.getElementById('gate-form').addEventListener('submit', function (ev) {
      ev.preventDefault();
      var pass = document.getElementById('gate-pass').value;
      if (pass === ADMIN_PASS) {
        sessionStorage.setItem('scc_admin_ok', '1');
        showPanel();
      } else {
        document.getElementById('gate-error').style.display = 'block';
      }
    });
    document.getElementById('logout').addEventListener('click', function () {
      sessionStorage.removeItem('scc_admin_ok');
      location.reload();
    });
  }

  function showPanel() {
    gate.style.display = 'none';
    panel.style.display = 'block';
    var all = [];
    try { all = JSON.parse(localStorage.getItem('scc_appointments') || '[]'); } catch (e) {}
    all.reverse();
    var list = document.getElementById('appt-list');
    var count = document.getElementById('appt-count');
    count.textContent = all.length;
    if (!all.length) {
      list.innerHTML = '<p style="color:#475569">No appointments yet. When a patient submits the booking form on this device, the entry appears here.</p>';
      return;
    }
    list.innerHTML = all.map(function (a) {
      return '<div class="card" style="margin-bottom:14px"><div style="display:flex;justify-content:space-between;flex-wrap:wrap;gap:8px"><b>' +
        esc(a.name) + ' <span style="color:#0284C7;font-size:0.8rem">' + esc(a.id) + '</span></b>' +
        '<span style="font-size:0.8rem;color:#475569">' + esc(a.created.slice(0, 10)) + '</span></div>' +
        '<p style="font-size:0.9rem;color:#475569;margin-top:6px">' + esc(a.service) + ' | ' + esc(a.date) + ' ' + esc(a.time) + ' | ' + esc(a.phone) + '</p>' +
        (a.message ? '<p style="font-size:0.88rem;margin-top:4px">' + esc(a.message) + '</p>' : '') + '</div>';
    }).join('');
  }

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
});

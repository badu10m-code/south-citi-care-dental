// Booking form: saves to the cloud store and this device, shows reference
document.addEventListener('DOMContentLoaded', function () {
  var form = document.getElementById('booking-form');
  if (!form) return;
  var dateInput = document.getElementById('f-date');
  if (dateInput) dateInput.min = new Date().toISOString().split('T')[0];

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (!form.checkValidity()) { form.reportValidity(); return; }
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

    // local copy (offline safety)
    try {
      var all = JSON.parse(localStorage.getItem('scc_appointments') || '[]');
      all.push(appt);
      localStorage.setItem('scc_appointments', JSON.stringify(all));
    } catch (e) {}

    // cloud store: read, append, write
    fetch(STORE_URL).then(function (r) { return r.json(); }).then(function (data) {
      var list = (data && data.appointments) ? data.appointments : [];
      list.push(appt);
      return fetch(STORE_URL, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ appointments: list })
      });
    }).catch(function () {});

    form.style.display = 'none';
    var ok = document.getElementById('form-success');
    ok.classList.add('show');
    document.getElementById('ok-ref').textContent = appt.id;
  });
});

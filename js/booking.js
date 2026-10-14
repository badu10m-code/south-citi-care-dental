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
      doctor: (document.getElementById('f-doctor') || {}).value || '',
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

    // cloud store: append while keeping every other key in the bin (best effort)
    existingAppointments().then(function (all) {
      binSave({ appointments: all.concat([appt]) });
    });

    form.style.display = 'none';
    var ok = document.getElementById('form-success');
    ok.classList.add('show');
    document.getElementById('ok-ref').textContent = appt.id;
  });

  function existingAppointments() {
    return fetch(STORE_URL).then(function (r) { return r.json(); })
      .then(function (d) { return (d && d.appointments) ? d.appointments : []; })
      .catch(function () { return []; });
  }
});

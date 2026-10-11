// Appointments dashboard. Entry is controlled by js/auth.js (owner OTP).
var current = [];
var activeFilter = 'all';

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('scc_appointments') || '[]'); } catch (e) { return []; }
}
function saveLocal(list) { try { localStorage.setItem('scc_appointments', JSON.stringify(list)); } catch (e) {} }

function loadCloud() {
  return binLoad().then(function (d) { return (d && d.appointments) ? d.appointments : []; });
}

function esc(s) {
  return String(s || '').replace(/[&<>"']/g, function (c) {
    return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
  });
}

document.addEventListener('DOMContentLoaded', function () {
  var authScreen = document.getElementById('auth-screen');
  var panel = document.getElementById('admin-panel');
  if (!authScreen) return;

  // registered device: straight into the panel, no code needed
  var device = (typeof ownerDevice === 'function') ? ownerDevice() : null;
  if (device && device.email && sessionStorage.getItem('scc_session') === '1') enter();
  else if (device && device.email) {
    // trusted device but a previous logout: restore session instantly too
    sessionStorage.setItem('scc_session', '1');
    enter();
  } else initAuth();

  function enter() {
    authScreen.hidden = true;
    document.getElementById('forget-device').hidden = true;
    panel.hidden = false;
    document.getElementById('user-email').textContent = device ? device.email : '';
    load();
  }

  function load() {
    var list = document.getElementById('appt-list');
    list.innerHTML = '<p class="empty">Loading&hellip;</p>';
    Promise.all([loadCloud(), Promise.resolve(loadLocal())]).then(function (res) {
      var cloud = res[0], local = res[1];
      var merged = cloud.slice();
      var ids = {};
      merged.forEach(function (a) { ids[a.id] = 1; });
      local.forEach(function (a) { if (!ids[a.id]) merged.push(a); });
      merged.sort(function (a, b) { return (b.created || '').localeCompare(a.created || ''); });
      current = merged;
      render();
      saveLocal(merged);
      if (cloud.length !== merged.length) binSave({ appointments: merged });
    }).catch(function () {
      list.innerHTML = '<p class="empty">Could not reach the cloud store. Check the internet connection and click Refresh.</p>';
    });
  }

  function render() {
    var term = (document.getElementById('appt-search').value || '').toLowerCase().trim();
    var rows = current.filter(function (a) {
      if (activeFilter !== 'all' && a.status !== activeFilter) return false;
      if (!term) return true;
      return (a.name + ' ' + a.phone + ' ' + a.service + ' ' + a.id).toLowerCase().indexOf(term) !== -1;
    });
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-total').textContent = current.length;
    document.getElementById('stat-new').textContent = current.filter(function (a) { return a.status === 'new'; }).length;
    document.getElementById('stat-confirmed').textContent = current.filter(function (a) { return a.status === 'confirmed'; }).length;
    document.getElementById('stat-today').textContent = current.filter(function (a) { return (a.created || '').slice(0, 10) === today; }).length;

    var list = document.getElementById('appt-list');
    if (!rows.length) {
      list.innerHTML = '<p class="empty">' + (current.length ? 'No appointments match this search or filter.' : 'No appointments yet. Bookings from the website will appear here.') + '</p>';
      return;
    }
    list.innerHTML = rows.map(function (a) {
      var waPhone = String(a.phone || '').replace(/\D/g, '').slice(-10);
      return '<div class="appt" data-id="' + esc(a.id) + '">' +
        '<div>' +
          '<div class="appt-head"><span class="appt-name">' + esc(a.name) + '</span>' +
            '<span class="appt-ref mono">' + esc(a.id) + '</span>' +
            '<span class="pill ' + esc(a.status) + '">' + esc(a.status) + '</span></div>' +
          '<div class="appt-meta">' +
            '<a href="tel:' + esc(a.phone) + '">' + esc(a.phone) + '</a> &middot; ' + esc(a.service) +
            ' &middot; <b>' + esc(a.date) + '</b>' + (a.time ? ' at ' + esc(a.time) : '') +
            (a.message ? '<div class="notes">&ldquo;' + esc(a.message) + '&rdquo;</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="appt-actions">' +
          '<a class="btn btn-outline btn-sm" href="tel:' + esc(a.phone) + '">Call</a>' +
          '<a class="btn btn-outline btn-sm" href="https://wa.me/91' + waPhone + '" target="_blank" rel="noopener">WhatsApp</a>' +
          '<select class="status-sel">' +
            ['new', 'confirmed', 'completed', 'cancelled'].map(function (s) {
              return '<option value="' + s + '"' + (a.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('') +
          '</select>' +
          '<button class="del" title="Delete appointment">&#10005;</button>' +
        '</div>' +
      '</div>';
    }).join('');

    list.querySelectorAll('.appt').forEach(function (card) {
      var id = card.dataset.id;
      var a = current.find(function (x) { return x.id === id; });
      card.querySelector('.status-sel').addEventListener('change', function (ev) {
        if (a) { a.status = ev.target.value; persist(); }
      });
      card.querySelector('.del').addEventListener('click', function () {
        if (!confirm('Delete appointment ' + id + '?')) return;
        current = current.filter(function (x) { return x.id !== id; });
        persist();
      });
    });
  }

  function persist() {
    render();
    saveLocal(current);
    binSave({ appointments: current });
  }

  function exportCSV() {
    var head = 'Ref,Name,Phone,Service,Date,Time,Status,Notes,Created\n';
    var body = current.map(function (a) {
      return [a.id, a.name, a.phone, a.service, a.date, a.time, a.status, a.message, a.created]
        .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([head + body], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'south-citi-care-appointments.csv';
    a.click();
  }

  // ===== auth screen wiring =====
  function initAuth() {
    panel.hidden = true;
    authScreen.hidden = false;
    var stepPhone = document.getElementById('step-email');
    var stepOtp = document.getElementById('step-otp');
    var phoneEl = document.getElementById('auth-email');
    var otpEl = document.getElementById('auth-otp');
    var errPhone = document.getElementById('err-email');
    var errOtp = document.getElementById('err-otp');
    var btnSend = document.getElementById('btn-send');
    var btnVerify = document.getElementById('btn-verify');
    var btnResend = document.getElementById('btn-resend');
    var loginPhone = '';

    stepOtp.hidden = true;
    stepPhone.hidden = false;
    errPhone.classList.remove('show');
    errOtp.classList.remove('show');

    stepPhone.addEventListener('submit', function (ev) {
      ev.preventDefault();
      errPhone.classList.remove('show');
      btnSend.disabled = true;
      btnSend.textContent = 'Sending&hellip;'.replace('&hellip;', '...');
      sendOwnerOtp(phoneEl.value).then(function (res) {
        btnSend.disabled = false;
        btnSend.textContent = 'Send code';
        if (!res.ok) { errPhone.textContent = res.error; errPhone.classList.add('show'); return; }
        loginPhone = res.email;
      }).catch(function () {
        btnSend.disabled = false;
        btnSend.textContent = 'Send code';
        errPhone.textContent = 'Something went wrong starting the login. Try again.';
        errPhone.classList.add('show');
      }).then(function () {
        if (!loginPhone) return;
        document.getElementById('otp-mask').textContent = loginPhone;
        stepPhone.hidden = true;
        stepOtp.hidden = false;
        startCooldown();
        setTimeout(function () { otpEl.focus(); }, 50);
      });
    });

    stepOtp.addEventListener('submit', function (ev) {
      ev.preventDefault();
      errOtp.classList.remove('show');
      btnVerify.disabled = true;
      btnVerify.textContent = 'Checking...';
      verifyOwnerOtp(loginPhone, otpEl.value).then(function (res) {
        btnVerify.disabled = false;
        btnVerify.textContent = 'Verify & open panel';
        if (!res.ok) { errOtp.textContent = res.error; errOtp.classList.add('show'); return; }
        device = ownerDevice();
        enter();
      });
    });

    btnResend.addEventListener('click', function () {
      btnSend.disabled = true;
      btnSend.textContent = 'Sending...';
      sendOwnerOtp(loginPhone).then(function (res) {
        btnSend.disabled = false;
        btnSend.textContent = 'Send code';
        if (res.ok) { errOtp.classList.remove('show'); startCooldown(); }
        else { errOtp.textContent = res.error; errOtp.classList.add('show'); }
      });
    });

    document.getElementById('btn-change').addEventListener('click', function () {
      stepOtp.hidden = true;
      stepPhone.hidden = false;
      errPhone.classList.remove('show');
      errOtp.classList.remove('show');
    });

    function startCooldown() {
      var left = 30;
      btnResend.disabled = true;
      btnResend.textContent = 'Resend code in 30s';
      var t = setInterval(function () {
        left--;
        if (left <= 0) { clearInterval(t); btnResend.disabled = false; btnResend.textContent = 'Resend code'; }
        else btnResend.textContent = 'Resend code in ' + left + 's';
      }, 1000);
    }
  }

  document.getElementById('forget-device').addEventListener('click', function () {
    if (!confirm('Forget this device? You will need a new code to log in next time.')) return;
    localStorage.removeItem('scc_owner');
    sessionStorage.removeItem('scc_session');
    location.reload();
  });

  document.getElementById('logout').addEventListener('click', function () {
    sessionStorage.removeItem('scc_session');
    panel.hidden = true;
    authScreen.hidden = false;
    document.getElementById('forget-device').hidden = false;
    if (typeof initAuth === 'function') initAuth();
  });

  document.getElementById('refresh').addEventListener('click', function () { if (!panel.hidden) load(); });
  document.getElementById('export-csv').addEventListener('click', function () { if (!panel.hidden) exportCSV(); });
  document.getElementById('appt-search').addEventListener('input', function () { if (!panel.hidden) render(); });
  document.querySelectorAll('#status-chips .chip').forEach(function (chip) {
    chip.addEventListener('click', function () {
      document.querySelectorAll('#status-chips .chip').forEach(function (c) { c.classList.remove('active'); });
      chip.classList.add('active');
      activeFilter = chip.dataset.f;
      if (!panel.hidden) render();
    });
  });
});

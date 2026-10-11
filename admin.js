// Admin dashboard: cloud + local appointments, stats, status, delete, CSV
var ADMIN_PASS = 'scc-admin-2026'; // change before real use

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('scc_appointments') || '[]'); } catch (e) { return []; }
}
function saveLocal(list) { localStorage.setItem('scc_appointments', JSON.stringify(list)); }

function loadCloud() {
  return fetch(STORE_URL).then(function (r) { return r.json(); })
    .then(function (d) { return (d && d.appointments) ? d.appointments : []; })
    .catch(function () { return null; });
}
function saveCloud(list) {
  return fetch(STORE_URL, {
    method: 'PUT', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ appointments: list })
  }).catch(function () {});
}

var current = [];

document.addEventListener('DOMContentLoaded', function () {
  var gate = document.getElementById('admin-gate');
  var panel = document.getElementById('admin-panel');
  if (!gate) return;

  if (sessionStorage.getItem('scc_admin_ok') === '1') enter();
  document.getElementById('gate-form').addEventListener('submit', function (ev) {
    ev.preventDefault();
    if (document.getElementById('gate-pass').value === ADMIN_PASS) {
      sessionStorage.setItem('scc_admin_ok', '1'); enter();
    } else { document.getElementById('gate-error').style.display = 'block'; }
  });
  document.getElementById('logout').addEventListener('click', function () {
    sessionStorage.removeItem('scc_admin_ok'); location.reload();
  });
  document.getElementById('refresh').addEventListener('click', enter);
  document.getElementById('export-csv').addEventListener('click', exportCSV);

  function enter() {
    gate.style.display = 'none';
    panel.style.display = 'block';
    Promise.all([loadCloud(), Promise.resolve(loadLocal())]).then(function (res) {
      var cloud = res[0], local = res[1];
      var merged = (cloud || []).slice();
      var ids = {};
      merged.forEach(function (a) { ids[a.id] = 1; });
      // entries saved on this device but not yet in the cloud
      local.forEach(function (a) { if (!ids[a.id]) merged.push(a); });
      if (!cloud) merged = local; // offline: local only
      merged.sort(function (a, b) { return (b.created || '').localeCompare(a.created || ''); });
      current = merged;
      render();
      // push merged back so nothing is lost between devices
      if (cloud) saveCloud(merged);
      saveLocal(merged);
    });
  }

  function render() {
    var filter = (document.getElementById('status-filter') || {}).value || 'all';
    var rows = current.filter(function (a) { return filter === 'all' || a.status === filter; });
    document.getElementById('appt-count').textContent = current.length;
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-total').textContent = current.length;
    document.getElementById('stat-new').textContent = current.filter(function (a) { return a.status === 'new'; }).length;
    document.getElementById('stat-today').textContent = current.filter(function (a) { return (a.created || '').slice(0, 10) === today; }).length;

    var list = document.getElementById('appt-list');
    if (!rows.length) {
      list.innerHTML = '<p class="empty">No appointments in this view yet.</p>';
      return;
    }
    list.innerHTML = '<table><thead><tr><th>Ref</th><th>Patient</th><th>Phone</th><th>Service</th><th>Preferred</th><th>Status</th><th></th></tr></thead><tbody>' +
      rows.map(function (a) {
        return '<tr><td class="mono">' + esc(a.id) + '</td><td><b>' + esc(a.name) + '</b>' +
          (a.message ? '<div class="sub">' + esc(a.message) + '</div>' : '') + '</td>' +
          '<td><a href="tel:' + esc(a.phone) + '">' + esc(a.phone) + '</a></td>' +
          '<td>' + esc(a.service) + '</td><td>' + esc(a.date) + '<div class="sub">' + esc(a.time || '') + '</div></td>' +
          '<td><select data-id="' + esc(a.id) + '" class="status-sel">' +
            ['new', 'confirmed', 'completed', 'cancelled'].map(function (s) {
              return '<option value="' + s + '"' + (a.status === s ? ' selected' : '') + '>' + s + '</option>';
            }).join('') + '</select></td>' +
          '<td><button class="del" data-id="' + esc(a.id) + '" title="Delete">✕</button></td></tr>';
      }).join('') + '</tbody></table>';

    list.querySelectorAll('.status-sel').forEach(function (sel) {
      sel.addEventListener('change', function () {
        var a = current.find(function (x) { return x.id === sel.dataset.id; });
        if (a) { a.status = sel.value; persist(); }
      });
    });
    list.querySelectorAll('.del').forEach(function (btn) {
      btn.addEventListener('click', function () {
        current = current.filter(function (x) { return x.id !== btn.dataset.id; });
        persist();
      });
    });
  }

  function persist() { saveCloud(current); saveLocal(current); render(); }

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

  function esc(s) {
    return String(s || '').replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
});

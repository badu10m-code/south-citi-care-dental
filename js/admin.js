// Appointments dashboard. Entry is controlled by js/auth.js (owner secret code).
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

function pad2(n) { return (n < 10 ? '0' : '') + n; }

function parseSlot(str) {
  var m = String(str || '').match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (!m) return null;
  return { h: parseInt(m[1], 10), m: parseInt(m[2], 10), ap: m[3].toUpperCase() };
}

function fmtDate(d) {
  var dt = new Date(String(d || '') + 'T00:00:00');
  if (isNaN(dt)) return String(d || '');
  return dt.toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });
}

function waPhoneOf(a) {
  return String(a.phone || '').replace(/\D/g, '').slice(-10);
}

function confirmMsg(a) {
  return 'Hello ' + a.name + ',\n\n' +
    'Your appointment at South Citi Care Dental Clinic is confirmed for ' +
    fmtDate(a.date) + ' at ' + a.slot + '.\n' +
    'Ref: ' + a.id + '\n' +
    'Address: 23B/40/1A, near Punjab National Bank, Mani Aangan, Block B, New Alipore, Kolkata 700053.\n' +
    'Please arrive 10 minutes early. Reply here if you need to change the time.\n\n' +
    'South Citi Care Dental Clinic';
}

// clock picker state
var clock = null; // { id, hour, minute, ap, mode }

document.addEventListener('DOMContentLoaded', function () {
  var authScreen = document.getElementById('auth-screen');
  var panel = document.getElementById('admin-panel');
  if (!authScreen) return;

  // registered device: straight into the panel, no code needed
  var device = (typeof ownerDevice === 'function') ? ownerDevice() : null;
  if (device && device.token) enter();
  else initAuth();

  function enter() {
    authScreen.hidden = true;
    panel.hidden = false;
    load();
  }

  function load() {
    var list = document.getElementById('appt-list');
    list.innerHTML = '<p class="empty">Loading&hellip;</p>';
    binLoad().then(function (d) {
      var cloud = (d && d.appointments) ? d.appointments : null;
      var local = loadLocal();
      var merged = (cloud || []).slice();
      var ids = {};
      merged.forEach(function (a) { ids[a.id] = 1; });
      local.forEach(function (a) { if (!ids[a.id]) merged.push(a); });
      merged.sort(function (a, b) { return (b.created || '').localeCompare(a.created || ''); });
      current = merged;
      render(!d);
      saveLocal(merged);
      if (cloud && cloud.length !== merged.length) binSave({ appointments: merged });
    });
  }

  function render(offline) {
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
      list.innerHTML = '<p class="empty">' + (current.length ? 'No appointments match this search or filter.' : 'No appointments yet. Bookings from the website will appear here.') + '</p>' +
        (offline ? '<p class="empty offline">Offline mode: the shared cloud store is not reachable right now, so only bookings saved on this device are shown.</p>' : '');
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
            '<a href="tel:' + esc(a.phone) + '">' + esc(a.phone) + '</a> <span class="wa-num">(WhatsApp)</span> &middot; ' + esc(a.service) +
            ' &middot; <b>' + esc(a.date) + '</b>' + (a.time ? ' at ' + esc(a.time) : '') +
            (a.message ? '<div class="notes">&ldquo;' + esc(a.message) + '&rdquo;</div>' : '') +
          '</div>' +
        '</div>' +
        '<div class="appt-actions">' +
          '<button type="button" class="slot-btn' + (a.slot ? ' set' : '') + '" data-slot>' +
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/></svg>' +
            (a.slot ? esc(a.slot) : 'Set time') + '</button>' +
          '<a class="btn btn-outline btn-sm" href="tel:' + esc(a.phone) + '">Call</a>' +
          '<a class="btn btn-outline btn-sm" href="https://wa.me/91' + waPhone + '" target="_blank" rel="noopener">Chat</a>' +
          '<a class="btn btn-sm wa-confirm' + (a.slot ? '' : ' disabled') + '" data-wa>Confirm on WhatsApp</a>' +
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
      var slotBtn = card.querySelector('[data-slot]');
      if (slotBtn) slotBtn.addEventListener('click', function () { openClock(id); });
      var waBtn = card.querySelector('[data-wa]');
      if (waBtn) waBtn.addEventListener('click', function (ev) {
        ev.preventDefault();
        var ap = current.find(function (x) { return x.id === id; });
        if (!ap) return;
        if (!ap.slot) { alert('Set the time slot first, then the WhatsApp draft is ready.'); openClock(id); return; }
        var url = 'https://wa.me/91' + waPhoneOf(ap) + '?text=' + encodeURIComponent(confirmMsg(ap));
        window.open(url, '_blank', 'noopener');
      });
    });
  }

  // ===== clock picker =====
  var modal = document.getElementById('clock-modal');
  var face = document.getElementById('clock-face');
  var stepEl = document.getElementById('clock-step');
  var valEl = document.getElementById('clock-val');

  function openClock(id) {
    var a = current.find(function (x) { return x.id === id; });
    if (!a) return;
    var p = parseSlot(a.slot) || { h: null, m: null, ap: 'AM' };
    clock = { id: id, hour: p.h, minute: p.m, ap: p.ap, mode: 'h' };
    drawFace();
    paint();
    modal.hidden = false;
  }

  function drawFace() {
    face.innerHTML = '';
    var c = document.createElement('span');
    c.className = 'clock-center';
    face.appendChild(c);
    var items = [];
    if (clock.mode === 'h') {
      stepEl.textContent = 'Pick hour';
      for (var i = 1; i <= 12; i++) items.push({ label: String(i), value: i });
    } else {
      stepEl.textContent = 'Pick minutes';
      for (var j = 0; j < 12; j++) items.push({ label: pad2(j * 5), value: j * 5 });
    }
    items.forEach(function (it, idx) {
      var ang = (idx * 30 - 90) * Math.PI / 180;
      var x = 50 + 42 * Math.cos(ang);
      var y = 50 + 42 * Math.sin(ang);
      var b = document.createElement('button');
      b.type = 'button';
      b.className = 'clock-num';
      b.style.left = x + '%';
      b.style.top = y + '%';
      b.textContent = it.label;
      var sel = (clock.mode === 'h') ? (clock.hour === it.value) : (clock.minute === it.value);
      if (sel) b.classList.add('sel');
      b.addEventListener('click', function () {
        if (clock.mode === 'h') { clock.hour = it.value; clock.mode = 'm'; }
        else { clock.minute = it.value; }
        drawFace();
        paint();
      });
      face.appendChild(b);
    });
  }

  function paint() {
    var h = (clock.hour === null || clock.hour === undefined) ? '--' : String(clock.hour);
    var m = (clock.minute === null || clock.minute === undefined) ? '--' : pad2(clock.minute);
    valEl.textContent = h + ':' + m;
    document.getElementById('ap-am').classList.toggle('active', clock.ap === 'AM');
    document.getElementById('ap-pm').classList.toggle('active', clock.ap === 'PM');
  }

  document.getElementById('ap-am').addEventListener('click', function () { if (clock) { clock.ap = 'AM'; paint(); } });
  document.getElementById('ap-pm').addEventListener('click', function () { if (clock) { clock.ap = 'PM'; paint(); } });
  document.getElementById('clock-cancel').addEventListener('click', function () { modal.hidden = true; clock = null; });
  document.getElementById('clock-clear').addEventListener('click', function () {
    var a = current.find(function (x) { return x.id === clock.id; });
    if (a) { delete a.slot; persist(); }
    modal.hidden = true; clock = null;
  });
  document.getElementById('clock-save').addEventListener('click', function () {
    if (!clock || clock.hour === null || clock.hour === undefined || clock.minute === null || clock.minute === undefined) {
      alert('Pick an hour and the minutes first.');
      return;
    }
    var a = current.find(function (x) { return x.id === clock.id; });
    if (a) {
      a.slot = clock.hour + ':' + pad2(clock.minute) + ' ' + clock.ap;
      persist();
    }
    modal.hidden = true; clock = null;
  });

  // owner quick slots (clinic hours 9:30 AM to 9:30 PM)
  var QUICK = ['10:00 AM', '11:00 AM', '12:00 PM', '5:00 PM', '6:30 PM', '8:00 PM'];
  var qs = document.getElementById('quick-slots');
  qs.innerHTML = QUICK.map(function (t) { return '<button type="button" data-t="' + t + '">' + t + '</button>'; }).join('');
  qs.addEventListener('click', function (ev) {
    var t = ev.target.getAttribute('data-t');
    if (!t || !clock) return;
    var p = parseSlot(t);
    var a = current.find(function (x) { return x.id === clock.id; });
    if (a) { a.slot = t; persist(); }
    modal.hidden = true; clock = null;
  });

  function persist() {
    render();
    saveLocal(current);
    binSave({ appointments: current });
  }

  function exportCSV() {
    var head = 'Ref,Name,Phone,Service,Date,Slot,Preferred time,Status,Notes,Created\n';
    var body = current.map(function (a) {
      return [a.id, a.name, a.phone, a.service, a.date, a.slot, a.time, a.status, a.message, a.created]
        .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([head + body], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'south-citi-care-appointments.csv';
    a.click();
  }

  // ===== secret-code screen =====
  function initAuth() {
    panel.hidden = true;
    authScreen.hidden = false;
    var codeEl = document.getElementById('auth-code');
    var errCode = document.getElementById('err-code');
    var btnUnlock = document.getElementById('btn-unlock');
    codeEl.value = '';
    errCode.classList.remove('show');

    document.getElementById('step-code').addEventListener('submit', function (ev) {
      ev.preventDefault();
      errCode.classList.remove('show');
      btnUnlock.disabled = true;
      btnUnlock.textContent = 'Checking...';
      unlockWithCode(codeEl.value).then(function (res) {
        btnUnlock.disabled = false;
        btnUnlock.textContent = 'Unlock panel';
        if (!res.ok) { errCode.textContent = res.error; errCode.classList.add('show'); return; }
        enter();
      }).catch(function () {
        btnUnlock.disabled = false;
        btnUnlock.textContent = 'Unlock panel';
        errCode.textContent = 'Something went wrong. Try again.';
        errCode.classList.add('show');
      });
    });
  }

  document.getElementById('forget-device').addEventListener('click', function () {
    if (!confirm('Forget this device and release the lock? You will need the secret code again, and any device can then register.')) return;
    forgetThisDevice().then(function () { location.reload(); });
  });

  document.getElementById('logout').addEventListener('click', function () {
    sessionStorage.removeItem('scc_session');
    panel.hidden = true;
    authScreen.hidden = false;
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

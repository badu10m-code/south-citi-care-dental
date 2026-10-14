// admin-list.js: full appointment list engine for admin-appointments.html
// filters: search, status chips, day (visit date), doctor. Rows: assign doctor,
// status, set-time clock, WhatsApp confirm, delete. Uses admin-core helpers.
var current = [];
var activeFilter = 'all';
var listOffline = false;
var clock = null;

document.addEventListener('scc-admin-ready', function () {
    load();
    wireToolbar();
    wireClock();
  });

  function load() {
    var list = document.getElementById('appt-list');
    list.innerHTML = '<p class="empty">Loading&hellip;</p>';
    mergedAppointments().then(function (r) {
      current = r.list;
      listOffline = r.offline;
      fillDaySelect();
      render();
      saveLocal(current);
    });
  }

  function fillDaySelect() {
    var sel = document.getElementById('day-select');
    var days = {};
    current.forEach(function (a) { if (a.date) days[a.date] = 1; });
    var sorted = Object.keys(days).sort().reverse();
    var keep = sel.value;
    sel.innerHTML = '<option value="">All days</option>' + sorted.map(function (d) {
      return '<option value="' + d + '">' + fmtDate(d) + '</option>';
    }).join('');
    if (keep && days[keep]) sel.value = keep;
  }

  function wireToolbar() {
    document.getElementById('appt-search').addEventListener('input', render);
    document.getElementById('doc-filter').addEventListener('change', render);
    document.getElementById('day-input').addEventListener('change', function () {
      var v = this.value;
      document.getElementById('day-select').value = v;
      render();
    });
    document.getElementById('day-select').addEventListener('change', function () {
      document.getElementById('day-input').value = this.value;
      render();
    });
    document.getElementById('day-clear').addEventListener('click', function () {
      document.getElementById('day-input').value = '';
      document.getElementById('day-select').value = '';
      render();
    });
    document.getElementById('refresh').addEventListener('click', load);
    document.getElementById('export-csv').addEventListener('click', exportCSV);
    document.querySelectorAll('#status-chips .chip').forEach(function (chip) {
      chip.addEventListener('click', function () {
        document.querySelectorAll('#status-chips .chip').forEach(function (c) { c.classList.remove('active'); });
        chip.classList.add('active');
        activeFilter = chip.dataset.f;
        render();
      });
    });
  }

  function render() {
    var term = (document.getElementById('appt-search').value || '').toLowerCase().trim();
    var dayIn = document.getElementById('day-input').value;
    var daySel = document.getElementById('day-select').value;
    var day = dayIn || daySel;
    var docF = document.getElementById('doc-filter').value;
    var rows = current.filter(function (a) {
      if (activeFilter !== 'all' && a.status !== activeFilter) return false;
      if (day && a.date !== day) return false;
      if (docF === '__unassigned' && a.doctor) return false;
      if (docF && docF !== '__unassigned' && (a.doctor || '') !== docF) return false;
      if (!term) return true;
      return (a.name + ' ' + a.phone + ' ' + a.service + ' ' + a.id + ' ' + (a.doctor || '')).toLowerCase().indexOf(term) !== -1;
    });
    var today = new Date().toISOString().slice(0, 10);
    document.getElementById('stat-total') && 0; // stats live on dashboard page only

    var list = document.getElementById('appt-list');
    if (!rows.length) {
      list.innerHTML = '<p class="empty">' + (current.length ? 'No appointments match this search or filter.' : 'No appointments yet. Bookings from the website will appear here.') + '</p>' +
        (listOffline ? '<p class="empty offline">Offline mode: the shared cloud store is not reachable right now, so only bookings saved on this device are shown.</p>' : '');
      return;
    }
    list.innerHTML = rows.map(function (a) {
      var waPhone = waPhoneOf(a);
      var docSel = '<select class="status-sel doc-sel" title="Assign doctor">' +
        '<option value="">Assign doctor&hellip;</option>' +
        SCC_DOCTORS.map(function (d) { return '<option value="' + esc(d) + '"' + (a.doctor === d ? ' selected' : '') + '>' + esc(d) + '</option>'; }).join('') +
        '</select>';
      return '<div class="appt" data-id="' + esc(a.id) + '">' +
        '<div>' +
          '<div class="appt-head"><span class="appt-name">' + esc(a.name) + '</span>' +
            '<span class="appt-ref mono">' + esc(a.id) + '</span>' +
            '<span class="pill ' + esc(a.status) + '">' + esc(a.status) + '</span>' +
            (a.doctor ? '<span class="doctor-tag">' + esc(a.doctor) + '</span>' : '') + '</div>' +
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
          docSel +
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
      var docSelEl = card.querySelector('.doc-sel');
      if (docSelEl) docSelEl.addEventListener('change', function (ev) {
        if (a) { a.doctor = ev.target.value || ''; persist(); }
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
        window.open('https://wa.me/91' + waPhoneOf(ap) + '?text=' + encodeURIComponent(confirmMsg(ap)), '_blank', 'noopener');
      });
    });
  }

  function persist() {
    render();
    fillDaySelect();
    saveLocal(current);
    binSave({ appointments: current });
  }

  function exportCSV() {
    var head = 'Ref,Name,Phone,Service,Date,Slot,Preferred time,Doctor,Status,Notes,Created\n';
    var body = current.map(function (a) {
      return [a.id, a.name, a.phone, a.service, a.date, a.slot, a.time, a.doctor || '', a.status, a.message, a.created]
        .map(function (v) { return '"' + String(v || '').replace(/"/g, '""') + '"'; }).join(',');
    }).join('\n');
    var blob = new Blob([head + body], { type: 'text/csv' });
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'south-citi-care-appointments.csv';
    a.click();
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
  function wireClock() {
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
      if (a) { a.slot = clock.hour + ':' + pad2(clock.minute) + ' ' + clock.ap; persist(); }
      modal.hidden = true; clock = null;
    });
    var QUICK = ['10:00 AM', '11:00 AM', '12:00 PM', '5:00 PM', '6:30 PM', '8:00 PM'];
    var qs = document.getElementById('quick-slots');
    qs.innerHTML = QUICK.map(function (t) { return '<button type="button" data-t="' + t + '">' + t + '</button>'; }).join('');
    qs.addEventListener('click', function (ev) {
      var t = ev.target.getAttribute('data-t');
      if (!t || !clock) return;
      var a = current.find(function (x) { return x.id === clock.id; });
      if (a) { a.slot = t; persist(); }
      modal.hidden = true; clock = null;
    });
  }


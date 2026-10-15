// admin-core.js: shared shell for the multi-page admin panel.
// Auth gate, sidebar, helpers, cloud config, tiny canvas charts.
var SCC_DOCTORS = ['Dr. Anish Bharti', 'Dr. Aditi Bharti'];

function loadLocal() {
  try { return JSON.parse(localStorage.getItem('scc_appointments') || '[]'); } catch (e) { return []; }
}
function saveLocal(list) { try { localStorage.setItem('scc_appointments', JSON.stringify(list)); } catch (e) {} }

function loadConfig() {
  return binLoad().then(function (d) { return (d && d.config) ? d.config : {}; });
}
function saveConfig(patch) {
  return binLoad().then(function (d) {
    var c = (d && d.config) || {};
    for (var k in patch) c[k] = patch[k];
    return binSave({ config: c });
  });
}
function mergedAppointments() {
  return binLoad().then(function (d) {
    var cloud = (d && d.appointments) ? d.appointments : null;
    var merged = (cloud || []).slice();
    var ids = {};
    merged.forEach(function (a) { ids[a.id] = 1; });
    loadLocal().forEach(function (a) { if (!ids[a.id]) merged.push(a); });
    merged.sort(function (a, b) { return (b.created || '').localeCompare(a.created || ''); });
    return { list: merged, offline: !d, cloudCount: cloud ? cloud.length : null };
  });
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
function waPhoneOf(a) { return String(a.phone || '').replace(/\D/g, '').slice(-10); }
function confirmMsg(a) {
  return 'Hello ' + a.name + ',\n\n' +
    'Your appointment at South Citi Care Dental Clinic is confirmed for ' +
    fmtDate(a.date) + ' at ' + a.slot + '.\n' +
    'Ref: ' + a.id + '\n' +
    'Address: 23B/40/1A, near Punjab National Bank, Mani Aangan, Block B, New Alipore, Kolkata 700053.\n' +
    'Please arrive 10 minutes early. Reply here if you need to change the time.\n\n' +
    'South Citi Care Dental Clinic';
}

/* ---- tiny canvas charts (no external libraries) ---- */
function chartCtx(cv) {
  var dpr = window.devicePixelRatio || 1;
  var w = cv.clientWidth || 400, h = parseInt(cv.getAttribute('height')) || 230;
  cv.width = w * dpr; cv.height = h * dpr;
  var ctx = cv.getContext('2d');
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx: ctx, w: w, h: h };
}
function barChart(cv, labels, values, color) {
  if (!cv) return;
  var c = chartCtx(cv), ctx = c.ctx, w = c.w, h = c.h;
  ctx.clearRect(0, 0, w, h);
  var padL = 8, padB = 26, padT = 14, padR = 8;
  var max = Math.max.apply(null, values.concat([1]));
  var iw = w - padL - padR, ih = h - padT - padB;
  var n = values.length, step = iw / n, bw = Math.min(30, step * 0.62);
  ctx.font = '600 10px Poppins, sans-serif';
  // horizontal guide lines
  ctx.strokeStyle = '#E0F2FE'; ctx.fillStyle = '#94A3B8';
  for (var g = 0; g <= 2; g++) {
    var gy = padT + ih - (ih * g / 2);
    ctx.beginPath(); ctx.moveTo(padL, gy); ctx.lineTo(w - padR, gy); ctx.stroke();
    ctx.textAlign = 'left';
    ctx.fillText(String(Math.round(max * g / 2)), padL + 2, gy - 3);
  }
  for (var i = 0; i < n; i++) {
    var bh = Math.round(values[i] / max * ih);
    var x = padL + step * i + (step - bw) / 2, y = padT + ih - bh;
    var grad = ctx.createLinearGradient(0, y, 0, padT + ih);
    grad.addColorStop(0, '#38BDF8'); grad.addColorStop(1, color || '#0EA5E9');
    ctx.fillStyle = values[i] ? grad : '#F0F9FF';
    var r = Math.min(5, bw / 2, bh);
    ctx.beginPath();
    ctx.moveTo(x, padT + ih); ctx.lineTo(x, y + r);
    ctx.arcTo(x, y, x + r, y, r); ctx.arcTo(x + bw, y, x + bw, y + r, r);
    ctx.lineTo(x + bw, padT + ih); ctx.closePath(); ctx.fill();
    ctx.fillStyle = '#64748B'; ctx.textAlign = 'center';
    if (values[i]) ctx.fillText(String(values[i]), x + bw / 2, y - 4);
    ctx.fillText(labels[i], x + bw / 2, h - 10);
  }
}
function hbarChart(cv, labels, values, colors) {
  if (!cv) return;
  var c = chartCtx(cv), ctx = c.ctx, w = c.w, h = c.h;
  ctx.clearRect(0, 0, w, h);
  var n = Math.max(labels.length, 1);
  var rowH = Math.min(34, (h - 8) / n);
  var max = Math.max.apply(null, values.concat([1]));
  var barMax = w - 150;
  ctx.font = '600 11px Poppins, sans-serif';
  for (var i = 0; i < labels.length; i++) {
    var y = 8 + rowH * i + rowH / 2;
    ctx.fillStyle = '#334155'; ctx.textAlign = 'right';
    var lab = labels[i].length > 20 ? labels[i].slice(0, 19) + '…' : labels[i];
    ctx.fillText(lab, 138, y + 4);
    var bw = Math.max(values[i] ? 4 : 2, Math.round(values[i] / max * barMax));
    ctx.fillStyle = colors ? colors[i] : '#0EA5E9';
    rounded(ctx, 146, y - 7, bw, 14, 7); ctx.fill();
    ctx.fillStyle = '#0C4A6E'; ctx.textAlign = 'left';
    ctx.fillText(String(values[i]), 146 + bw + 6, y + 4);
  }
  function rounded(ctx, x, y, w2, h2, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y); ctx.arcTo(x + w2, y, x + w2, y + h2, r);
    ctx.arcTo(x + w2, y + h2, x, y + h2, r); ctx.arcTo(x, y + h2, x, y, r);
    ctx.arcTo(x, y, x + w2, y, r); ctx.closePath();
  }
}
var DONUT_COLORS = { new: '#F59E0B', confirmed: '#10B981', completed: '#3B82F6', cancelled: '#EF4444' };
function donutChart(cv, items) {
  if (!cv) return;
  var c = chartCtx(cv), ctx = c.ctx, w = c.w, h = c.h;
  ctx.clearRect(0, 0, w, h);
  var total = items.reduce(function (s, it) { return s + it.v; }, 0);
  var cx = h / 2, cy = h / 2, r = h / 2 - 14, rIn = r * 0.62;
  if (!total) {
    ctx.fillStyle = '#94A3B8'; ctx.font = '600 12px Poppins, sans-serif'; ctx.textAlign = 'center';
    ctx.fillText('No data yet', w / 2, cy);
    return;
  }
  var a0 = -Math.PI / 2;
  items.forEach(function (it) {
    if (!it.v) return;
    var a1 = a0 + it.v / total * Math.PI * 2;
    ctx.beginPath();
    ctx.arc(cx, cy, r, a0 + 0.015, a1 - 0.015);
    ctx.arc(cx, cy, rIn, a1 - 0.015, a0 + 0.015, true);
    ctx.closePath(); ctx.fillStyle = it.c || DONUT_COLORS[it.k] || '#94A3B8'; ctx.fill();
    a0 = a1;
  });
  ctx.fillStyle = '#0C4A6E'; ctx.font = '700 20px Poppins, sans-serif'; ctx.textAlign = 'center';
  ctx.fillText(String(total), cx, cy + 2);
  ctx.fillStyle = '#94A3B8'; ctx.font = '600 9px Poppins, sans-serif';
  ctx.fillText('TOTAL', cx, cy + 16);
  var lx = h + 16, ly = Math.max(24, h / 2 - items.length * 11);
  ctx.font = '600 11px Poppins, sans-serif'; ctx.textAlign = 'left';
  items.forEach(function (it) {
    ctx.fillStyle = it.c || DONUT_COLORS[it.k] || '#94A3B8';
    ctx.beginPath(); ctx.arc(lx, ly, 4, 0, 7); ctx.fill();
    ctx.fillStyle = '#334155';
    ctx.fillText(it.k + ' (' + it.v + ')', lx + 10, ly + 4);
    ly += 22;
  });
}

/* ---- shell: auth gate + sidebar ---- */
(function () {
  var NAV = [
    ['admin.html', 'Dashboard', '⌂'],
    ['admin-appointments.html', 'Appointments', '▦'],
    ['admin-sales.html', 'Sales & graphs', '◔'],
    ['admin-banners.html', 'Banners', '▣'],
    ['admin-posts.html', 'Blog posts', '✎'],
    ['admin-settings.html', 'Settings', '⚙']
  ];
  document.addEventListener('DOMContentLoaded', function () {
    var authScreen = document.getElementById('auth-screen');
    var panel = document.getElementById('admin-panel');
    if (!authScreen || !panel) return;

    var device = (typeof ownerDevice === 'function') ? ownerDevice() : null;
    if (device && device.token) enter();
    else initAuth();

    function enter() {
      authScreen.hidden = true;
      panel.hidden = false;
      buildNav();
      document.dispatchEvent(new CustomEvent('scc-admin-ready'));
    }
    function buildNav() {
      var nav = document.getElementById('side-nav');
      if (!nav) return;
      var pg = document.body.dataset.page;
      nav.innerHTML = '<div class="side-logo"><span class="topbar-logo">S</span><b>South Citi Care<br>Admin</b></div>' +
        NAV.map(function (n) {
          var id = n[0].replace('admin-', '').replace('.html', '');
          if (n[0] === 'admin.html') id = 'dashboard';
          return '<a class="side-link' + (id === pg ? ' active' : '') + '" href="' + n[0] + '"><span class="ico">' + n[2] + '</span>' + n[1] + '</a>';
        }).join('') +
        '<div class="side-sep"></div>' +
        '<a class="side-link" href="index.html" target="_blank" rel="noopener"><span class="ico">↗</span>View website</a>';
      var sub = document.getElementById('page-sub');
      if (sub) {
        var cur = NAV.filter(function (n) {
          var id = n[0].replace('admin-', '').replace('.html', '');
          if (n[0] === 'admin.html') id = 'dashboard';
          return id === pg;
        })[0];
        sub.textContent = cur ? cur[1] : 'Dashboard';
      }
    }
    function initAuth() {
      panel.hidden = true;
      authScreen.hidden = false;
      var codeEl = document.getElementById('auth-code');
      var errCode = document.getElementById('err-code');
      var btnUnlock = document.getElementById('btn-unlock');
      if (!codeEl) return;
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
    var fd = document.getElementById('forget-device');
    if (fd) fd.addEventListener('click', function () {
      if (!confirm('Forget this device and release the lock? You will need the secret code again, and any device can then register.')) return;
      forgetThisDevice().then(function () { location.reload(); });
    });
    var lo = document.getElementById('logout');
    if (lo) lo.addEventListener('click', function () {
      sessionStorage.removeItem('scc_session');
      panel.hidden = true;
      authScreen.hidden = false;
      initAuth();
    });
  });
})();

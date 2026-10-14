// admin-dashboard.js: overview page (stats, charts, today's list)
document.addEventListener('scc-admin-ready', function () {
    mergedAppointments().then(function (r) {
      var list = r.list;
      var today = new Date().toISOString().slice(0, 10);
      document.getElementById('stat-total').textContent = list.length;
      document.getElementById('stat-new').textContent = list.filter(function (a) { return a.status === 'new'; }).length;
      document.getElementById('stat-confirmed').textContent = list.filter(function (a) { return a.status === 'confirmed'; }).length;
      document.getElementById('stat-today').textContent = list.filter(function (a) { return (a.created || '').slice(0, 10) === today; }).length;

      // last 14 days
      var days = [], vals = [], labels = [];
      for (var i = 13; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        vals.push(list.filter(function (a) { return (a.created || '').slice(0, 10) === key; }).length);
      }
      barChart(document.getElementById('ch-days'), labels, vals);
      var st = ['new', 'confirmed', 'completed', 'cancelled'].map(function (k) {
        return { k: k, v: list.filter(function (a) { return a.status === k; }).length };
      });
      donutChart(document.getElementById('ch-status'), st);

      var tl = document.getElementById('today-list');
      var todays = list.filter(function (a) { return (a.created || '').slice(0, 10) === today; });
      if (!todays.length) {
        tl.innerHTML = '<p class="empty">Nothing booked today yet.</p>';
      } else {
        tl.innerHTML = todays.map(function (a) {
          return '<div class="appt"><div><div class="appt-head"><span class="appt-name">' + esc(a.name) + '</span>' +
            '<span class="appt-ref mono">' + esc(a.id) + '</span><span class="pill ' + esc(a.status) + '">' + esc(a.status) + '</span></div>' +
            '<div class="appt-meta"><a href="tel:' + esc(a.phone) + '">' + esc(a.phone) + '</a> &middot; ' + esc(a.service) +
            ' &middot; <b>' + esc(a.date) + '</b>' + (a.slot ? ' at ' + esc(a.slot) : '') + '</div></div>' +
            '<div class="appt-actions"><a class="btn btn-outline btn-sm" href="admin-appointments.html">Manage</a></div></div>';
        }).join('');
      }
      if (r.offline) {
        tl.insertAdjacentHTML('beforeend', '<p class="empty offline">Offline mode: the shared cloud store is not reachable, showing device copies only.</p>');
      }
    });
  });


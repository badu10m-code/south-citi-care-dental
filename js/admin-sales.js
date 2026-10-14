// admin-sales.js: sales & graphs page
document.addEventListener('DOMContentLoaded', function () {
  document.addEventListener('scc-admin-ready', function () {
    mergedAppointments().then(function (r) {
      var list = r.list;
      var today = new Date().toISOString().slice(0, 10);
      var weekAgo = new Date(); weekAgo.setDate(weekAgo.getDate() - 6);
      var wk = weekAgo.toISOString().slice(0, 10);

      var confirmed = list.filter(function (a) { return a.status === 'confirmed'; }).length;
      document.getElementById('sa-total').textContent = list.length;
      document.getElementById('sa-conv').textContent = (list.length ? Math.round(confirmed / list.length * 100) : 0) + '%';
      document.getElementById('sa-week').textContent = list.filter(function (a) { return (a.created || '').slice(0, 10) >= wk; }).length;
      document.getElementById('sa-avg').textContent = (list.length ? (list.length / 14) : 0).toFixed(1);

      var labels = [], vals = [];
      for (var i = 13; i >= 0; i--) {
        var d = new Date(); d.setDate(d.getDate() - i);
        var key = d.toISOString().slice(0, 10);
        labels.push(d.getDate() + '/' + (d.getMonth() + 1));
        vals.push(list.filter(function (a) { return (a.created || '').slice(0, 10) === key; }).length);
      }
      barChart(document.getElementById('sa-days'), labels, vals);

      var docLabels = [], docVals = [];
      SCC_DOCTORS.forEach(function (d) {
        docLabels.push(d.replace('Dr. ', ''));
        docVals.push(list.filter(function (a) { return a.doctor === d; }).length);
      });
      docLabels.push('Unassigned');
      docVals.push(list.filter(function (a) { return !a.doctor; }).length);
      hbarChart(document.getElementById('sa-doc'), docLabels, docVals, ['#0EA5E9', '#8B5CF6', '#94A3B8']);

      var svc = {};
      list.forEach(function (a) { var s = a.service || 'Other'; svc[s] = (svc[s] || 0) + 1; });
      var pairs = Object.keys(svc).map(function (k) { return [k, svc[k]]; }).sort(function (a, b) { return b[1] - a[1]; }).slice(0, 6);
      hbarChart(document.getElementById('sa-svc'), pairs.map(function (p) { return p[0]; }), pairs.map(function (p) { return p[1]; }), ['#0EA5E9', '#38BDF8', '#0284C7', '#7DD3FC', '#0369A1', '#0EA5E9']);

      donutChart(document.getElementById('sa-status'), ['new', 'confirmed', 'completed', 'cancelled'].map(function (k) {
        return { k: k, v: list.filter(function (a) { return a.status === k; }).length };
      }));

      // day-wise register
      var byDay = {};
      list.forEach(function (a) { var d = a.date || '?'; (byDay[d] = byDay[d] || { t: 0, c: 0, p: 0, x: 0 }); byDay[d].t++; byDay[d][a.status[0]] !== undefined && 0; byDay[d][a.status === 'confirmed' ? 'c' : a.status === 'completed' ? 'p' : a.status === 'cancelled' ? 'x' : 't']++; });
      var days = Object.keys(byDay).sort().reverse().slice(0, 21);
      var tb = document.querySelector('#day-table tbody');
      tb.innerHTML = days.map(function (d) {
        var v = byDay[d];
        return '<tr><td><b>' + fmtDate(d) + '</b></td><td>' + v.t + '</td><td>' + (v.c || 0) + '</td><td>' + (v.p || 0) + '</td><td>' + (v.x || 0) + '</td></tr>';
      }).join('') || '<tr><td colspan="5" class="empty">No data yet.</td></tr>';
    });
  });
});

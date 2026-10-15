// blog.js: renders the owner's clinic updates on the public blog page.
// Updates live in the cloud bin under the "posts" key, added from the admin panel.
(function () {
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function fmtDate(iso) {
    try {
      var d = new Date(iso);
      var M = ['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
      return d.getDate() + ' ' + M[d.getMonth()] + ' ' + d.getFullYear();
    } catch (e) { return ''; }
  }
  function render() {
    var section = document.getElementById('updates');
    var list = document.getElementById('updates-list');
    if (!section || !list) return;
    binLoad().then(function (data) {
      var posts = (data && data.posts) || [];
      if (!posts.length) return; // section stays hidden
      posts.forEach(function (p) {
        var item = document.createElement('div');
        item.className = 'update-item';
        item.innerHTML = '<h4>' + esc(p.title) + '</h4><p>' + esc(p.body) + '</p><span class="u-date">' + esc(fmtDate(p.createdAt)) + '</span>';
        list.appendChild(item);
      });
      section.hidden = false;
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render);
  else render();
})();

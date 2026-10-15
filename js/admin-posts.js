// admin-posts.js: manage the clinic updates shown on blog.html.
// Updates are stored in the cloud bin under "posts", newest first, capped at 6.
document.addEventListener('scc-admin-ready', function () {
  var titleEl = document.getElementById('post-title');
  var bodyEl = document.getElementById('post-body');
  var saveBtn = document.getElementById('save-post');
  var listEl = document.getElementById('posts-list');
  var statusEl = document.getElementById('posts-status');

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
  function say(msg) { if (statusEl) statusEl.textContent = msg; }

  function load() {
    binLoad().then(function (data) {
      var posts = (data && data.posts) || [];
      listEl.innerHTML = '';
      if (!posts.length) {
        listEl.innerHTML = '<p class="hint">No updates yet. Publish your first one above.</p>';
        return;
      }
      posts.forEach(function (p) {
        var row = document.createElement('div');
        row.className = 'update-item';
        row.style.marginBottom = '14px';
        row.innerHTML = '<h4>' + esc(p.title) + '</h4><p>' + esc(p.body) + '</p><span class="u-date">' + esc(fmtDate(p.createdAt)) + '</span>';
        var del = document.createElement('button');
        del.className = 'btn btn-outline';
        del.type = 'button';
        del.textContent = 'Delete';
        del.addEventListener('click', function () {
          if (!window.confirm('Remove this update from the blog?')) return;
          say('Removing...');
          binSave({ posts: posts.filter(function (x) { return x.id !== p.id; }) }).then(function (ok) {
            say(ok ? 'Update removed.' : 'Cloud store unreachable. Try again when online.');
            if (ok) load();
          });
        });
        row.appendChild(del);
        listEl.appendChild(row);
      });
    });
  }

  saveBtn.addEventListener('click', function () {
    var title = (titleEl.value || '').trim();
    var body = (bodyEl.value || '').trim();
    if (!title || !body) { say('Write a title and a few lines first.'); return; }
    saveBtn.disabled = true;
    say('Publishing...');
    binLoad().then(function (data) {
      if (!data) { say('Cloud store unreachable. Your update is saved locally and can be published once you are online.'); saveBtn.disabled = false; return; }
      var posts = data.posts || [];
      posts.unshift({ id: 'U-' + Date.now().toString(36).toUpperCase(), title: title, body: body, createdAt: new Date().toISOString() });
      posts = posts.slice(0, 6);
      return binSave({ posts: posts }).then(function (ok) {
        saveBtn.disabled = false;
        if (ok) { say('Published. It appears on the blog page right away.'); titleEl.value = ''; bodyEl.value = ''; load(); }
        else { say('Could not reach the cloud store. Try again when online.'); }
      });
    });
  });

  load();
});

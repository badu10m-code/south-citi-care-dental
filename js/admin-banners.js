// admin-banners.js: banner manager (templates + upload + list) for admin-banners.html
var cfg = null;
var pickedTpl = 'festive';

document.addEventListener('DOMContentLoaded', function () {
  document.addEventListener('scc-admin-ready', function () {
    buildTplGrid();
    wirePreview();
    wireUpload();
    refreshList();
  });

  function buildTplGrid() {
    var grid = document.getElementById('tpl-grid');
    grid.innerHTML = Object.keys(SCC_TEMPLATES).map(function (k) {
      return '<button type="button" class="tpl-item" data-tpl="' + k + '">' +
        '<span class="tpl-chip" style="background:' + SCC_TEMPLATES[k].bg + '">' + SCC_TEMPLATES[k].name + '</span>' +
        '<span class="name">' + SCC_TEMPLATES[k].name + '</span></button>';
    }).join('');
    grid.addEventListener('click', function (ev) {
      var item = ev.target.closest('.tpl-item');
      if (!item) return;
      pickedTpl = item.dataset.tpl;
      grid.querySelectorAll('.tpl-item').forEach(function (b) { b.classList.toggle('active', b === item); });
      preview();
    });
    grid.querySelector('[data-tpl="' + pickedTpl + '"]').classList.add('active');
  }

  function curBanner() {
    return {
      type: 'template', tpl: pickedTpl,
      badge: document.getElementById('tpl-badge').value.trim(),
      heading: document.getElementById('tpl-heading').value.trim(),
      sub: document.getElementById('tpl-sub').value.trim(),
      cta: document.getElementById('tpl-cta').value.trim()
    };
  }
  function preview() {
    var b = curBanner();
    b.heading = b.heading || 'Your offer headline here';
    document.getElementById('tpl-preview').innerHTML = bannerHTML(b);
  }
  function wirePreview() {
    ['tpl-badge', 'tpl-heading', 'tpl-sub', 'tpl-cta'].forEach(function (id) {
      document.getElementById(id).addEventListener('input', preview);
    });
    preview();
    document.getElementById('save-tpl').addEventListener('click', function () {
      var b = curBanner();
      if (!b.heading && !b.badge) { alert('Write at least a heading for the banner.'); return; }
      var btn = this;
      btn.disabled = true; btn.textContent = 'Saving...';
      var entry = b;
      entry.id = 'B-' + Date.now().toString(36).toUpperCase();
      entry.created = new Date().toISOString();
      entry.active = true;
      loadConfig().then(function (c) {
        var banners = (c.banners || []).concat([entry]).slice(-6); // demo store: keep the latest 6
        return saveConfig({ banners: banners });
      }).then(function () {
        btn.disabled = false; btn.textContent = 'Save banner to homepage';
        document.getElementById('tpl-badge').value = '';
        document.getElementById('tpl-heading').value = '';
        document.getElementById('tpl-sub').value = '';
        document.getElementById('tpl-cta').value = '';
        preview();
        refreshList();
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Save banner to homepage';
        alert('Could not reach the cloud store. Try again in a minute.');
      });
    });
  }

  function wireUpload() {
    document.getElementById('banner-file').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var st = document.getElementById('upload-status');
      st.textContent = 'Compressing image...';
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var maxW = 1400, scale = Math.min(1, maxW / img.width);
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        var data = cv.toDataURL('image/jpeg', 0.72);
        URL.revokeObjectURL(url);
        st.textContent = 'Saving (' + Math.round(data.length / 1024) + ' KB after compression)...';
        var entry = { id: 'B-' + Date.now().toString(36).toUpperCase(), type: 'upload', data: data, name: file.name, created: new Date().toISOString(), active: true };
        loadConfig().then(function (c) {
          var banners = (c.banners || []).concat([entry]).slice(-6);
          return saveConfig({ banners: banners });
        }).then(function () {
          st.textContent = 'Saved. It is now live on the homepage carousel.';
          refreshList();
        }).catch(function () {
          st.textContent = 'Could not reach the cloud store. Try again in a minute, or use a template meanwhile.';
        });
        this.value = '';
      };
      img.onerror = function () { st.textContent = 'That file could not be read as an image.'; };
      img.src = url;
    });
  }

  function refreshList() {
    var wrap = document.getElementById('banner-list');
    wrap.innerHTML = '<p class="empty">Loading&hellip;</p>';
    loadConfig().then(function (c) {
      cfg = c;
      var banners = c.banners || [];
      if (!banners.length) {
        wrap.innerHTML = '<p class="empty">No banners yet. Save a template or upload a poster above.</p>';
        return;
      }
      wrap.innerHTML = banners.slice().reverse().map(function (b) {
        var thumb = (b.type === 'upload' && b.data)
          ? '<img class="banner-thumb" src="' + b.data + '" alt="">'
          : '<span class="banner-thumb tpl" style="background:' + ((SCC_TEMPLATES[b.tpl] || SCC_TEMPLATES.offer).bg) + '">' + esc(b.heading || 'Template banner') + '</span>';
        return '<div class="banner-row" data-id="' + esc(b.id) + '">' +
          thumb +
          '<div class="meta"><b>' + esc(b.heading || (b.type === 'upload' ? (b.name || 'Uploaded poster') : 'Template banner')) + '</b>' +
          '<span>' + (b.type === 'upload' ? 'Uploaded poster' : 'Template: ' + ((SCC_TEMPLATES[b.tpl] || {}).name || b.tpl)) + ' · ' + esc((b.created || '').slice(0, 10)) + '</span></div>' +
          '<button class="tgl ' + (b.active !== false ? 'on' : 'off') + '" data-tgl>' + (b.active !== false ? 'Showing on homepage' : 'Hidden') + '</button>' +
          '<button class="del" data-del title="Delete banner">&#10005;</button>' +
        '</div>';
      }).join('');
      wrap.querySelectorAll('.banner-row').forEach(function (row) {
        var id = row.dataset.id;
        row.querySelector('[data-tgl]').addEventListener('click', function () {
          var b = cfg.banners.find(function (x) { return x.id === id; });
          if (!b) return;
          b.active = (b.active !== false) ? false : true;
          saveConfig({ banners: cfg.banners }).then(refreshList);
        });
        row.querySelector('[data-del]').addEventListener('click', function () {
          if (!confirm('Delete this banner?')) return;
          cfg.banners = cfg.banners.filter(function (x) { return x.id !== id; });
          saveConfig({ banners: cfg.banners }).then(refreshList);
        });
      });
    });
  }
});

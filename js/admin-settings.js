// admin-settings.js: homepage video + hero image settings
function ytIdOf(url) {
  var m = String(url || '').match(/(?:v=|youtu\.be\/|embed\/|shorts\/)([A-Za-z0-9_-]{11})/);
  return m ? m[1] : (/^[A-Za-z0-9_-]{11}$/.test(String(url || '').trim()) ? String(url).trim() : '');
}
document.addEventListener('scc-admin-ready', function () {
    loadConfig().then(function (c) {
      paint(c);
    });

    function paint(c) {
      var v = document.getElementById('video-now');
      if (c.heroVideo) v.textContent = 'Current video: https://youtu.be/' + c.heroVideo;
      else v.textContent = 'No video set yet. The homepage shows a clinic photo instead.';
      var h = document.getElementById('hero-now');
      if (c.heroImage) h.textContent = c.heroImage.indexOf('data:') === 0 ? 'Current hero: an uploaded image.' : 'Current hero: ' + c.heroImage;
      else h.textContent = 'Current hero: the default treatment-room photo.';
      if (c.heroImage && c.heroImage.indexOf('assets/') === 0) document.getElementById('hero-pick').value = c.heroImage;
    }

    document.getElementById('save-video').addEventListener('click', function () {
      var id = ytIdOf(document.getElementById('video-url').value);
      if (!id) { alert('That does not look like a YouTube link. Paste the full link, e.g. https://www.youtube.com/watch?v=XXXXXXXXXXX'); return; }
      var btn = this;
      btn.disabled = true; btn.textContent = 'Saving...';
      saveConfig({ heroVideo: id }).then(function () {
        btn.disabled = false; btn.textContent = 'Save video';
        document.getElementById('video-url').value = '';
        document.getElementById('video-now').textContent = 'Current video: https://youtu.be/' + id;
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Save video';
        alert('Could not reach the cloud store. Try again in a minute.');
      });
    });
    document.getElementById('clear-video').addEventListener('click', function () {
      saveConfig({ heroVideo: '' }).then(function () {
        document.getElementById('video-now').textContent = 'No video set yet. The homepage shows a clinic photo instead.';
      });
    });

    document.getElementById('hero-file').addEventListener('change', function () {
      var file = this.files && this.files[0];
      if (!file) return;
      var st = document.getElementById('hero-now');
      st.textContent = 'Compressing image...';
      var img = new Image();
      var url = URL.createObjectURL(file);
      img.onload = function () {
        var maxW = 1920, scale = Math.min(1, maxW / img.width);
        var cv = document.createElement('canvas');
        cv.width = Math.round(img.width * scale);
        cv.height = Math.round(img.height * scale);
        cv.getContext('2d').drawImage(img, 0, 0, cv.width, cv.height);
        var data = cv.toDataURL('image/jpeg', 0.7);
        URL.revokeObjectURL(url);
        st.textContent = 'Saving (' + Math.round(data.length / 1024) + ' KB after compression)...';
        saveConfig({ heroImage: data }).then(function () {
          st.textContent = 'Saved. Refresh the homepage to see the new hero.';
        }).catch(function () {
          st.textContent = 'Could not reach the cloud store. Try again in a minute.';
        });
        this.value = '';
      };
      img.src = url;
    });
    document.getElementById('save-hero').addEventListener('click', function () {
      var pick = document.getElementById('hero-pick').value;
      var btn = this;
      btn.disabled = true; btn.textContent = 'Saving...';
      saveConfig({ heroImage: pick }).then(function () {
        btn.disabled = false; btn.textContent = 'Save hero image';
        document.getElementById('hero-now').textContent = 'Current hero: ' + pick;
      }).catch(function () {
        btn.disabled = false; btn.textContent = 'Save hero image';
        alert('Could not reach the cloud store. Try again in a minute.');
      });
    });
  });


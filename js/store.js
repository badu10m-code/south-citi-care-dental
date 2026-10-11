// Shared cloud store helpers: read-modify-write so no key is ever lost.
// GET carries a cache-buster (the CDN caches for 2 hours) and the PUT uses
// text/plain, because the API's CORS preflight on JSON PUTs fails in browsers.
function binLoad() {
  var bust = (STORE_URL.indexOf('?') === -1 ? '?' : '&') + 't=' + Date.now();
  return fetch(STORE_URL + bust).then(function (r) { return r.json(); })
    .then(function (d) { return (d && typeof d === 'object') ? d : {}; })
    .catch(function () { return null; });
}
function binSave(patch) {
  return binLoad().then(function (data) {
    if (!data) return null; // offline
    for (var k in patch) data[k] = patch[k];
    return fetch(STORE_URL, {
      method: 'PUT', headers: { 'Content-Type': 'text/plain' },
      body: JSON.stringify(data)
    }).then(function (r) { return r.ok ? data : null; }).catch(function () { return null; });
  }).catch(function () { return null; });
}

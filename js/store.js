// Shared cloud store helpers: read-modify-write so no key is ever lost
function binLoad() {
  return fetch(STORE_URL).then(function (r) { return r.json(); })
    .then(function (d) { return (d && typeof d === 'object') ? d : {}; })
    .catch(function () { return null; });
}
function binSave(patch) {
  return binLoad().then(function (data) {
    if (!data) return null; // offline
    for (var k in patch) data[k] = patch[k];
    return fetch(STORE_URL, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    }).then(function () { return data; });
  }).catch(function () { return null; });
}

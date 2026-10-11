// Owner access: one secret code, known only to the owner.
// First correct entry registers THIS device (cloud-locked), so no other
// device can register even with the code. Trusted devices open straight in.
var OWNER_CODE_HASH = '5bea47430ac8ecda8bdee91788c95815874c1f3335e1a258952d40f87ea04d54';

function ownerDevice() {
  try { return JSON.parse(localStorage.getItem('scc_owner') || 'null'); } catch (e) { return null; }
}

async function sha256(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

async function unlockWithCode(rawCode) {
  var hash = await sha256(String(rawCode || '').trim().toLowerCase());
  if (hash !== OWNER_CODE_HASH) {
    return { ok: false, error: 'Wrong code. This panel is for the owner only.' };
  }
  var token = Math.random().toString(36).slice(2) + Date.now().toString(36);
  var cloud = await binLoad();
  var staff = cloud && cloud.staff;
  if (staff && staff.token && staff.token !== token) {
    return { ok: false, error: 'Already registered on another device. Use that device, or reset the lock from it.' };
  }
  var device = {
    token: token,
    registeredAt: new Date().toISOString()
  };
  localStorage.setItem('scc_owner', JSON.stringify(device));
  sessionStorage.setItem('scc_session', '1');
  var saved = cloud ? await binSave({ staff: { role: 'owner', token: token, registeredAt: device.registeredAt } }) : null;
  return { ok: true, cloudLocked: !!saved };
}

async function forgetThisDevice() {
  localStorage.removeItem('scc_owner');
  sessionStorage.removeItem('scc_session');
  await binSave({ staff: null }); // release the lock so a new device can register
}

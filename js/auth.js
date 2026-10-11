// Owner OTP login: only the registered owner number can open the panel.
// First visit = register with a one-time code; trusted devices go straight in.
var OWNER_NUMBERS = ['9242158621']; // the only phone allowed to register
var OTP_TTL_MS = 10 * 60 * 1000;    // code valid for 10 minutes
var OTP_MAX_TRIES = 5;
var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/b4f05829e29ea159de2e8bbd344fb8f7';

function ownerDevice() {
  try { return JSON.parse(localStorage.getItem('scc_owner') || 'null'); } catch (e) { return null; }
}
function normalisePhone(raw) {
  var d = String(raw || '').replace(/\D/g, '');
  if (d.length > 10) d = d.slice(-10);
  return d;
}

async function sha256(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

async function sendOwnerOtp(rawPhone) {
  var phone = normalisePhone(rawPhone);
  if (OWNER_NUMBERS.indexOf(phone) === -1) {
    return { ok: false, error: 'This number is not registered as owner. Ask the clinic owner for access.' };
  }
  var code = String(Math.floor(100000 + Math.random() * 900000));
  var salt = Math.random().toString(36).slice(2, 10);
  var hash = await sha256(code + salt);
  var saved = await binSave({
    otp: { phone: phone, hash: hash, salt: salt, exp: Date.now() + OTP_TTL_MS, attempts: 0 }
  });
  if (!saved) return { ok: false, error: 'Could not start login. Check your internet connection and try again.' };

  var mail = await fetch(FORMSUBMIT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
    body: JSON.stringify({
      name: 'South Citi Care',
      _subject: 'South Citi Care login code: ' + code,
      message: 'Your South Citi Care staff login code is ' + code + '. It expires in 10 minutes. Do not share this code with anyone.'
    })
  }).then(function (r) { return r.json(); }).catch(function () { return { success: 'false' }; });

  if (String(mail.success) !== 'true') {
    return { ok: false, error: 'The code email could not be sent. Try again in a moment.' };
  }
  return { ok: true, phone: phone, maskHint: maskEmailHint() };
}

function maskEmailHint() {
  return 'braja•••••36@gmail.com';
}

async function verifyOwnerOtp(rawPhone, code) {
  var phone = normalisePhone(rawPhone);
  var data = await binLoad();
  var otp = data && data.otp;
  if (!data || !otp || otp.phone !== phone) {
    return { ok: false, error: 'No active code. Send a new one.' };
  }
  if (Date.now() > otp.exp) {
    await binSave({ otp: null });
    return { ok: false, error: 'That code has expired. Send a new one.' };
  }
  if (otp.attempts >= OTP_MAX_TRIES) {
    await binSave({ otp: null });
    return { ok: false, error: 'Too many wrong attempts. Send a new code.' };
  }
  var hash = await sha256(String(code).replace(/\D/g, '') + otp.salt);
  if (hash !== otp.hash) {
    await binSave({ otp: { phone: otp.phone, hash: otp.hash, salt: otp.salt, exp: otp.exp, attempts: otp.attempts + 1 } });
    var left = OTP_MAX_TRIES - (otp.attempts + 1);
    return { ok: false, error: 'Wrong code. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left.' };
  }
  await binSave({ otp: null });
  // first successful code = this device is now the registered owner device
  var device = ownerDevice();
  if (!device || device.phone !== phone) {
    device = {
      phone: phone,
      token: Math.random().toString(36).slice(2) + Date.now().toString(36),
      registeredAt: new Date().toISOString()
    };
    localStorage.setItem('scc_owner', JSON.stringify(device));
    await binSave({ staff: [{ role: 'owner', phone: phone, registeredAt: device.registeredAt }] });
  }
  sessionStorage.setItem('scc_session', '1');
  return { ok: true, firstTime: true };
}

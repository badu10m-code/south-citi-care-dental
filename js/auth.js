// Owner OTP login: only the registered clinic Gmail can open the panel.
// First visit = register with a one-time code; trusted devices go straight in.
var OWNER_EMAILS = ['brajasantra36@gmail.com']; // the only inbox allowed to register
var OTP_TTL_MS = 10 * 60 * 1000;    // code valid for 10 minutes
var OTP_MAX_TRIES = 5;
var FORMSUBMIT_URL = 'https://formsubmit.co/ajax/b4f05829e29ea159de2e8bbd344fb8f7';

function ownerDevice() {
  try { return JSON.parse(localStorage.getItem('scc_owner') || 'null'); } catch (e) { return null; }
}
function normaliseEmail(raw) {
  return String(raw || '').trim().toLowerCase();
}

async function sha256(text) {
  var buf = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf)).map(function (b) {
    return ('0' + b.toString(16)).slice(-2);
  }).join('');
}

async function sendOwnerOtp(rawEmail) {
  var email = normaliseEmail(rawEmail);
  if (OWNER_EMAILS.indexOf(email) === -1) {
    return { ok: false, error: 'This email is not registered as owner. Only the clinic owner\'s Gmail can access this panel.' };
  }
  var code = String(Math.floor(100000 + Math.random() * 900000));
  var salt = Math.random().toString(36).slice(2, 10);
  var hash = await sha256(code + salt);
  var saved = await binSave({
    otp: { email: email, hash: hash, salt: salt, exp: Date.now() + OTP_TTL_MS, attempts: 0 }
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
  return { ok: true, email: email };
}

async function verifyOwnerOtp(rawEmail, code) {
  var email = normaliseEmail(rawEmail);
  var data = await binLoad();
  var otp = data && data.otp;
  if (!data || !otp || otp.email !== email) {
    return { ok: false, error: 'No active code for this email. Send a new one.' };
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
    await binSave({ otp: { email: otp.email, hash: otp.hash, salt: otp.salt, exp: otp.exp, attempts: otp.attempts + 1 } });
    var left = OTP_MAX_TRIES - (otp.attempts + 1);
    return { ok: false, error: 'Wrong code. ' + left + ' attempt' + (left === 1 ? '' : 's') + ' left.' };
  }
  await binSave({ otp: null });
  // first successful code = this device is now the registered owner device
  var device = ownerDevice();
  if (!device || device.email !== email) {
    device = {
      email: email,
      token: Math.random().toString(36).slice(2) + Date.now().toString(36),
      registeredAt: new Date().toISOString()
    };
    localStorage.setItem('scc_owner', JSON.stringify(device));
    await binSave({ staff: [{ role: 'owner', email: email, registeredAt: device.registeredAt }] });
  }
  sessionStorage.setItem('scc_session', '1');
  return { ok: true, firstTime: true };
}

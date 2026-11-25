// Shared OTP storage across API routes for Phone and Email verification
// Uses 5-minute expiry per OTP with globalThis memory cache

const globalForOtp = globalThis;
if (!globalForOtp.__guptaOtpStore) {
  globalForOtp.__guptaOtpStore = new Map();
}
if (!globalForOtp.__guptaOtpRequests) {
  globalForOtp.__guptaOtpRequests = new Map();
}

const OTP_STORE = globalForOtp.__guptaOtpStore;
const OTP_REQUESTS = globalForOtp.__guptaOtpRequests;
const OTP_MAX_ATTEMPTS = 5;
const OTP_RESEND_WINDOW_MS = 60 * 1000;
const OTP_REQUEST_WINDOW_MS = 60 * 60 * 1000;

function normalizeKey(target) {
  if (!target) return '';
  const str = String(target).trim();
  if (str.includes('@')) {
    return `email:${str.toLowerCase()}`;
  }
  return `phone:${str.replace(/\D/g, '').slice(-10)}`;
}

export async function storeOtp(target, otp, metadata = {}) {
  const key = normalizeKey(target);
  const expiresAtMs = Date.now() + 1000 * 60 * 5; // 5 minutes
  const record = {
    otp: String(otp).trim(),
    expiresAt: expiresAtMs,
    attempts: 0,
    metadata,
  };
  OTP_STORE.set(key, record);
}

export function canRequestOtp(target) {
  const key = normalizeKey(target);
  const now = Date.now();
  const requests = (OTP_REQUESTS.get(key) || []).filter(time => now - time < OTP_REQUEST_WINDOW_MS);
  const tooSoon = requests.some(time => now - time < OTP_RESEND_WINDOW_MS);
  return {
    allowed: !tooSoon && requests.length < 5,
    retryAfter: tooSoon ? OTP_RESEND_WINDOW_MS - (now - requests[requests.length - 1]) : 0,
  };
}

export function recordOtpRequest(target) {
  const key = normalizeKey(target);
  const now = Date.now();
  const requests = (OTP_REQUESTS.get(key) || []).filter(time => now - time < OTP_REQUEST_WINDOW_MS);
  requests.push(now);
  OTP_REQUESTS.set(key, requests);
}

export async function getOtp(target) {
  const key = normalizeKey(target);
  const record = OTP_STORE.get(key);
  if (!record) return null;

  if (Date.now() > record.expiresAt) {
    OTP_STORE.delete(key);
    return null;
  }
  return record;
}

export async function isOtpValid(target, inputOtp) {
  const key = normalizeKey(target);
  const record = await getOtp(target);

  if (!record) return false;

  record.attempts = (record.attempts || 0) + 1;

  if (record.attempts > OTP_MAX_ATTEMPTS) {
    OTP_STORE.delete(key);
    return false;
  }

  const isMatch = String(record.otp).trim() === String(inputOtp).trim();
  if (isMatch) {
    return true;
  }
  return false;
}

export async function clearOtp(target) {
  const key = normalizeKey(target);
  OTP_STORE.delete(key);
}

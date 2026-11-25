import crypto from 'node:crypto';

export function hashSecret(value) {
  return crypto.createHash('sha256').update(String(value ?? '')).digest('hex');
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

export function generateOtp(length = 6) {
  return Array.from({ length }, () => crypto.randomInt(0, 10)).join('');
}

export function verifyOtpPayload(phone, sentOtp, inputOtp) {
  const cleanPhone = normalizePhone(phone);
  if (!/^\d{10}$/.test(cleanPhone)) return false;
  if (!/^[0-9]{6}$/.test(String(inputOtp || ''))) return false;
  return String(sentOtp || '') === String(inputOtp || '');
}

export function createSessionToken(user) {
  return crypto.randomBytes(32).toString('hex');
}

import test from 'node:test';
import assert from 'node:assert/strict';
import { hashSecret, generateOtp, normalizePhone, verifyOtpPayload } from './security.js';

test('hashSecret produces deterministic value for admin password', () => {
  assert.equal(hashSecret('gupta@2025'), '65e1eb5cf92cf9aa45174fb33da26f3f086f5e1de1f89cc3911dfae2f61b3fba');
});

test('generateOtp creates valid six-digit OTP', () => {
  const otp = generateOtp();
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test('phone normalization and OTP verification logic work', () => {
  assert.equal(normalizePhone('98765 43210'), '9876543210');
  assert.equal(verifyOtpPayload('9876543210', '123456', '123456'), true);
  assert.equal(verifyOtpPayload('9876543210', '123456', '654321'), false);
});

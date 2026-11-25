import test from 'node:test';
import assert from 'node:assert/strict';
import { generateOtp, isValidPhone, formatCurrency } from './utils.js';

test('generateOtp creates a 6-digit numeric OTP', () => {
  const otp = generateOtp();
  assert.equal(typeof otp, 'string');
  assert.equal(otp.length, 6);
  assert.match(otp, /^\d{6}$/);
});

test('phone validation accepts 10-digit Indian numbers', () => {
  assert.equal(isValidPhone('9876543210'), true);
  assert.equal(isValidPhone('98765'), false);
  assert.equal(isValidPhone('abcd'), false);
});

test('currency formatter stays in INR format', () => {
  assert.equal(formatCurrency(250), '₹250');
});

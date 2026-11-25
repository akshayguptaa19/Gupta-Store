import test from 'node:test';
import assert from 'node:assert/strict';
import { storeOtp, isOtpValid, clearOtp, getOtp } from '../src/lib/otpStore.js';

test('OTP Store - Store and retrieve OTP', async () => {
  const phone = '9876543210';
  const otp = '123456';
  
  await storeOtp(phone, otp);
  
  const record = await getOtp(phone);
  assert.ok(record, 'OTP should be stored');
  assert.equal(record.otp, otp, 'OTP should match');
});

test('OTP Store - Validate correct OTP', async () => {
  const phone = '1234567890';
  const otp = '654321';
  
  await storeOtp(phone, otp);
  const isValid = await isOtpValid(phone, otp);
  
  assert.equal(isValid, true, 'Valid OTP should return true');
});

test('OTP Store - Reject incorrect OTP', async () => {
  const phone = '5555555555';
  const otp = '111111';
  const wrongOtp = '999999';
  
  await storeOtp(phone, otp);
  const isValid = await isOtpValid(phone, wrongOtp);
  
  assert.equal(isValid, false, 'Invalid OTP should return false');
});

test('OTP Store - Clear OTP', async () => {
  const phone = '2222222222';
  const otp = '222222';
  
  await storeOtp(phone, otp);
  await clearOtp(phone);
  
  const isValid = await isOtpValid(phone, otp);
  assert.equal(isValid, false, 'Cleared OTP should not be valid');
});

test('OTP Store - Reject non-existent OTP', async () => {
  const isValid = await isOtpValid('9999999999', '000000');
  assert.equal(isValid, false, 'Non-existent OTP should return false');
});

test('OTP Store - Store and validate Email OTP with case normalization', async () => {
  const email = 'Customer@GuptaStore.in';
  const otp = '849201';

  await storeOtp(email, otp);

  // Validate with lowercase
  assert.equal(await isOtpValid('customer@guptastore.in', otp), true);
  // Validate with mixed case
  assert.equal(await isOtpValid('CUSTOMER@GUPTASTORE.IN', otp), true);
  // Validate wrong OTP
  assert.equal(await isOtpValid(email, '000000'), false);

  await clearOtp(email);
  assert.equal(await isOtpValid(email, otp), false);
});

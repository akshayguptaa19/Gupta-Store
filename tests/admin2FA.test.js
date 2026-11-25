import test from 'node:test';
import assert from 'node:assert/strict';

test('Live Admin 2FA Gateway: Step 1 password, 2FA challenge, Step 2 verification, and Session validation', async () => {
  const BASE = 'http://localhost:3000';

  // 1. Health check
  const resGet = await fetch(`${BASE}/api/admin/login`);
  const dataGet = await resGet.json();
  assert.equal(dataGet.ok, true);
  assert.equal(dataGet.twoFactorEnabled, true);

  // 2. Step 1: Wrong password rejected
  const resWrong = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'STEP1_PASSWORD', password: 'wrongpassword123' }),
  });
  const dataWrong = await resWrong.json();
  assert.equal(dataWrong.ok, false);
  assert.match(dataWrong.message, /Galat password/);

  // 3. Step 1: Correct default password initiates 2FA challenge
  const resStep1 = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'STEP1_PASSWORD', password: 'gupta@2025' }),
  });
  const dataStep1 = await resStep1.json();
  assert.equal(dataStep1.ok, true);
  assert.equal(dataStep1.step, '2FA_REQUIRED');
  assert.ok(dataStep1.challengeId);
  assert.ok(dataStep1.maskedEmail);

  const challengeId = dataStep1.challengeId;

  // 4. Step 2: Invalid 6-digit OTP rejected
  const resBadOtp = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'STEP2_VERIFY_2FA', challengeId, otp: '000000' }),
  });
  const dataBadOtp = await resBadOtp.json();
  assert.equal(dataBadOtp.ok, false);
  assert.match(dataBadOtp.message, /Galat verification code/);

  // 5. Step 2: Emergency Master Recovery PIN (810761) authenticates successfully
  const resMasterPin = await fetch(`${BASE}/api/admin/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action: 'STEP2_VERIFY_2FA', challengeId, emergencyPin: '810761' }),
  });
  const dataMasterPin = await resMasterPin.json();
  assert.equal(dataMasterPin.ok, true);
  assert.ok(dataMasterPin.token);
  assert.ok(dataMasterPin.expiresAt > Date.now());

  // 6. Verify Session endpoint validates token
  const resVerify = await fetch(`${BASE}/api/admin/verify-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${dataMasterPin.token}`,
    },
  });
  const dataVerify = await resVerify.json();
  assert.equal(dataVerify.ok, true);
  assert.equal(dataVerify.valid, true);
});

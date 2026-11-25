import test from 'node:test';
import assert from 'node:assert/strict';

import {
  isTwilioConfigured,
  isRazorpayConfigured,
  isLiveServicesConfigured,
} from '../src/lib/liveServices.js';

test('OTP config is independent from Razorpay config', () => {
  process.env.TWILIO_ACCOUNT_SID = 'sid';
  process.env.TWILIO_AUTH_TOKEN = 'token';
  process.env.TWILIO_PHONE_NUMBER = '+1234567890';
  delete process.env.RAZORPAY_KEY_ID;
  delete process.env.RAZORPAY_KEY_SECRET;

  assert.equal(isTwilioConfigured(), true);
  assert.equal(isRazorpayConfigured(), false);
  assert.equal(isLiveServicesConfigured(), true);
});

test('Razorpay config is independent from Twilio config', () => {
  delete process.env.TWILIO_ACCOUNT_SID;
  delete process.env.TWILIO_AUTH_TOKEN;
  delete process.env.TWILIO_PHONE_NUMBER;
  process.env.RAZORPAY_KEY_ID = 'rzp_test';
  process.env.RAZORPAY_KEY_SECRET = 'secret';

  assert.equal(isTwilioConfigured(), false);
  assert.equal(isRazorpayConfigured(), true);
  assert.equal(isLiveServicesConfigured(), true);
});

test('Email config check detects EMAIL_USER and EMAIL_PASS', async () => {
  const { isEmailConfigured } = await import('../src/lib/emailService.js');
  
  delete process.env.EMAIL_USER;
  delete process.env.EMAIL_PASS;
  delete process.env.RESEND_API_KEY;
  assert.equal(isEmailConfigured(), false);

  process.env.EMAIL_USER = 'guptastore@gmail.com';
  process.env.EMAIL_PASS = 'app_password_1234';
  assert.equal(isEmailConfigured(), true);
});


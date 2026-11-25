const fs = require('fs');
const content = fs.readFileSync('android-app/app/src/main/assets/www/index.html', 'utf8');

const checks = [
  { name: 'custEmail in cart form', test: content.includes('id="custEmail"') },
  { name: 'Email ID label in cart form', test: content.includes('Email ID (Email Address) *') },
  { name: 'Header Auth button', test: content.includes('id="headerAuthBtn"') },
  { name: 'Bottom nav Account tab', test: content.includes('id="navAccountTab"') },
  { name: 'Account view container', test: content.includes('id="accountView"') },
  { name: 'Sign up form with regEmail', test: content.includes('id="regEmail"') },
  { name: 'Sign in form with loginEmail', test: content.includes('id="loginEmail"') },
  { name: 'Password & confirm password', test: content.includes('id="regConfirmPassword"') },
  { name: 'Supabase signup API call', test: content.includes('/auth/v1/signup') },
  { name: 'Supabase login API call', test: content.includes('/auth/v1/token?grant_type=password') },
  { name: 'Supabase password recovery call', test: content.includes('/auth/v1/recover') },
  { name: 'Supabase order persist call', test: content.includes('/rest/v1/orders') },
  { name: 'AndroidBridge onAppReady signal', test: content.includes('window.AndroidBridge.onAppReady()') },
];

console.log('--- VERIFICATION SUMMARY ---');
let allPassed = true;
checks.forEach(c => {
  console.log(`${c.test ? '✅ PASS' : '❌ FAIL'}: ${c.name}`);
  if (!c.test) allPassed = false;
});

if (allPassed) {
  console.log('ALL VERIFICATIONS PASSED SUCCESSFULLY!');
} else {
  console.error('SOME CHECKS FAILED!');
  process.exit(1);
}


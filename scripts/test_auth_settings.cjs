const fs = require('fs');
const env = fs.readFileSync('.env.local', 'utf8');
const parsed = {};
env.split('\n').forEach(line => {
  const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
  if (match) {
    let value = match[2] || '';
    value = value.trim().replace(/^['"]|['"]$/g, '');
    parsed[match[1]] = value;
  }
});

async function run() {
  const url = parsed.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Test Supabase Auth settings / signup endpoint
  const res = await fetch(`${url}/auth/v1/settings`, {
    headers: {
      'apikey': anonKey,
      'Authorization': `Bearer ${anonKey}`
    }
  });
  console.log('Auth settings status:', res.status);
  const data = await res.json();
  console.log('External email enabled:', data.external?.email);
  console.log('Mailer autoconfirm:', data.mailer_autoconfirm);
}
run();


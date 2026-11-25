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
  const key = parsed.SUPABASE_SERVICE_ROLE_KEY;

  // Let's test calling SQL query endpoint on Supabase management
  const res = await fetch(`${url}/pg`, {
    method: 'POST',
    headers: {
      'apikey': key,
      'Authorization': `Bearer ${key}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ query: 'SELECT 1;' })
  });
  console.log('PG endpoint status:', res.status);
}
run();


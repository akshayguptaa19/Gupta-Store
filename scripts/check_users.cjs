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
const { createClient } = require('@supabase/supabase-js');
const url = parsed.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = parsed.NEXT_PUBLIC_SUPABASE_ANON_KEY;
const supabase = createClient(url, anonKey);

async function run() {
  const { data: users, error: listErr } = await createClient(url, parsed.SUPABASE_SERVICE_ROLE_KEY).auth.admin.listUsers();
  console.log('Registered users in Supabase:');
  users.users.forEach(u => {
    console.log(`- ID: ${u.id} | Email: ${u.email} | Phone: ${u.user_metadata?.phone} | Name: ${u.user_metadata?.name} | Confirmed: ${Boolean(u.email_confirmed_at)}`);
  });
}
run();


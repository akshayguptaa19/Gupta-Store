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
const key = parsed.SUPABASE_SERVICE_ROLE_KEY;
const supabase = createClient(url, key);

async function run() {
  const { data: prods, error: pErr } = await supabase.from('products').select('*').limit(10);
  console.log('--- 10 Products from Supabase DB ---');
  prods.forEach(p => {
    console.log(`[${p.legacy_mongo_id}] ${p.name} | img: ${p.image_url}`);
  });
}
run();

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
  // Test if orders can be read and written by service role
  const testId = 'TEST-' + Date.now();
  const { data: ins, error: insErr } = await supabase.from('orders').insert({
    order_id: testId,
    status: 'placed',
    payment: 'cod',
    payment_status: 'pending',
    total: 99,
    order_data: { test: true }
  }).select();
  console.log('Service role insert order:', ins ? 'Success' : 'Failed', insErr?.message);
  if (ins) {
    // Delete test order
    await supabase.from('orders').delete().eq('order_id', testId);
    console.log('Deleted test order.');
  }
}
run();


import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { hashSecret } from '@/lib/security';
import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';

const SETTINGS_FILE = path.join(process.cwd(), 'src', 'data', 'admin-settings.json');

async function getStoredPasswordHash() {
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('order_data')
        .eq('order_id', 'SYS_SETTINGS')
        .maybeSingle();

      if (!error && data?.order_data?.passwordHash) {
        return data.order_data.passwordHash;
      }
    } catch {}
  }

  try {
    const raw = await fs.readFile(SETTINGS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return parsed.passwordHash || '';
  } catch {
    return '';
  }
}

async function setStoredPasswordHash(hash) {
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('orders').upsert({
        order_id: 'SYS_SETTINGS',
        legacy_mongo_id: 'SYS_SETTINGS',
        status: 'system',
        payment: 'system',
        payment_status: 'system',
        total: 0,
        order_data: { passwordHash: hash, updatedAt: new Date().toISOString() },
      }, { onConflict: 'order_id' });
    } catch {}
  }

  try {
    const dir = path.dirname(SETTINGS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(SETTINGS_FILE, JSON.stringify({ passwordHash: hash, updatedAt: new Date().toISOString() }, null, 2), 'utf8');
  } catch {}
}

export async function POST(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { action, currentPassword, newPassword } = await request.json();
    if (action !== 'CHANGE_PASSWORD') {
      return NextResponse.json({ ok: false, message: 'Invalid settings action.' }, { status: 400 });
    }
    if (typeof newPassword !== 'string' || newPassword.length < 10) {
      return NextResponse.json({ ok: false, message: 'New password kam se kam 10 characters ka hona chahiye.' }, { status: 400 });
    }

    const storedHash = await getStoredPasswordHash();
    const configuredPassword = process.env.ADMIN_PASSWORD || 'madhu@2007';
    const currentValid = storedHash
      ? hashSecret(currentPassword) === storedHash
      : String(currentPassword || '') === configuredPassword;

    if (!currentValid) {
      return NextResponse.json({ ok: false, message: 'Current admin password galat hai.' }, { status: 401 });
    }

    await setStoredPasswordHash(hashSecret(newPassword));
    return NextResponse.json({ ok: true, message: 'Admin password successfully change ho gaya.' });
  } catch (error) {
    console.error('[Admin Settings Error]:', error);
    return NextResponse.json({ ok: false, message: 'Settings service temporarily unavailable.' }, { status: 500 });
  }
}

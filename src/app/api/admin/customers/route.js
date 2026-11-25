import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { listAllCustomers, updateCustomerBlock } from '@/lib/supabaseAuth';

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const customers = await listAllCustomers();
    return NextResponse.json({ ok: true, customers });
  } catch (error) {
    console.error('[Admin Customers GET Error]:', error);
    return NextResponse.json({ ok: false, message: 'Customers database unavailable.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const { email, phone, blocked, reason } = await request.json();
    const cleanEmail = String(email || '').trim().toLowerCase();
    const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if ((!cleanEmail && !cleanPhone) || typeof blocked !== 'boolean') {
      return NextResponse.json({ ok: false, message: 'Valid customer aur block state required.' }, { status: 400 });
    }

    const res = await updateCustomerBlock({ email: cleanEmail, phone: cleanPhone, blocked, reason });
    if (!res.ok) {
      return NextResponse.json({ ok: false, message: res.message }, { status: res.status || 400 });
    }

    return NextResponse.json({ ok: true, blocked: res.blocked });
  } catch (error) {
    console.error('[Admin Customers PATCH Error]:', error);
    return NextResponse.json({ ok: false, message: 'Customer block state update failed.' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getSupabaseOrders } from '@/lib/supabaseOrders';

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    const orders = await getSupabaseOrders();
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error('[Admin Orders Error]:', error);
    return NextResponse.json({ ok: false, message: 'Order database unavailable.' }, { status: 500 });
  }
}

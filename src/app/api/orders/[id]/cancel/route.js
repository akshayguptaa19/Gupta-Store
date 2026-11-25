import { NextResponse } from 'next/server';
import { cancelSupabaseOrder } from '@/lib/supabaseOrders';

export async function POST(request, { params }) {
  try {
    const { id } = await params;
    const body = await request.json().catch(() => ({}));
    const phone = String(body.phone || '').replace(/\D/g, '').slice(-10);
    const email = String(body.email || '').trim().toLowerCase();

    if (!phone && !email) {
      return NextResponse.json({ ok: false, message: 'Customer phone or email is required to cancel.' }, { status: 400 });
    }

    const result = await cancelSupabaseOrder(id, { phone, email });
    if (!result.ok) {
      return NextResponse.json({ ok: false, message: result.message }, { status: result.status || 400 });
    }

    return NextResponse.json({ ok: true, message: result.message });
  } catch (error) {
    console.error('[Customer Cancel Error]:', error.message);
    return NextResponse.json({ ok: false, message: 'Order cancel nahi ho saka. Dobara try karein.' }, { status: 500 });
  }
}

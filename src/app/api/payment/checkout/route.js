import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/liveServices';

export async function POST(request) {
  try {
    const body = await request.json();
    const razorpay = getRazorpayClient();

    if (!razorpay) {
      return NextResponse.json({ ok: false, message: 'Razorpay is not configured' }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: Math.round(Number(body.amount || 0) * 100),
      currency: 'INR',
      receipt: body.receipt || `GGS-${Date.now()}`,
    });

    return NextResponse.json({ ok: true, order });
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Failed to create payment order' }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import crypto from 'node:crypto';

export async function POST(request) {
  try {
    const body = await request.json();
    const secret = process.env.RAZORPAY_KEY_SECRET;

    if (!secret) {
      return NextResponse.json({ ok: false, message: 'Razorpay secret missing' }, { status: 400 });
    }

    const expected = crypto
      .createHmac('sha256', secret)
      .update(body.order_id + '|' + body.payment_id)
      .digest('hex');

    const expBuf = Buffer.from(expected);
    const sigBuf = Buffer.from(String(body.signature || ''));
    const valid = expBuf.length === sigBuf.length && crypto.timingSafeEqual(expBuf, sigBuf);

    return NextResponse.json(
      { ok: valid, valid, message: valid ? 'Payment verified' : 'Invalid signature' },
      valid ? { status: 200 } : { status: 400 }
    );
  } catch (error) {
    return NextResponse.json({ ok: false, message: 'Payment verification failed' }, { status: 500 });
  }
}

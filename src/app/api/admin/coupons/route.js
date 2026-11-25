import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { getActiveCoupons, setCoupon, deleteCoupon } from '@/lib/couponsStore';

function cleanCode(value) {
  return String(value || '').trim().toUpperCase().replace(/[^A-Z0-9_-]/g, '').slice(0, 24);
}

export async function GET(request) {
  if (!requireAdmin(request)) return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  try {
    const coupons = await getActiveCoupons();
    return NextResponse.json({ ok: true, coupons });
  } catch {
    return NextResponse.json({ ok: false, message: 'Coupons database unavailable.' }, { status: 500 });
  }
}

export async function POST(request) {
  if (!requireAdmin(request)) return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  try {
    const { code, discount, minOrder } = await request.json();
    const clean = cleanCode(code);
    const value = Number(discount);
    const minimum = Number(minOrder) || 0;
    if (clean.length < 3 || !Number.isFinite(value) || value <= 0 || value > 10000 || minimum < 0) {
      return NextResponse.json({ ok: false, message: 'Valid coupon code aur discount amount daalo.' }, { status: 400 });
    }

    await setCoupon(clean, { discount: value, minOrder: minimum });
    return NextResponse.json({ ok: true, code: clean, discount: value, minOrder: minimum });
  } catch {
    return NextResponse.json({ ok: false, message: 'Coupon save nahi ho saka.' }, { status: 500 });
  }
}

export async function PATCH(request) {
  if (!requireAdmin(request)) return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  try {
    const { code, discount, minOrder } = await request.json();
    const clean = cleanCode(code);
    const value = Number(discount);
    const minimum = Number(minOrder) || 0;
    if (!clean || !Number.isFinite(value) || value <= 0 || value > 10000 || minimum < 0) {
      return NextResponse.json({ ok: false, message: 'Valid discount aur minimum shopping amount daalo.' }, { status: 400 });
    }

    await setCoupon(clean, { discount: value, minOrder: minimum });
    return NextResponse.json({ ok: true, code: clean, discount: value, minOrder: minimum });
  } catch {
    return NextResponse.json({ ok: false, message: 'Coupon update nahi ho saka.' }, { status: 500 });
  }
}

export async function DELETE(request) {
  if (!requireAdmin(request)) return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  try {
    const code = cleanCode(new URL(request.url).searchParams.get('code'));
    if (!code) return NextResponse.json({ ok: false, message: 'Coupon code required.' }, { status: 400 });

    await deleteCoupon(code);
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, message: 'Coupon delete nahi ho saka.' }, { status: 500 });
  }
}

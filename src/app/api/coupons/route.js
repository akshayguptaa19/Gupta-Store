import { NextResponse } from 'next/server';
import { getActiveCoupons } from '@/lib/couponsStore';

export async function GET() {
  try {
    const coupons = await getActiveCoupons();
    return NextResponse.json(
      { ok: true, coupons },
      { headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' } }
    );
  } catch {
    return NextResponse.json({ ok: true, coupons: {} });
  }
}

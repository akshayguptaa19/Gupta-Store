import { NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/adminAuth';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';

const globalForWishlist = globalThis;
if (!globalForWishlist.__guptaWishlist) {
  globalForWishlist.__guptaWishlist = new Map();
}

async function syncWishlistWithDb() {
  if (supabaseAdmin) {
    try {
      const { data } = await supabaseAdmin.from('orders').select('order_data').eq('order_id', 'SYS_WISHLIST').maybeSingle();
      if (Array.isArray(data?.order_data?.items)) {
        globalForWishlist.__guptaWishlist.clear();
        for (const item of data.order_data.items) {
          globalForWishlist.__guptaWishlist.set(`${item.visitorId}:${item.productId}`, item);
        }
      }
    } catch {}
  }
}

export async function GET(request) {
  if (!requireAdmin(request)) {
    return NextResponse.json({ ok: false, message: 'Admin authentication required' }, { status: 401 });
  }

  try {
    await syncWishlistWithDb();
    const counts = {};
    for (const entry of globalForWishlist.__guptaWishlist.values()) {
      counts[entry.productId] = (counts[entry.productId] || 0) + 1;
    }
    return NextResponse.json({ ok: true, counts });
  } catch {
    return NextResponse.json({ ok: true, counts: {} });
  }
}

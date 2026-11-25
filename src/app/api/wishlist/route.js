import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';

const globalForWishlist = globalThis;
if (!globalForWishlist.__guptaWishlist) {
  globalForWishlist.__guptaWishlist = new Map(); // visitorId:productId -> true
}

let wishlistLoaded = false;
async function syncWishlistWithDb() {
  if (wishlistLoaded) return;
  wishlistLoaded = true;
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

async function persistWishlistToDb() {
  if (!supabaseAdmin) return;
  try {
    const items = Array.from(globalForWishlist.__guptaWishlist.values());
    await supabaseAdmin.from('orders').upsert({
      order_id: 'SYS_WISHLIST',
      legacy_mongo_id: 'SYS_WISHLIST',
      status: 'system',
      payment: 'system',
      payment_status: 'system',
      total: 0,
      order_data: { items, updatedAt: new Date().toISOString() },
    }, { onConflict: 'order_id' });
  } catch {}
}

export async function POST(request) {
  try {
    await syncWishlistWithDb();
    const { productId, wished, visitorId } = await request.json();
    const cleanProductId = String(productId || '').trim();
    const cleanVisitorId = String(visitorId || '').trim().slice(0, 140);

    if (!cleanProductId || !cleanVisitorId || typeof wished !== 'boolean') {
      return NextResponse.json({ ok: false, message: 'Invalid wishlist event' }, { status: 400 });
    }

    const key = `${cleanVisitorId}:${cleanProductId}`;
    if (wished) {
      globalForWishlist.__guptaWishlist.set(key, { productId: cleanProductId, visitorId: cleanVisitorId });
    } else {
      globalForWishlist.__guptaWishlist.delete(key);
    }

    persistWishlistToDb().catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}

export async function GET() {
  try {
    await syncWishlistWithDb();
    const counts = {};
    for (const entry of globalForWishlist.__guptaWishlist.values()) {
      const pId = String(entry.productId);
      counts[pId] = (counts[pId] || 0) + 1;
    }
    return NextResponse.json({ ok: true, counts, totalSaves: globalForWishlist.__guptaWishlist.size });
  } catch {
    return NextResponse.json({ ok: true, counts: {}, totalSaves: 0 });
  }
}

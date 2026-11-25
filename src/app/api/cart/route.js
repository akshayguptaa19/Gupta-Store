import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabaseAdmin.js';

const globalForCart = globalThis;
if (!globalForCart.__guptaCloudCarts) {
  globalForCart.__guptaCloudCarts = new Map(); // userId -> { items: [], updatedAt: string }
}

let dbLoaded = false;
async function initDbCarts() {
  if (dbLoaded) return;
  dbLoaded = true;
  if (!supabaseAdmin) return;
  try {
    const { data } = await supabaseAdmin
      .from('orders')
      .select('order_id, order_data')
      .ilike('order_id', 'CART_%')
      .limit(500);

    if (Array.isArray(data)) {
      for (const row of data) {
        const userId = row.order_id.replace(/^CART_/, '');
        if (userId && Array.isArray(row.order_data?.items)) {
          globalForCart.__guptaCloudCarts.set(userId, {
            items: row.order_data.items,
            updatedAt: row.order_data.updatedAt || new Date().toISOString(),
          });
        }
      }
    }
  } catch (err) {
    console.error('Failed to init cloud carts from db:', err?.message || err);
  }
}

async function persistCartToDb(userId, items) {
  if (!supabaseAdmin || !userId) return;
  try {
    const recordId = `CART_${userId.slice(0, 100)}`;
    await supabaseAdmin.from('orders').upsert({
      order_id: recordId,
      legacy_mongo_id: recordId,
      status: 'cart_cloud_sync',
      payment: 'system',
      payment_status: 'system',
      total: items.reduce((acc, it) => acc + (Number(it.price) || 0) * (Number(it.qty) || 1), 0),
      order_data: {
        userId,
        items,
        updatedAt: new Date().toISOString(),
      },
    }, { onConflict: 'order_id' });
  } catch (err) {
    console.error('Failed to persist cloud cart to db:', err?.message || err);
  }
}

// GET /api/cart?userId=...
export async function GET(request) {
  try {
    await initDbCarts();
    const { searchParams } = new URL(request.url);
    const userId = String(searchParams.get('userId') || '').trim();

    if (!userId) {
      return NextResponse.json({ ok: false, message: 'userId is required' }, { status: 400 });
    }

    // Try in-memory first
    let cartEntry = globalForCart.__guptaCloudCarts.get(userId);

    // If not in memory, query DB directly
    if (!cartEntry && supabaseAdmin) {
      try {
        const { data } = await supabaseAdmin
          .from('orders')
          .select('order_data')
          .eq('order_id', `CART_${userId.slice(0, 100)}`)
          .maybeSingle();

        if (data?.order_data?.items) {
          cartEntry = {
            items: data.order_data.items,
            updatedAt: data.order_data.updatedAt || new Date().toISOString(),
          };
          globalForCart.__guptaCloudCarts.set(userId, cartEntry);
        }
      } catch {}
    }

    return NextResponse.json({
      ok: true,
      items: cartEntry?.items || [],
      updatedAt: cartEntry?.updatedAt || null,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}

// POST /api/cart
export async function POST(request) {
  try {
    await initDbCarts();
    const body = await request.json();
    const userId = String(body.userId || '').trim();
    const items = Array.isArray(body.items) ? body.items : [];

    if (!userId) {
      return NextResponse.json({ ok: false, message: 'userId is required' }, { status: 400 });
    }

    const cartData = {
      items,
      updatedAt: new Date().toISOString(),
    };

    globalForCart.__guptaCloudCarts.set(userId, cartData);
    persistCartToDb(userId, items).catch(() => {});

    return NextResponse.json({
      ok: true,
      count: items.length,
      updatedAt: cartData.updatedAt,
    });
  } catch (error) {
    return NextResponse.json({ ok: false, message: error.message }, { status: 500 });
  }
}


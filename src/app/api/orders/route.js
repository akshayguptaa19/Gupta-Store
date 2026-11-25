import { NextResponse } from 'next/server';
import { getRazorpayClient } from '@/lib/liveServices';
import { sendOrderStatusEmail } from '@/lib/emailService';
import { getSupabaseOrders, createSupabaseOrder, updateSupabaseOrder, getSupabaseOrderById } from '@/lib/supabaseOrders';
import { getSupabaseProducts } from '@/lib/supabaseProducts';
import { BASE_PRODUCTS } from '@/lib/products';
import { getActiveCoupons } from '@/lib/couponsStore';
import { calcTotals } from '@/lib/utils';
import { SHOP } from '@/lib/config';
import { findUserByEmail, findUserByPhone } from '@/lib/supabaseAuth';

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const phone = url.searchParams.get('phone');
    const email = url.searchParams.get('email');
    const ids = url.searchParams.get('ids');
    const orderIds = ids ? ids.split(',').map(s => s.trim()).filter(Boolean) : [];
    const normalizedPhone = phone ? phone.replace(/\D/g, '').slice(-10) : '';
    const cleanEmail = email ? String(email).trim().toLowerCase() : '';

    if (!normalizedPhone && !cleanEmail && orderIds.length === 0) {
      return NextResponse.json({ ok: false, message: 'Customer phone, email, or order IDs required.' }, { status: 400 });
    }

    const orders = await getSupabaseOrders({ phone: normalizedPhone, email: cleanEmail, orderIds });
    return NextResponse.json({ ok: true, orders });
  } catch (error) {
    console.error('[Orders GET Error]:', error);
    return NextResponse.json({ ok: false, message: 'Failed to fetch orders' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const payload = await request.json();
    if (payload.payment !== 'cod' && payload.payment !== 'whatsapp') {
      return NextResponse.json({ ok: false, message: 'Abhi sirf Cash on Delivery aur WhatsApp order available hai.' }, { status: 400 });
    }

    const cleanEmail = String(payload.customerEmail || '').trim().toLowerCase();
    if (!cleanEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(cleanEmail)) {
      return NextResponse.json({ ok: false, message: 'Order karne ke liye registered email account se login/register karna zaroori hai.' }, { status: 401 });
    }

    const cleanPhone = String(payload.address?.phone || '').replace(/\D/g, '').slice(-10);

    // Check if customer is blocked (run in parallel)
    try {
      const [userByEmail, userByPhone] = await Promise.all([
        cleanEmail ? findUserByEmail(cleanEmail) : Promise.resolve(null),
        cleanPhone ? findUserByPhone(cleanPhone) : Promise.resolve(null),
      ]);
      const blockedUser = (userByEmail?.blocked && userByEmail) || (userByPhone?.blocked && userByPhone);

      if (blockedUser) {
        return NextResponse.json({
          ok: false,
          code: 'CUSTOMER_BLOCKED',
          message: 'Aapka account order place karne ke liye temporarily blocked hai. Support se contact karein.',
        }, { status: 403 });
      }
    } catch {
      // Continue if customer lookup has non-critical issue
    }

    // Idempotency: prevent duplicate order submission if orderId already exists
    if (payload.orderId) {
      try {
        const existingOrder = await getSupabaseOrderById(payload.orderId);
        if (existingOrder) {
          return NextResponse.json({
            ok: true,
            order: existingOrder,
            duplicate: true,
            message: 'Order already recorded',
          }, { status: 200 });
        }
      } catch { }
    }

    // Server-side price calculation and product validation
    const rawItems = Array.isArray(payload.items) ? payload.items : [];
    if (rawItems.length === 0) {
      return NextResponse.json({ ok: false, message: 'Cart items empty. Order cannot be placed.' }, { status: 400 });
    }

    let catalogProducts = [];
    try {
      catalogProducts = await getSupabaseProducts();
    } catch { }
    if (!catalogProducts || catalogProducts.length === 0) {
      catalogProducts = BASE_PRODUCTS || [];
    }

    const prodMap = new Map();
    (catalogProducts || []).forEach(p => {
      if (p.id !== undefined) prodMap.set(String(p.id), p);
      if (p.name) prodMap.set(String(p.name).trim().toLowerCase(), p);
    });

    const trustedItems = rawItems.map(item => {
      const p = prodMap.get(String(item.id)) || (item.name ? prodMap.get(String(item.name).trim().toLowerCase()) : null);
      const trustedPrice = p ? Number(p.price) : Math.max(0, Number(item.price || 0));
      const trustedMrp = p ? Number(p.mrp || p.price) : Math.max(trustedPrice, Number(item.mrp || trustedPrice));
      const qty = Math.max(1, Math.min(99, Number(item.qty || 1)));
      return {
        id: p?.id || item.id,
        name: p?.name || item.name || 'Stationery Item',
        price: trustedPrice,
        mrp: trustedMrp,
        qty,
        image: p?.image || item.image || '',
        category: p?.category || item.category || 'extra',
      };
    });

    // Server-side coupon verification
    let activeCoupons = SHOP.couponCodes;
    try {
      activeCoupons = await getActiveCoupons();
    } catch { }

    const verifiedTotals = calcTotals(trustedItems, payload.coupon, activeCoupons);

    let payment = { status: 'pending' };
    const razorpay = getRazorpayClient();
    if (razorpay && payload.payment !== 'cod') {
      payment = await razorpay.orders.create({
        amount: Math.round(Number(verifiedTotals.total || 0) * 100),
        currency: 'INR',
        receipt: payload.orderId,
      });
    }

    const createdAt = new Date().toISOString();
    const orderId = payload.orderId || `GGS-${Date.now().toString(36).toUpperCase()}`;
    const orderPayload = {
      ...payload,
      items: trustedItems,
      sub: verifiedTotals.sub,
      subtotal: verifiedTotals.sub,
      delivery: verifiedTotals.delivery,
      deliveryCharge: verifiedTotals.delivery,
      discount: verifiedTotals.discount,
      total: verifiedTotals.total,
      customerEmail: cleanEmail,
      customerPhone: cleanPhone || payload.address?.phone || '',
      orderId,
      id: orderId,
      createdAt,
      updatedAt: createdAt,
      status: 'placed',
      payment: payload.payment || 'cod',
      paymentStatus: payload.payment === 'cod' ? 'pending' : 'paid',
      tracking: [{ status: 'placed', time: createdAt, note: 'Order placed successfully & recorded at Gupta Store Bakani.' }],
      gateway: payment,
    };

    const savedOrder = await createSupabaseOrder(orderPayload);

    let confirmationEmailSent = false;
    const recipientEmail = savedOrder.customerEmail || savedOrder.address?.email || cleanEmail;
    if (recipientEmail) {
      try {
        await sendOrderStatusEmail({ ...savedOrder, customerEmail: recipientEmail }, 'placed');
        await updateSupabaseOrder(savedOrder.orderId, {
          'statusNotificationSent.placed': new Date().toISOString(),
        });
        confirmationEmailSent = true;
      } catch (error) {
        console.error('[Order Confirmation Email Error]:', error.message);
      }
    }

    return NextResponse.json({
      ok: true,
      order: savedOrder,
      payment,
      confirmationEmailSent,
      message: 'Order created',
    }, { status: 201 });
  } catch (error) {
    console.error('[Order Creation Error]:', error);
    return NextResponse.json({ ok: false, message: 'Order creation failed' }, { status: 500 });
  }
}

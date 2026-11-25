import { supabaseAdmin } from './supabaseAdmin.js';

export function mapSupabaseOrder(row) {
  if (!row) return null;
  const extra = row.order_data || {};

  return {
    ...extra,
    _id: row.legacy_mongo_id || row.id,
    id: row.order_id || extra.id || extra.orderId,
    orderId: row.order_id || extra.orderId || extra.id,
    status: row.status || extra.status || 'placed',
    payment: row.payment || extra.payment || 'cod',
    paymentStatus: row.payment_status || extra.paymentStatus || 'pending',
    total: Number(row.total ?? extra.total ?? 0),
    customerEmail: extra.customerEmail || '',
    address: extra.address || {},
    items: Array.isArray(extra.items) ? extra.items : [],
    tracking: Array.isArray(extra.tracking) ? extra.tracking : [],
    createdAt: row.created_at || extra.createdAt,
    updatedAt: row.updated_at || extra.updatedAt,
  };
}

// Fast in-memory cache for recent single order lookups (30s TTL)
const _orderCache = new Map();
const ORDER_CACHE_TTL_MS = 30000;

export async function getSupabaseOrders({ phone, email, orderIds, limit = 50 } = {}) {
  if (!supabaseAdmin) {
    console.error('[SupabaseOrders] supabaseAdmin not initialized');
    return [];
  }

  const cleanEmail = email ? String(email).trim().toLowerCase() : '';
  const cleanPhone = phone ? String(phone).replace(/\D/g, '').slice(-10) : '';

  let query = supabaseAdmin
    .from('orders')
    .select('*')
    .not('order_id', 'ilike', 'SYS_%')
    .not('order_id', 'ilike', 'CART_%')
    .not('status', 'eq', 'cart_cloud_sync')
    .order('created_at', { ascending: false })
    .limit(Math.min(100, Math.max(1, Number(limit) || 50)));

  if (Array.isArray(orderIds) && orderIds.length > 0) {
    const cleanIds = orderIds.map(id => String(id).trim()).filter(Boolean);
    if (cleanIds.length > 0) {
      query = query.in('order_id', cleanIds);
    }
  } else if (cleanEmail && cleanPhone) {
    query = query.or(`order_data->>customerEmail.eq.${cleanEmail},order_data->address->>phone.eq.${cleanPhone}`);
  } else if (cleanEmail) {
    query = query.filter('order_data->>customerEmail', 'eq', cleanEmail);
  } else if (cleanPhone) {
    query = query.filter('order_data->address->>phone', 'eq', cleanPhone);
  }

  try {
    // 8-second timeout guard to prevent hanging requests on network jitter
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Supabase orders query timed out after 8s')), 8000)
    );
    const { data, error } = await Promise.race([query, timeoutPromise]);

    if (error) {
      console.error('[SupabaseOrders] Query error:', error.message);
      return [];
    }

    const mapped = (data || []).map(mapSupabaseOrder);
    // Populate cache for each order
    mapped.forEach(o => {
      if (o && o.orderId) {
        _orderCache.set(String(o.orderId).trim(), { data: o, time: Date.now() });
      }
    });
    return mapped;
  } catch (err) {
    console.warn('[SupabaseOrders] getSupabaseOrders error or timeout:', err.message);
    return [];
  }
}

export async function getSupabaseOrderById(orderId) {
  if (!supabaseAdmin || !orderId) return null;

  const cleanId = String(orderId).trim();
  const cached = _orderCache.get(cleanId);
  if (cached && (Date.now() - cached.time < ORDER_CACHE_TTL_MS)) {
    return cached.data;
  }

  try {
    const timeoutPromise = new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Order lookup timed out')), 8000)
    );
    const query = supabaseAdmin
      .from('orders')
      .select('*')
      .or(`order_id.eq.${cleanId},legacy_mongo_id.eq.${cleanId}`)
      .maybeSingle();

    const { data, error } = await Promise.race([query, timeoutPromise]);

    if (error) {
      console.error('[SupabaseOrders] getSupabaseOrderById error:', error.message);
      return null;
    }

    const mapped = data ? mapSupabaseOrder(data) : null;
    if (mapped) {
      _orderCache.set(cleanId, { data: mapped, time: Date.now() });
    }
    return mapped;
  } catch (err) {
    console.warn('[SupabaseOrders] getSupabaseOrderById error or timeout:', err.message);
    return null;
  }
}

export async function createSupabaseOrder(order) {
  if (!supabaseAdmin) {
    throw new Error('Supabase admin client not initialized');
  }

  const now = new Date().toISOString();
  const orderId = order.orderId || order.id || `GGS-${Date.now()}`;
  const total = Number(order.total || 0);
  const status = order.status || 'placed';
  const payment = order.payment || 'cod';
  const paymentStatus = order.paymentStatus || (payment === 'cod' ? 'pending' : 'paid');

  const fullOrder = {
    ...order,
    orderId,
    id: orderId,
    status,
    payment,
    paymentStatus,
    total,
    createdAt: order.createdAt || now,
    updatedAt: now,
    tracking: Array.isArray(order.tracking) && order.tracking.length > 0
      ? order.tracking
      : [{ status: 'placed', time: now, note: 'Order placed successfully' }],
  };

  const { data, error } = await supabaseAdmin
    .from('orders')
    .insert({
      order_id: orderId,
      legacy_mongo_id: String(order._id || order.legacy_mongo_id || orderId),
      status,
      payment,
      payment_status: paymentStatus,
      total,
      order_data: fullOrder,
      created_at: fullOrder.createdAt,
      updated_at: fullOrder.updatedAt,
    })
    .select()
    .single();

  if (error) {
    console.error('[SupabaseOrders] Insert error:', error.message);
    throw error;
  }

  return mapSupabaseOrder(data);
}

export async function updateSupabaseOrder(orderId, updates) {
  if (!supabaseAdmin || !orderId) return null;

  const existing = await getSupabaseOrderById(orderId);
  if (!existing) return null;

  const now = new Date().toISOString();
  const merged = {
    ...existing,
    ...updates,
    updatedAt: now,
  };

  const status = updates.status || existing.status;
  const payment = updates.payment || existing.payment;
  const paymentStatus = updates.paymentStatus || existing.paymentStatus;
  const total = Number(updates.total ?? existing.total ?? 0);

  const { data, error } = await supabaseAdmin
    .from('orders')
    .update({
      status,
      payment,
      payment_status: paymentStatus,
      total,
      order_data: merged,
      updated_at: now,
    })
    .eq('order_id', orderId)
    .select()
    .maybeSingle();

  if (error) {
    console.error('[SupabaseOrders] Update error:', error.message);
    throw error;
  }

  return data ? mapSupabaseOrder(data) : merged;
}

export async function cancelSupabaseOrder(orderId, verifier) {
  const existing = await getSupabaseOrderById(orderId);
  if (!existing) {
    return { ok: false, status: 404, message: 'Order not found.' };
  }

  const verifyPhone = typeof verifier === 'string'
    ? verifier.replace(/\D/g, '').slice(-10)
    : String(verifier?.phone || '').replace(/\D/g, '').slice(-10);
  const verifyEmail = String(verifier?.email || '').trim().toLowerCase();

  const existingPhone = String(existing.address?.phone || '').replace(/\D/g, '').slice(-10);
  const existingEmail = String(existing.customerEmail || existing.address?.email || '').trim().toLowerCase();

  const phoneMatches = Boolean(verifyPhone && existingPhone && existingPhone === verifyPhone);
  const emailMatches = Boolean(verifyEmail && existingEmail && existingEmail === verifyEmail);

  if (!phoneMatches && !emailMatches) {
    return { ok: false, status: 403, message: 'You can only cancel your own order.' };
  }

  if (!['placed', 'confirmed'].includes(existing.status)) {
    return { ok: false, status: 409, message: 'This order can no longer be cancelled.' };
  }

  const now = new Date().toISOString();
  const updatedTracking = [
    ...(existing.tracking || []),
    { status: 'cancelled', time: now, note: 'Order cancelled by customer' },
  ];

  await updateSupabaseOrder(orderId, {
    status: 'cancelled',
    tracking: updatedTracking,
    cancellationReason: 'Cancelled by customer',
  });

  return { ok: true, message: 'Order cancelled successfully.' };
}

export async function deleteSupabaseOrder(orderId) {
  if (supabaseAdmin) {
    try {
      const { error } = await supabaseAdmin
        .from('orders')
        .delete()
        .eq('order_id', orderId);
      if (!error) return { ok: true };
    } catch (e) {
      console.warn('[deleteSupabaseOrder Error]:', e.message);
    }
  }
  return { ok: true };
}

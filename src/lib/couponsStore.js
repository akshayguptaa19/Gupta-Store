import { promises as fs } from 'node:fs';
import path from 'node:path';
import { SHOP } from './config';
import { supabaseAdmin } from './supabaseAdmin.js';

const globalForCoupons = globalThis;
if (!globalForCoupons.__guptaCoupons) {
  globalForCoupons.__guptaCoupons = {
    custom: {},
    disabled: [],
  };
}

const COUPONS_FILE = path.join(process.cwd(), 'src', 'data', 'coupons-store.json');
let _lastCouponsLoadedAt = 0;
const COUPONS_TTL_MS = 30000;

async function loadPersistedCoupons(force = false) {
  if (!force && Date.now() - _lastCouponsLoadedAt < COUPONS_TTL_MS) {
    return;
  }
  _lastCouponsLoadedAt = Date.now();
  // 1. Load from Supabase Database
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('order_data')
        .eq('order_id', 'SYS_COUPONS')
        .maybeSingle();

      if (!error && data?.order_data && typeof data.order_data === 'object') {
        globalForCoupons.__guptaCoupons = {
          custom: data.order_data.custom || {},
          disabled: Array.isArray(data.order_data.disabled) ? data.order_data.disabled : [],
        };
        return;
      }
    } catch (e) {
      console.warn('[CouponsStore] Supabase load warning:', e.message);
    }
  }

  // 2. Fallback to local file
  try {
    const raw = await fs.readFile(COUPONS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === 'object') {
      globalForCoupons.__guptaCoupons = {
        custom: parsed.custom || {},
        disabled: Array.isArray(parsed.disabled) ? parsed.disabled : [],
      };
    }
  } catch {}
}

async function persistCoupons() {
  // 1. Save to Supabase Database
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('orders').upsert({
        order_id: 'SYS_COUPONS',
        legacy_mongo_id: 'SYS_COUPONS',
        status: 'system',
        payment: 'system',
        payment_status: 'system',
        total: 0,
        order_data: {
          custom: globalForCoupons.__guptaCoupons.custom || {},
          disabled: globalForCoupons.__guptaCoupons.disabled || [],
          updatedAt: new Date().toISOString(),
        },
      }, { onConflict: 'order_id' });
    } catch (e) {
      console.warn('[CouponsStore] Supabase persist warning:', e.message);
    }
  }

  // 2. Also save to local file for offline fallback
  try {
    const dir = path.dirname(COUPONS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(COUPONS_FILE, JSON.stringify(globalForCoupons.__guptaCoupons, null, 2), 'utf8');
  } catch {}
}

loadPersistedCoupons();

export async function getActiveCoupons() {
  await loadPersistedCoupons();
  const coupons = { ...SHOP.couponCodes, ...(globalForCoupons.__guptaCoupons.custom || {}) };
  (globalForCoupons.__guptaCoupons.disabled || []).forEach(code => {
    delete coupons[code];
  });
  return coupons;
}

export async function setCoupon(code, { discount, minOrder }) {
  globalForCoupons.__guptaCoupons.custom[code] = { discount, minOrder };
  globalForCoupons.__guptaCoupons.disabled = globalForCoupons.__guptaCoupons.disabled.filter(c => c !== code);
  await persistCoupons();
  return globalForCoupons.__guptaCoupons.custom[code];
}

export async function toggleCoupon(code, active) {
  if (active) {
    globalForCoupons.__guptaCoupons.disabled = globalForCoupons.__guptaCoupons.disabled.filter(c => c !== code);
  } else {
    if (!globalForCoupons.__guptaCoupons.disabled.includes(code)) {
      globalForCoupons.__guptaCoupons.disabled.push(code);
    }
  }
  await persistCoupons();
}

export async function deleteCoupon(code) {
  delete globalForCoupons.__guptaCoupons.custom[code];
  if (!globalForCoupons.__guptaCoupons.disabled.includes(code)) {
    globalForCoupons.__guptaCoupons.disabled.push(code);
  }
  await persistCoupons();
}

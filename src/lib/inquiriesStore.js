import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from './supabaseAdmin.js';

const globalForInquiries = globalThis;
if (!globalForInquiries.__guptaInquiries) {
  globalForInquiries.__guptaInquiries = [];
}

const INQUIRIES_FILE = path.join(process.cwd(), 'src', 'data', 'inquiries-store.json');
let _lastInquiriesLoadedAt = 0;
const INQUIRIES_TTL_MS = 30000;

async function loadPersistedInquiries(force = false) {
  if (!force && Date.now() - _lastInquiriesLoadedAt < INQUIRIES_TTL_MS) {
    return;
  }
  _lastInquiriesLoadedAt = Date.now();
  // 1. Load from Supabase Database
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('order_data')
        .eq('order_id', 'SYS_INQUIRIES')
        .maybeSingle();

      if (!error && Array.isArray(data?.order_data?.inquiries)) {
        globalForInquiries.__guptaInquiries = data.order_data.inquiries;
        return;
      }
    } catch (e) {
      console.warn('[InquiriesStore] Supabase load warning:', e.message);
    }
  }

  // 2. Fallback to local file
  try {
    const raw = await fs.readFile(INQUIRIES_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      globalForInquiries.__guptaInquiries = parsed;
    }
  } catch {}
}

async function persistInquiries() {
  // 1. Save to Supabase Database
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('orders').upsert({
        order_id: 'SYS_INQUIRIES',
        legacy_mongo_id: 'SYS_INQUIRIES',
        status: 'system',
        payment: 'system',
        payment_status: 'system',
        total: 0,
        order_data: {
          inquiries: globalForInquiries.__guptaInquiries || [],
          updatedAt: new Date().toISOString(),
        },
      }, { onConflict: 'order_id' });
    } catch (e) {
      console.warn('[InquiriesStore] Supabase persist warning:', e.message);
    }
  }

  // 2. Also save to local file for fallback
  try {
    const dir = path.dirname(INQUIRIES_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(INQUIRIES_FILE, JSON.stringify(globalForInquiries.__guptaInquiries, null, 2), 'utf8');
  } catch {}
}

loadPersistedInquiries();

export async function addInquiry(inquiry) {
  await loadPersistedInquiries();
  const id = `INQ-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
  const record = {
    ...inquiry,
    id,
    _id: id,
    status: inquiry.status || 'unread',
    createdAt: inquiry.createdAt || new Date().toISOString(),
  };

  globalForInquiries.__guptaInquiries.unshift(record);
  await persistInquiries();
  return record;
}

export async function getAllInquiries() {
  await loadPersistedInquiries();
  return [...globalForInquiries.__guptaInquiries];
}

export async function updateInquiryStatus(id, status) {
  await loadPersistedInquiries();
  const item = globalForInquiries.__guptaInquiries.find(i => i.id === id || i._id === id);
  if (!item) return null;

  item.status = status;
  item.updatedAt = new Date().toISOString();
  await persistInquiries();
  return item;
}

export async function deleteInquiry(id) {
  await loadPersistedInquiries();
  const index = globalForInquiries.__guptaInquiries.findIndex(i => i.id === id || i._id === id);
  if (index === -1) return false;

  const deleted = globalForInquiries.__guptaInquiries.splice(index, 1);
  await persistInquiries();
  return deleted[0] || true;
}

export async function replyToInquiry(id, replyText) {
  await loadPersistedInquiries();
  const item = globalForInquiries.__guptaInquiries.find(i => i.id === id || i._id === id);
  if (!item) return null;

  item.reply = replyText;
  item.repliedAt = new Date().toISOString();
  item.status = 'replied';
  item.updatedAt = new Date().toISOString();
  await persistInquiries();
  return item;
}

export async function getCustomerInquiries(phone, email) {
  await loadPersistedInquiries();
  const cleanPhone = String(phone || '').replace(/\D/g, '').slice(-10);
  const cleanEmail = String(email || '').trim().toLowerCase();

  return (globalForInquiries.__guptaInquiries || []).filter(item => {
    const itemPhone = String(item.phone || '').replace(/\D/g, '').slice(-10);
    const itemEmail = String(item.email || '').trim().toLowerCase();
    if (cleanPhone && itemPhone && itemPhone === cleanPhone) return true;
    if (cleanEmail && itemEmail && itemEmail === cleanEmail) return true;
    return false;
  });
}

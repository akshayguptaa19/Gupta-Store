import { promises as fs } from 'node:fs';
import path from 'node:path';
import { supabaseAdmin } from './supabaseAdmin.js';

const globalForReviews = globalThis;
if (!globalForReviews.__guptaReviews) {
  globalForReviews.__guptaReviews = [
    {
      id: 'rev_1',
      productId: '1',
      productName: 'Cello Blue Ball Pen',
      customerName: 'Akshay Gupta',
      rating: 5,
      comment: 'Writing bahut smooth hai aur ink jaldi failti nahi hai. Bakani me same-day deliver ho gaya!',
      date: '28 Oct 2026',
      createdAt: '2026-10-28T10:00:00.000Z',
      verifiedBuyer: true,
      orderId: 'GGS-MUH6IV5R',
    },
    {
      id: 'rev_2',
      productId: '2',
      productName: 'Reynolds Black Gel Pen',
      customerName: 'Sunil Sharma',
      rating: 5,
      comment: 'Exam ke liye best pen hai. Grip bahut comfortable hai.',
      date: '25 Sept 2026',
      createdAt: '2026-09-25T14:30:00.000Z',
      verifiedBuyer: true,
      orderId: 'GGS-MUH1YS3M',
    },
    {
      id: 'rev_3',
      productId: '15',
      productName: 'Drawing Pencil Set 12 Grades',
      customerName: 'Priya Meena',
      rating: 5,
      comment: 'Sketching aur shading ke liye best shades hain. Authentic Camlin quality!',
      date: '20 Sept 2026',
      createdAt: '2026-09-20T16:15:00.000Z',
      verifiedBuyer: true,
    },
    {
      id: 'rev_4',
      productId: '18',
      productName: 'Classmate Notebook Long Size',
      customerName: 'Deepak Patidar',
      rating: 4,
      comment: 'Paper quality solid hai, pen ki ink peeche chhap nahi chhodti.',
      date: '15 Sept 2026',
      createdAt: '2026-09-15T11:45:00.000Z',
      verifiedBuyer: true,
    },
  ];
}

const REVIEWS_FILE = path.join(process.cwd(), 'src', 'data', 'reviews-store.json');
let _lastReviewsLoadedAt = 0;
const REVIEWS_TTL_MS = 30000;

async function loadPersistedReviews(force = false) {
  if (!force && Date.now() - _lastReviewsLoadedAt < REVIEWS_TTL_MS && globalForReviews.__guptaReviews?.length > 0) {
    return;
  }
  _lastReviewsLoadedAt = Date.now();
  // 1. Load from Supabase Database
  if (supabaseAdmin) {
    try {
      const { data, error } = await supabaseAdmin
        .from('orders')
        .select('order_data')
        .eq('order_id', 'SYS_REVIEWS')
        .maybeSingle();

      if (!error && Array.isArray(data?.order_data?.reviews) && data.order_data.reviews.length > 0) {
        globalForReviews.__guptaReviews = data.order_data.reviews;
        return;
      }
    } catch (e) {
      console.warn('[ReviewsStore] Supabase load warning:', e.message);
    }
  }

  // 2. Fallback to local file
  try {
    const raw = await fs.readFile(REVIEWS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed) && parsed.length > 0) {
      globalForReviews.__guptaReviews = parsed;
    }
  } catch {}
}

async function persistReviews() {
  // 1. Save to Supabase Database
  if (supabaseAdmin) {
    try {
      await supabaseAdmin.from('orders').upsert({
        order_id: 'SYS_REVIEWS',
        legacy_mongo_id: 'SYS_REVIEWS',
        status: 'system',
        payment: 'system',
        payment_status: 'system',
        total: 0,
        order_data: {
          reviews: globalForReviews.__guptaReviews || [],
          updatedAt: new Date().toISOString(),
        },
      }, { onConflict: 'order_id' });
    } catch (e) {
      console.warn('[ReviewsStore] Supabase persist warning:', e.message);
    }
  }

  // 2. Also save to local file for fallback
  try {
    const dir = path.dirname(REVIEWS_FILE);
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(REVIEWS_FILE, JSON.stringify(globalForReviews.__guptaReviews, null, 2), 'utf8');
  } catch {}
}

// Initial load
loadPersistedReviews();

export async function getAllReviews() {
  await loadPersistedReviews();
  return globalForReviews.__guptaReviews || [];
}

export async function getProductReviews(productId, productName = '') {
  await loadPersistedReviews();
  const all = globalForReviews.__guptaReviews || [];
  const cleanId = String(productId || '').trim();
  const cleanName = String(productName || '').trim().toLowerCase();

  return all.filter(r => {
    if (cleanId && String(r.productId) === cleanId) return true;
    if (cleanName && r.productName && r.productName.trim().toLowerCase() === cleanName) return true;
    return false;
  });
}

export async function addCustomerReview({ productId, productName, rating, comment, customerName, orderId, customerEmail, customerPhone, location }) {
  await loadPersistedReviews();

  const numRating = Math.max(1, Math.min(5, Number(rating) || 5));
  const newRev = {
    id: `rev_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    productId: String(productId || ''),
    productName: String(productName || 'Stationery Item').trim(),
    customerName: String(customerName || 'Customer').trim(),
    rating: numRating,
    comment: String(comment || '').trim(),
    date: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }),
    createdAt: new Date().toISOString(),
    verifiedBuyer: Boolean(orderId),
    orderId: orderId ? String(orderId).trim() : undefined,
    customerEmail: customerEmail ? String(customerEmail).trim().toLowerCase() : undefined,
    customerPhone: customerPhone ? String(customerPhone).trim() : undefined,
    location: location || 'Bakani',
  };

  // Add to beginning
  _lastReviewsLoadedAt = Date.now();
  globalForReviews.__guptaReviews = [newRev, ...(globalForReviews.__guptaReviews || [])];
  await persistReviews();

  return newRev;
}

export async function deleteReview(reviewId) {
  await loadPersistedReviews();
  const idStr = String(reviewId || '').trim();
  if (!idStr) return false;
  const initialCount = (globalForReviews.__guptaReviews || []).length;
  globalForReviews.__guptaReviews = (globalForReviews.__guptaReviews || []).filter(r => String(r.id) !== idStr);
  _lastReviewsLoadedAt = Date.now();
  await persistReviews();
  return (globalForReviews.__guptaReviews || []).length < initialCount;
}


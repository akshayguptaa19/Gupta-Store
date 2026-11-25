import { SHOP } from './config.js';

// ── CURRENCY ─────────────────────────────────────────────────
export function formatCurrency(n) {
  return '₹' + Number(n).toFixed(0);
}

export function simpleHash(value) {
  const text = String(value ?? '');
  let hash = 0;
  for (let i = 0; i < text.length; i += 1) {
    hash = (hash << 5) - hash + text.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(16);
}

export function normalizePhone(value) {
  return String(value || '').replace(/\D/g, '').slice(-10);
}

export function isValidPhone(value) {
  return /^\d{10}$/.test(normalizePhone(value));
}

export function formatPhone(value) {
  const phone = normalizePhone(value);
  if (!phone) return '';
  return `+91 ${phone.slice(0, 5)} ${phone.slice(5)}`;
}

export function generateOtp(length = 6) {
  return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}

// ── DATE ─────────────────────────────────────────────────────
export function formatDate(d) {
  if (!d || d === 'Invalid Date' || d === 'null' || d === 'undefined') return 'Recently';
  try {
    const parsed = new Date(d);
    if (isNaN(parsed.getTime())) return 'Recently';
    return parsed.toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch {
    return 'Recently';
  }
}

// ── ORDER ID ─────────────────────────────────────────────────
export function generateOrderId() {
  return 'GGS-' + Date.now().toString(36).toUpperCase().slice(-8);
}

export function startDirectCheckout(product, qty = 1, router = null) {
  if (typeof window === 'undefined') return;
  const rawStock = Number(product?.stock);
  const maxStock = !isNaN(rawStock) && rawStock > 0 ? rawStock : 99;
  const initialQty = Math.max(1, Math.min(Number(qty) || 1, maxStock));
  sessionStorage.setItem('ggsDirectCheckout', JSON.stringify({
    ...product,
    qty: initialQty,
  }));

  let hasActiveLogin = false;
  try {
    const isSessionActive = sessionStorage.getItem('ggsSessionActive') === '1';
    const user = JSON.parse(localStorage.getItem('ggsUser') || 'null');
    hasActiveLogin = isSessionActive && Boolean(user?.sessionToken && (user?.id || user?.phone || user?.email));
  } catch {
    hasActiveLogin = false;
  }

  const target = hasActiveLogin ? '/cart?direct=1' : '/auth';
  if (!hasActiveLogin) {
    localStorage.setItem('ggsLoginRedirect', '/cart?direct=1');
  }

  if (router?.push) {
    router.push(target);
  } else {
    window.location.assign(target);
  }
}

export function getDeliveryEstimate(now = new Date()) {
  const date = new Date(now);
  const isBeforeCutoff = date.getHours() < 16;
  if (!isBeforeCutoff) date.setDate(date.getDate() + 1);

  return {
    isoDate: date.toISOString(),
    dateLabel: date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' }),
    weekday: date.toLocaleDateString('en-IN', { weekday: 'long' }),
    speedLabel: isBeforeCutoff ? 'Same-day delivery' : 'Next-day delivery',
    promise: isBeforeCutoff ? 'Aaj 9 PM tak' : 'Kal 9 PM tak',
  };
}

export function getCouponOffer(couponCode, couponCodes = SHOP.couponCodes) {
  if (!couponCode) return { discount: 0, minOrder: 0 };
  const safeCodes = (couponCodes && typeof couponCodes === 'object') ? couponCodes : (SHOP.couponCodes || {});
  const raw = safeCodes[String(couponCode).trim().toUpperCase()];
  if (raw && typeof raw === 'object') return { discount: Number(raw.discount) || 0, minOrder: Number(raw.minOrder) || 0 };
  return { discount: Number(raw) || 0, minOrder: 0 };
}

// ── CART TOTALS ───────────────────────────────────────────────
export function calcTotals(items, couponCode, couponCodes = SHOP.couponCodes) {
  const safeItems = Array.isArray(items) ? items : [];
  const safeCodes = (couponCodes && typeof couponCodes === 'object') ? couponCodes : (SHOP.couponCodes || {});
  const sub = safeItems.reduce((a, i) => {
    if (!i) return a;
    const p = Math.max(0, Number(i.price) || 0);
    const q = Math.max(1, Number(i.qty) || 1);
    return a + (p * q);
  }, 0);
  const delivery = sub < (SHOP.freeDeliveryAbove || 100) && sub > 0 ? (SHOP.deliveryCharge || 30) : 0;
  const offer = getCouponOffer(couponCode, safeCodes);
  const discountPct = sub >= offer.minOrder ? offer.discount : 0;
  const discount = Math.min(sub, discountPct);
  const total = Math.max(0, sub + delivery - discount);
  return { sub, delivery, discount, discountPct, total };
}

// ── STAR DISPLAY ─────────────────────────────────────────────
export function renderStars(rating) {
  const full = Math.floor(rating);
  const half = rating % 1 >= 0.5;
  return '★'.repeat(full) + (half ? '½' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
}

// ── DISCOUNT % ───────────────────────────────────────────────
export function discountPct(price, mrp) {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ── SEARCH SCORING ───────────────────────────────────────────
import { SYNONYMS } from './products.js';

export function expandQuery(q) {
  const raw = q.toLowerCase().trim().split(/\s+/);
  const all = new Set(raw);
  raw.forEach(w => {
    if (SYNONYMS[w]) all.add(SYNONYMS[w]);
    if (w.endsWith('s') && w.length > 3) all.add(w.slice(0, -1));
    if (w.endsWith('es') && w.length > 4) all.add(w.slice(0, -2));
    all.add(w + 's');
  });
  return [...all];
}

export function scoreProduct(p, q) {
  const query = q.toLowerCase().trim();
  if (!query) return 0;
  const terms = expandQuery(query);
  let score = 0;
  const nameL = p.name.toLowerCase();
  const tagsL = (p.tags || []).join(' ').toLowerCase();
  const catL  = p.category.toLowerCase();
  const descL = (p.desc || '').toLowerCase();
  const nameWords = nameL.split(/\s+/);

  if (nameL === query)         score += 120;
  if (nameL.startsWith(query)) score += 70;
  if (nameL.includes(query))   score += 50;
  if (tagsL.includes(query))   score += 35;
  if (catL.includes(query))    score += 25;

  terms.forEach(term => {
    if (!term || term.length < 2) return;
    const prefixMatch = nameWords.some(nw => nw.startsWith(term) || term.startsWith(nw));
    if (nameL.includes(term))        score += 20;
    else if (prefixMatch)            score += 15;
    if (tagsL.includes(term))        score += 12;
    if (catL.includes(term))         score += 10;
    if (descL.includes(term))        score += 4;
  });

  if (score > 0) {
    score += p.rating * 2;
    score += Math.min((p.reviews || 0) / 500, 5);
  }
  return score;
}

export function highlightText(text, query) {
  if (!query) return text;
  const words = query.trim().split(/\s+/).filter(Boolean);
  let result = text;
  words.forEach(w => {
    const re = new RegExp(`(${w.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    result = result.replace(re, '<mark>$1</mark>');
  });
  return result;
}

// ── WHATSAPP MESSAGE ─────────────────────────────────────────
export function buildWhatsAppMessage(order) {
  const lines = order.items.map(i => `• ${i.name} x${i.qty} = ${formatCurrency(i.price * i.qty)}`);
  return encodeURIComponent(
    `🛒 *New Order — ${order.orderId}*\n\n` +
    lines.join('\n') +
    `\n\n*Subtotal:* ${formatCurrency(order.sub)}` +
    `\n*Delivery:* ${formatCurrency(order.delivery)}` +
    (order.discount > 0 ? `\n*Discount:* -${formatCurrency(order.discount)}` : '') +
    `\n*TOTAL: ${formatCurrency(order.total)}*` +
    `\n\n*Payment:* ${order.payment}` +
    `\n*Address:* ${order.address?.name}, ${order.address?.area}, ${order.address?.phone}`
  );
}

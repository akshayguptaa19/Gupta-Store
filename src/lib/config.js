// ── SHOP CONFIG ──────────────────────────────────────────────
export const SHOP = {
  name: 'Gupta General Store',
  tagline: "Bakani ka #1 Stationery Store",
  phone: '918107615285',
  whatsapp: '918107615285',
  upiId: '8107615285@paytm',
  upiName: 'Gupta General Store',
  address: 'Main Market, Bakani, Rajasthan',
  deliveryCharge: 20,
  freeDeliveryAbove: 100,
  sessionTtlMs: 1000 * 60 * 60 * 12,
  couponCodes: {
    SAVE10: 10,
    SAVE20: 20,
    WELCOME: 15,
    GUPTA5: 5,
    NEWUSER: 30,
  },
  tickerMessages: [
    '🚚 ₹100+ pe FREE delivery | Bakani area usi din!',
    '📱 UPI – PhonePe, GPay, Paytm accepted',
    '💵 Cash on Delivery (COD) available',
    '⭐ Authentic Stationery & School Supplies at Best Prices',
    '✅ 1990 se Bakani ki seva mein | 5000+ happy customers',
    '🔒 Safe & Trusted Shopping | Quality Guaranteed',
  ],
};

export const CATEGORIES = [
  { key: 'all',      label: 'All',           emoji: '🛒' },
  { key: 'pen',      label: 'Pens',          emoji: '🖊️' },
  { key: 'pencil',   label: 'Pencils',       emoji: '✏️' },
  { key: 'notebook', label: 'Notebooks',     emoji: '📓' },
  { key: 'file',     label: 'Files',         emoji: '📁' },
  { key: 'marker',   label: 'Markers',       emoji: '🖌️' },
  { key: 'colors',   label: 'Colors',        emoji: '🎨' },
  { key: 'tape',     label: 'Tapes',         emoji: '📦' },
  { key: 'paper',    label: 'Paper',         emoji: '📄' },
  { key: 'glue',     label: 'Glue',          emoji: '🔧' },
  { key: 'scissors', label: 'Scissors',      emoji: '✂️' },
  { key: 'bag',      label: 'Bags',          emoji: '🎒' },
  { key: 'box',      label: 'Boxes',         emoji: '🗃️' },
  { key: 'sticky',   label: 'Sticky Notes',  emoji: '📌' },
  { key: 'extra',    label: 'Extras',        emoji: '🧮' },
];

export const ORDER_STATUSES = [
  { key: 'placed',          label: 'Order Placed',      color: '#3b82f6', icon: '📋' },
  { key: 'confirmed',       label: 'Confirmed',         color: '#8b5cf6', icon: '✅' },
  { key: 'packed',           label: 'Packed',             color: '#f59e0b', icon: '📦' },
  { key: 'shipped',          label: 'Shipped',            color: '#f97316', icon: '🚚' },
  { key: 'out_for_delivery',label: 'Out for Delivery',  color: '#f97316', icon: '🚴' },
  { key: 'delivered',       label: 'Delivered',         color: '#22c55e', icon: '🏠' },
  { key: 'cancelled',       label: 'Cancelled',         color: '#ef4444', icon: '❌' },
];

export const PAYMENT_METHODS = [
  { id: 'cod', label: 'Cash on Delivery', icon: '💵' },
  { id: 'upi', label: 'UPI', icon: '📱' },
  { id: 'card', label: 'Debit/Credit Card', icon: '💳' },
  { id: 'netbanking', label: 'Net Banking', icon: '🏦' },
];

export const OTP_LENGTH = 6;

const fs = require('fs');
const content = fs.readFileSync('src/app/globals.css', 'utf8');
const lines = content.split('\n');

console.log(`Total lines: ${lines.length}`);

// Find key markers
const markers = [
  '/* ── CSS VARIABLES',
  '/* ── DARK MODE',
  '/* ── RESET & PERFORMANCE',
  '/* ── SCROLLBAR',
  '/* ── SELECTION',
  '/* ── TICKER BAR',
  '/* ── NAVBAR',
  '/* ── HERO',
  '/* ── CATEGORIES',
  '/* ── SHOP LAYOUT',
  '/* ── FILTER PANEL',
  '/* ── PRODUCTS AREA',
  '/* ── PRODUCTS GRID',
  '/* ── PRODUCT CARD',
  '/* ── PRODUCT MODAL',
  '/* ── TOAST',
  '/* ── CART FAB',
  '/* ── SCROLL TOP',
  '/* ── FEATURES STRIP',
  '/* ── FOOTER MASTER',
  '/* ── SEARCH DROPDOWN',
  '/* ── SKELETON',
  '/* ── SECTION HEADER',
  '/* ── WISHLIST',
  '/* ── NO RESULTS',
  '/* ── MOBILE HAMBURGER',
  '/* ── MOBILE NAV DRAWER',
  '/* ── MOBILE FILTER DRAWER',
  '/* ── MOB FILTER BTN',
  '/* ── MOBILE SEARCH BAR',
  '/* ── RESPONSIVE',
  '/* ── ADMIN STYLES',
  '/* ── ORDER TRACKING TIMELINE',
  '/* ── MODERN CART & CHECKOUT PAGE',
  '/* ── PROFILE PAGE',
  '/* ── REVIEWS',
  '/* ── CHATBOT',
  '/* ── TABLET & LANDSCAPE',
  '/* ── TABLET (600px',
  '/* ── MOBILE (480px',
  '/* ── SMALL MOBILE',
  '/* ── PRO ADMIN REFINEMENTS',
  '/* ── Cart Item Clickable',
  '/* ── Professional Order Tracking',
  '/* ── Order Card Professional Action',
  'DEDICATED ORDERS PAGE'
];

markers.forEach(m => {
  const idx = lines.findIndex(l => l.includes(m));
  if (idx !== -1) {
    console.log(`${idx + 1}: ${m}`);
  }
});

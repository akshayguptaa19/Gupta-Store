import { generateOrderId, simpleHash } from './utils.js';

// ── ORDERS (localStorage + Firebase-ready) ────────────────────

import { getDb } from './firebase.js';
import { collection, getDocs, addDoc, doc, getDoc, updateDoc, deleteDoc, query, where, arrayUnion } from 'firebase/firestore';

export async function getAllOrders() {
  const db = getDb();
  if (!db) return [];
  const snapshot = await getDocs(collection(db, 'orders'));
  const orders = snapshot.docs.map(d => d.data());
  return orders;
}

export function verifyOrderIntegrity(order) {
  if (!order) return false;
  const { checksum, ...rest } = order;
  const expected = simpleHash(JSON.stringify({ ...rest, checksum: undefined }));
  return checksum === expected;
}

export async function saveOrder(order) {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const createdAt = new Date().toISOString();
  const newOrder = {
    ...order,
    orderId: order.orderId || generateOrderId(),
    createdAt,
    status: 'placed',
    paymentStatus: order.payment === 'cod' ? 'pending' : 'paid',
    tracking: [{ status: 'placed', time: createdAt, note: 'Order placed successfully' }],
  };
  newOrder.checksum = simpleHash(JSON.stringify(newOrder));
  await addDoc(collection(db, 'orders'), newOrder);
  return newOrder;
}

export async function updateOrderStatus(orderId, status, adminNote = '') {
  const db = getDb();
  if (!db) throw new Error('Firebase not configured');
  const snapshot = await getDocs(query(collection(db, 'orders'), where('orderId', '==', orderId)));
  if (!snapshot.empty) {
    const docRef = snapshot.docs[0].ref;
    const updateData = {
      status,
      updatedAt: new Date().toISOString(),
      tracking: arrayUnion({
        status,
        time: new Date().toISOString(),
        note: adminNote || `Status updated to ${status}`
      })
    };
    if (adminNote) updateData.adminNote = adminNote;
    await updateDoc(docRef, updateData);
    const updatedSnap = await getDoc(docRef);
    return updatedSnap.data();
  }
  return null;
}

export async function deleteOrder(orderId) {
  const db = getDb();
  if (!db) return;
  const snapshot = await getDocs(query(collection(db, 'orders'), where('orderId', '==', orderId)));
  if (!snapshot.empty) {
    await deleteDoc(snapshot.docs[0].ref);
  }
}

export async function getOrderById(orderId) {
  const db = getDb();
  if (!db) return null;
  const snapshot = await getDocs(query(collection(db, 'orders'), where('orderId', '==', orderId)));
  if (!snapshot.empty) return snapshot.docs[0].data();
  return null;
}

export async function getUserOrders(phone) {
  const db = getDb();
  if (!db) return [];
  const q = query(collection(db, 'orders'), where('address.phone', '==', phone));
  const snapshot = await getDocs(q);
  return snapshot.docs.map(d => d.data());
}

// ── STOCK ────────────────────────────────────────────────────

export function getStockData() {
  if (typeof window === 'undefined') return {};
  try { return JSON.parse(localStorage.getItem('ggsStock') || '{}'); } catch { return {}; }
}

export function setProductStock(id, qty) {
  const s = getStockData();
  s[id] = qty;
  localStorage.setItem('ggsStock', JSON.stringify(s));
}

export function deductStock(items) {
  const s = getStockData();
  items.forEach(i => {
    if (s[i.id] !== undefined && s[i.id] > 0) {
      s[i.id] = Math.max(0, s[i.id] - i.qty);
    }
  });
  localStorage.setItem('ggsStock', JSON.stringify(s));
}

// ── ANALYTICS ────────────────────────────────────────────────

export function getAnalytics() {
  const orders = getAllOrders();
  return getAnalyticsForOrders(orders);
}

export function getAnalyticsForOrders(orders = []) {
  const today = new Date();

  const totalRevenue = orders.filter(o => o.status !== 'cancelled').reduce((a, o) => a + (o.total || 0), 0);
  const totalOrders  = orders.length;
  const pendingOrders = orders.filter(o => !['delivered','cancelled'].includes(o.status)).length;
  const deliveredOrders = orders.filter(o => o.status === 'delivered').length;

  // Last 7 days revenue
  const last7 = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(today);
    d.setDate(d.getDate() - (6 - i));
    const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
    const dayOrders = orders.filter(o => {
      const od = new Date(o.createdAt);
      return od.toDateString() === d.toDateString() && o.status !== 'cancelled';
    });
    return { label, revenue: dayOrders.reduce((a, o) => a + (o.total || 0), 0), count: dayOrders.length };
  });

  // Category sales
  const catSales = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    (o.items || []).forEach(item => {
      const cat = item.category || 'other';
      catSales[cat] = (catSales[cat] || 0) + item.price * item.qty;
    });
  });

  // Top products
  const prodSales = {};
  orders.filter(o => o.status !== 'cancelled').forEach(o => {
    (o.items || []).forEach(item => {
      if (!prodSales[item.id]) prodSales[item.id] = { name: item.name, qty: 0, revenue: 0 };
      prodSales[item.id].qty += item.qty;
      prodSales[item.id].revenue += item.price * item.qty;
    });
  });
  const topProducts = Object.values(prodSales).sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  const uniqueCustomers = new Set(orders.map(o => o.address?.phone).filter(Boolean)).size;

  return { totalRevenue, totalOrders, pendingOrders, deliveredOrders, last7, catSales, topProducts, uniqueCustomers };
}

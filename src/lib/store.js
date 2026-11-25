'use client';
import { create } from 'zustand';

// ── ZUSTAND STORE ─────────────────────────────────────────────

function loadLS(key, fallback) {
  return fallback;
}
function readLS(key, fallback) {
  if (typeof window === 'undefined') return fallback;
  try { return JSON.parse(localStorage.getItem(key) || 'null') ?? fallback; } catch { return fallback; }
}
function saveLS(key, val) {
  if (typeof window !== 'undefined') localStorage.setItem(key, JSON.stringify(val));
}

export function getActiveUserId() {
  if (typeof window === 'undefined') return '';
  const user = readLS('ggsUser', null);
  return user?.id || user?.phone || user?.email || '';
}

// ── MULTI-DEVICE CLOUD CART SYNCHRONIZATION ──────────────────
export async function syncCartToCloud(items) {
  if (typeof window === 'undefined') return;
  const userId = getActiveUserId();
  if (!userId) return;
  try {
    await fetch('/api/cart', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, items: items || [] }),
    });
  } catch {}
}

export async function fetchAndMergeCloudCart(userId) {
  if (typeof window === 'undefined' || !userId) return;
  try {
    const res = await fetch(`/api/cart?userId=${encodeURIComponent(userId)}`, { cache: 'no-store' });
    const data = await res.json();
    if (data.ok && Array.isArray(data.items)) {
      const currentItems = useCartStore.getState().items || [];
      const mergedMap = new Map();
      // Add cloud items first
      data.items.forEach(it => {
        if (it?.id) mergedMap.set(String(it.id), { ...it });
      });
      // Merge local items
      currentItems.forEach(it => {
        if (it?.id) {
          const key = String(it.id);
          if (mergedMap.has(key)) {
            const existing = mergedMap.get(key);
            mergedMap.set(key, { ...existing, ...it, qty: Math.max(existing.qty || 1, it.qty || 1) });
          } else {
            mergedMap.set(key, { ...it });
          }
        }
      });
      const merged = Array.from(mergedMap.values());
      useCartStore.setState({ items: merged });
      saveLS('cartData', merged);
      syncCartToCloud(merged);
    }
  } catch {}
}

function getWishlistVisitorId() {
  if (typeof window === 'undefined') return '';
  const existing = localStorage.getItem('ggsWishlistVisitorId');
  if (existing) return existing;
  const next = `visitor_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  localStorage.setItem('ggsWishlistVisitorId', next);
  return next;
}

function syncWishlistEvent(productId, wished) {
  if (typeof window === 'undefined') return;
  const user = readLS('ggsUser', null);
  const visitorId = user?.id || user?.email || user?.phone || getWishlistVisitorId();
  fetch('/api/wishlist', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId, wished, visitorId }),
  }).catch(() => {});
}

// ── CART STORE ───────────────────────────────────────────────
export const useCartStore = create((set, get) => ({
  items: loadLS('cartData', []),

  addItem(product, qty = 1) {
    const items = get().items;
    const existing = items.find(i => i.id === product.id);
    let next;
    if (existing) {
      next = items.map(i => i.id === product.id ? { ...i, qty: i.qty + qty } : i);
    } else {
      next = [...items, { ...product, qty }];
    }
    set({ items: next });
    saveLS('cartData', next);
    syncCartToCloud(next);
  },

  removeItem(id) {
    const next = get().items.filter(i => i.id !== id);
    set({ items: next });
    saveLS('cartData', next);
    syncCartToCloud(next);
  },

  updateQty(id, qty) {
    if (qty < 1) { get().removeItem(id); return; }
    const next = get().items.map(i => i.id === id ? { ...i, qty } : i);
    set({ items: next });
    saveLS('cartData', next);
    syncCartToCloud(next);
  },

  clearCart() {
    set({ items: [] });
    saveLS('cartData', []);
    syncCartToCloud([]);
  },

  get count() { return get().items.reduce((a, i) => a + i.qty, 0); },
  get total() { return get().items.reduce((a, i) => a + i.price * i.qty, 0); },
}));

// ── WISHLIST STORE ───────────────────────────────────────────
export const useWishlistStore = create((set, get) => ({
  ids: loadLS('ggsWishlist', []),

  toggle(product) {
    const ids = get().ids;
    const next = ids.includes(product.id)
      ? ids.filter(id => id !== product.id)
      : [...ids, product.id];
    set({ ids: next });
    saveLS('ggsWishlist', next);
    syncWishlistEvent(product.id, !ids.includes(product.id));
    return !ids.includes(product.id);
  },

  isWished(id) { return get().ids.includes(id); },
  clear() { set({ ids: [] }); saveLS('ggsWishlist', []); },
}));

// ── RECENTLY VIEWED ──────────────────────────────────────────
export const useRecentStore = create((set, get) => ({
  ids: loadLS('ggsRecentlyViewed', []),

  add(id) {
    const ids = [id, ...get().ids.filter(i => i !== id)].slice(0, 12);
    set({ ids });
    saveLS('ggsRecentlyViewed', ids);
  },
}));

// ── UI / TOAST ────────────────────────────────────────────────
export const useUIStore = create((set) => ({
  toast: null,
  showToast(msg, type = 'success') {
    set({ toast: { msg, type, id: Date.now() } });
    setTimeout(() => set({ toast: null }), 3000);
  },
  darkMode: loadLS('ggsDarkMode', false),
  toggleDark() {
    set(s => {
      const next = !s.darkMode;
      saveLS('ggsDarkMode', next);
      if (typeof document !== 'undefined') {
        document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      }
      return { darkMode: next };
    });
  },
}));

// ── AUTH ─────────────────────────────────────────────────────
function readUsers() {
  if (typeof window === 'undefined') return [];
  try { return JSON.parse(localStorage.getItem('ggsAuthUsers') || '[]'); } catch { return []; }
}

function writeUsers(users) {
  if (typeof window !== 'undefined') localStorage.setItem('ggsAuthUsers', JSON.stringify(users));
}

export const useAuthStore = create((set, get) => ({
  user: loadLS('ggsUser', null),
  hydrated: false,

  findUserByPhone(phone) {
    const users = readUsers();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    return users.find(u => String(u.phone || '').replace(/\D/g, '').slice(-10) === normalizedPhone) || null;
  },

  findUserByEmail(email) {
    const users = readUsers();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    return users.find(u => String(u.email || '').toLowerCase() === normalizedEmail) || null;
  },

  registerEmailUser({ name, email, phone }) {
    const users = readUsers();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);
    if (!name?.trim() || !normalizedEmail || !/^\d{10}$/.test(normalizedPhone)) {
      throw new Error('Name, valid email aur 10-digit phone number zaroori hai');
    }

    let existing = users.find(u => String(u.email || '').toLowerCase() === normalizedEmail);
    if (existing) {
      throw new Error('Is email se account pehle se registered hai. Login karein.');
    }
    if (users.some(u => String(u.phone || '').replace(/\D/g, '').slice(-10) === normalizedPhone)) {
      throw new Error('Is phone number se account pehle se registered hai. Login karein.');
    }

    const record = {
      id: `email_${Date.now()}`,
      name: name?.trim() || normalizedEmail.split('@')[0],
      email: normalizedEmail,
      phone: normalizedPhone,
      password: '',
      createdAt: new Date().toISOString(),
      authType: 'email_otp',
    };
    users.push(record);
    writeUsers(users);
    return record;
  },

  registerPhoneUser({ name, phone }) {
    const users = readUsers();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!name?.trim() || !normalizedPhone) {
      throw new Error('Name and phone are required');
    }

    if (users.some(u => String(u.phone || '').replace(/\D/g, '').slice(-10) === normalizedPhone)) {
      throw new Error('This phone number is already registered');
    }

    const record = {
      id: `phone_${Date.now()}`,
      name: name.trim(),
      phone: normalizedPhone,
      email: '',
      password: '',
      createdAt: new Date().toISOString(),
      authType: 'phone',
    };

    users.push(record);
    writeUsers(users);
    return record;
  },

  registerUser({ name, email, phone, password }) {
    const users = readUsers();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedPhone = String(phone || '').replace(/\D/g, '').slice(-10);

    if (!name?.trim() || !normalizedEmail || !normalizedPhone || !String(password || '').trim()) {
      throw new Error('All fields are required');
    }

    if (users.some(u => u.email === normalizedEmail)) {
      throw new Error('Email already registered');
    }

    const record = {
      id: `user_${Date.now()}`,
      name: name.trim(),
      email: normalizedEmail,
      phone: normalizedPhone,
      password: String(password).trim(),
      createdAt: new Date().toISOString(),
      authType: 'email',
    };

    users.push(record);
    writeUsers(users);

    const safeUser = {
      ...record,
      sessionToken: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
    };

    set({ user: safeUser, hydrated: true });
    saveLS('ggsUser', safeUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ggsSessionActive', '1');
      document.cookie = 'ggsUserLoggedIn=1; path=/; SameSite=Lax';
    }
    const uid = safeUser.id || safeUser.phone || safeUser.email;
    if (uid) fetchAndMergeCloudCart(uid);
    return safeUser;
  },

  loginWithPassword({ email, password }) {
    const users = readUsers();
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const match = users.find(u => u.email === normalizedEmail && u.password === String(password || '').trim());

    if (!match) {
      throw new Error('Invalid email or password');
    }

    const safeUser = {
      ...match,
      sessionToken: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
    };

    set({ user: safeUser, hydrated: true });
    saveLS('ggsUser', safeUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ggsSessionActive', '1');
      document.cookie = 'ggsUserLoggedIn=1; path=/; SameSite=Lax';
    }
    const uid = safeUser.id || safeUser.phone || safeUser.email;
    if (uid) {
      try {
        const savedCart = JSON.parse(localStorage.getItem(`ggsUserCart_${uid}`) || 'null');
        if (Array.isArray(savedCart) && savedCart.length > 0) {
          useCartStore.setState({ items: savedCart });
          saveLS('cartData', savedCart);
        }
      } catch {}
      fetchAndMergeCloudCart(uid);
    }
    return safeUser;
  },

  login(user) {
    const safeUser = {
      ...user,
      sessionToken: user.sessionToken || `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      sessionExpiresAt: Date.now() + 1000 * 60 * 60 * 12,
    };
    set({ user: safeUser, hydrated: true });
    saveLS('ggsUser', safeUser);
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('ggsSessionActive', '1');
      document.cookie = 'ggsUserLoggedIn=1; path=/; SameSite=Lax';
    }
    const uid = safeUser.id || safeUser.phone || safeUser.email;
    if (uid) {
      try {
        const savedCart = JSON.parse(localStorage.getItem(`ggsUserCart_${uid}`) || 'null');
        if (Array.isArray(savedCart) && savedCart.length > 0) {
          useCartStore.setState({ items: savedCart });
          saveLS('cartData', savedCart);
        }
      } catch {}
      fetchAndMergeCloudCart(uid);
    }
  },

  updateUser(updates) {
    const current = get().user || {};
    const updated = { ...current, ...updates };
    set({ user: updated });
    saveLS('ggsUser', updated);
    if (typeof window !== 'undefined') {
      try {
        const users = JSON.parse(localStorage.getItem('ggsAuthUsers') || '[]');
        const idx = users.findIndex(u =>
          (u.id && u.id === updated.id) ||
          (u.email && u.email === updated.email) ||
          (u.phone && u.phone === updated.phone)
        );
        if (idx !== -1) {
          users[idx] = { ...users[idx], ...updates };
          localStorage.setItem('ggsAuthUsers', JSON.stringify(users));
        }
      } catch {}
    }
    return updated;
  },

  logout() {
    const currentUser = get().user;
    const uid = currentUser?.id || currentUser?.phone || currentUser?.email;
    if (uid && typeof window !== 'undefined') {
      const currentCart = useCartStore.getState().items || [];
      try {
        localStorage.setItem(`ggsUserCart_${uid}`, JSON.stringify(currentCart));
      } catch {}
    }

    set({ user: null });
    useCartStore.setState({ items: [] });

    if (typeof window !== 'undefined') {
      localStorage.removeItem('ggsUser');
      localStorage.removeItem('cartData');
      localStorage.removeItem('ggs_cached_orders');
      localStorage.removeItem('ggs_last_phone');
      localStorage.removeItem('ggs_saved_orders');
      try {
        Object.keys(localStorage).forEach(k => {
          if (k.startsWith('ggs_cached_orders')) {
            localStorage.removeItem(k);
          }
        });
      } catch {}
      sessionStorage.removeItem('ggsSessionActive');
      document.cookie = 'ggsUserLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  },

  isLoggedIn() {
    const current = get().user;
    if (!current) return false;
    if (!current.id && !current.phone && !current.email) {
      get().logout();
      return false;
    }
    if (typeof window !== 'undefined' && sessionStorage.getItem('ggsSessionActive') !== '1') {
      get().logout();
      return false;
    }
    return true;
  },
}));

export function hydrateStores() {
  if (typeof window === 'undefined') return;

  useWishlistStore.setState({ ids: readLS('ggsWishlist', []) });
  useRecentStore.setState({ ids: readLS('ggsRecentlyViewed', []) });
  useUIStore.setState({ darkMode: readLS('ggsDarkMode', false) });

  const isSessionActive = sessionStorage.getItem('ggsSessionActive') === '1';

  if (isSessionActive) {
    const storedUser = readLS('ggsUser', null);
    let validUser = null;
    if (storedUser && (storedUser.id || storedUser.phone || storedUser.email || storedUser.name)) {
      validUser = storedUser;
    }
    useAuthStore.setState({ user: validUser, hydrated: true });
    useCartStore.setState({ items: readLS('cartData', []) });
    if (validUser) {
      const uid = validUser.id || validUser.phone || validUser.email;
      if (uid) fetchAndMergeCloudCart(uid);
    }
  } else {
    useAuthStore.setState({ user: null, hydrated: true });
    useCartStore.setState({ items: [] });
    localStorage.removeItem('cartData');
    localStorage.removeItem('ggsUser');
    document.cookie = 'ggsUserLoggedIn=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  }
}

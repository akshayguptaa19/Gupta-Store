'use client';
import './admin.css';
import { useState, useEffect, useCallback, useRef, useMemo, useDeferredValue } from 'react';
import Link from 'next/link';
import { SHOP, ORDER_STATUSES } from '@/lib/config';
import { getAnalyticsForOrders, setProductStock } from '@/lib/orders';
import { getMergedProducts, BASE_PRODUCTS } from '@/lib/products';
import { formatCurrency, formatDate, getCouponOffer, simpleHash } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';


function getAvatarColor(name = '') {
  const palette = [
    { bg: '#e0f2fe', color: '#0369a1' },
    { bg: '#fef3c7', color: '#b45309' },
    { bg: '#f3e8ff', color: '#7e22ce' },
    { bg: '#dcfce7', color: '#15803d' },
    { bg: '#ffedd5', color: '#c2410c' },
    { bg: '#fce7f3', color: '#be185d' },
  ];
  const code = (name.charCodeAt(0) || 0) + (name.charCodeAt(1) || 0);
  return palette[code % palette.length];
}

function updateLocalProductsCache(items) {
  if (!Array.isArray(items)) return;
  if (typeof window !== 'undefined') {
    try {
      localStorage.setItem('ggsCachedServerProducts', JSON.stringify(items));
      window.dispatchEvent(new CustomEvent('ggsProductsUpdated', { detail: items }));
    } catch {}
  }
}

function getAdminToken() {
  if (typeof window === 'undefined') return '';
  try {
    const saved = sessionStorage.getItem('ggsAdminAuth');
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed?.token && Number(parsed?.expiresAt) > Date.now()) {
        return parsed.token;
      }
    }
  } catch {}
  return '';
}

function clearAdminSession() {
  if (typeof window === 'undefined') return;
  try {
    sessionStorage.removeItem('ggsAdminAuth');
    localStorage.removeItem('ggsAdminAuth');
    document.cookie = 'ggs_admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT';
  } catch {}
}

export default function AdminPage() {
  const [authed, setAuthed]             = useState(false);
  const [authChecking, setAuthChecking] = useState(true);
  const [pwd, setPwd]         = useState('');
  const [pwdErr, setPwdErr]   = useState('');
  const [tab, setTab]         = useState('dashboard');

  // Dashboard data (always initialized with valid default numbers so dashboard never crashes or blanks)
  const [analytics, setAnalytics] = useState(() => getAnalyticsForOrders([]));
  const [orders, setOrders]   = useState([]);
  const [messages, setMessages] = useState([]);
  const [msgFilter, setMsgFilter] = useState('all');
  const [msgSearch, setMsgSearch] = useState('');
  const [selMessage, setSelMessage] = useState(null);
  const [replyText, setReplyText] = useState('');
  const [sendingReply, setSendingReply] = useState(false);
  const [customers, setCustomers] = useState([]);
  const [couponCodes, setCouponCodes] = useState(SHOP.couponCodes);
  const [newCoupon, setNewCoupon] = useState({ code: '', discount: '', minOrder: '' });
  const [editingCoupon, setEditingCoupon] = useState('');
  const [products, setProducts] = useState([]);
  const [wishlistCounts, setWishlistCounts] = useState({});
  const [selOrder, setSelOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [adminNote, setAdminNote] = useState('');
  const [toast, setToast]     = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  // Reviews & moderation state
  const [customerReviews, setCustomerReviews] = useState([]);
  const [reviewSubTab, setReviewSubTab] = useState('feed'); // 'feed' | 'products'
  const [deletingReviewId, setDeletingReviewId] = useState(null);
  const [reviewSearch, setReviewSearch] = useState('');
  const [reviewFilterRating, setReviewFilterRating] = useState('all');
  const [chartDays, setChartDays] = useState('7d'); // '7d' | '30d'

  // Directory & categories filters
  const [customerSearch, setCustomerSearch] = useState('');
  const [categorySearch, setCategorySearch] = useState('');

  // Product editor state
  const [editProd, setEditProd] = useState(null);
  const [offerProd, setOfferProd] = useState(null);
  const [newProductOpen, setNewProductOpen] = useState(false);
  const [prodSearch, setProdSearch] = useState('');
  const [prodCatFilter, setProdCatFilter] = useState('all');
  const [prodSort, setProdSort] = useState('name');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'pen',
    price: 99,
    mrp: 149,
    stock: 10,
    badge: 'New',
    rating: 4.5,
    reviews: 0,
    image: 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg',
    desc: '',
  });

  const CATEGORIES = ['pen', 'pencil', 'notebook', 'file', 'marker', 'colors', 'tape', 'paper', 'glue', 'scissors', 'bag', 'box', 'sticky', 'extra'];

  function showToast(msg, type='success') {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  }

  const [showPassword, setShowPassword] = useState(false);
  const [loginLoading, setLoginLoading] = useState(false);

  // 2-Step Verification (2FA) state
  const [authStep, setAuthStep]         = useState('password'); // 'password' | '2fa'
  const [challengeId, setChallengeId]   = useState('');
  const [maskedEmail, setMaskedEmail]   = useState('');
  const [emailConfigured, setEmailConfigured] = useState(true);
  const [otp, setOtp]                   = useState('');
  const [otpErr, setOtpErr]             = useState('');
  const [emergencyPin, setEmergencyPin] = useState('');
  const [usePin, setUsePin]             = useState(false);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [adminPasswordForm, setAdminPasswordForm] = useState({ current: '', next: '', confirm: '' });
  const [passwordChanging, setPasswordChanging] = useState(false);
  const [showSettingsPwd, setShowSettingsPwd] = useState({ current: false, next: false, confirm: false });
  const [inventoryFilter, setInventoryFilter] = useState('all');
  const [inventorySearch, setInventorySearch] = useState('');
  const [imageUploading, setImageUploading] = useState(false);
  const [orderFilter, setOrderFilter]       = useState('all');
  const [orderSearch, setOrderSearch]       = useState('');
  const [adminGlobalSearch, setAdminGlobalSearch] = useState('');
  const [searchFocused, setSearchFocused]   = useState(false);
  const [mobDrawerOpen, setMobDrawerOpen]   = useState(false);
  const [adminProfileDropdownOpen, setAdminProfileDropdownOpen] = useState(false);
  const searchInputRef = useRef(null);

  // High-performance deferred search values for 120fps input response
  const deferredProdSearch = useDeferredValue(prodSearch);
  const deferredOrderSearch = useDeferredValue(orderSearch);
  const deferredCustomerSearch = useDeferredValue(customerSearch);
  const deferredInventorySearch = useDeferredValue(inventorySearch);

  // Global Ctrl+K / Cmd+K shortcut for Search Bar
  useEffect(() => {
    function handleKeyDown(e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        searchInputRef.current?.focus();
        setSearchFocused(true);
      }
      if (e.key === 'Escape') {
        setSearchFocused(false);
        searchInputRef.current?.blur();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);
  const [isDark, setIsDark]                 = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const p = new URLSearchParams(window.location.search);
      const urlTab = p.get('tab');
      if (urlTab) setTab(urlTab);
    }
  }, []);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      setIsDark(document.documentElement.getAttribute('data-theme') === 'dark');
    }
  }, []);

  function toggleAdminTheme() {
    const next = !isDark;
    setIsDark(next);
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', next ? 'dark' : 'light');
      try { localStorage.setItem('ggsDarkMode', JSON.stringify(next)); } catch {}
    }
    showToast(next ? 'Dark Mode activated' : 'Light Mode activated');
  }

  function exportOrdersCSV() {
    if (!orders || orders.length === 0) {
      showToast('Koi order data nahi hai export ke liye', 'error');
      return;
    }
    const headers = ['Order ID', 'Date', 'Customer Name', 'Phone', 'Address', 'Total (INR)', 'Payment Mode', 'Status', 'Items Count'];
    const rows = orders.map(o => [
      `"${o.orderId || ''}"`,
      `"${formatDate(o.createdAt || Date.now())}"`,
      `"${(o.address?.name || 'Customer').replace(/"/g, '""')}"`,
      `"${o.address?.phone || o.phone || ''}"`,
      `"${(o.address?.address || '').replace(/"/g, '""')}"`,
      o.total || 0,
      `"${o.paymentMethod || 'COD'}"`,
      `"${o.status || 'pending'}"`,
      (o.items || []).length
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gupta_store_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Orders CSV file downloaded successfully!');
  }

  function exportProductsCSV() {
    if (!products || products.length === 0) {
      showToast('Koi product data nahi hai export ke liye', 'error');
      return;
    }
    const headers = ['Product ID', 'Name', 'Category', 'Selling Price', 'MRP', 'Stock', 'Rating', 'Reviews', 'Badge'];
    const rows = products.map(p => [
      p.id,
      `"${(p.name || '').replace(/"/g, '""')}"`,
      `"${p.category || ''}"`,
      p.price || 0,
      p.mrp || p.price || 0,
      p.stock || 0,
      p.rating || 0,
      p.reviews || 0,
      `"${p.badge || ''}"`
    ]);
    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `gupta_store_products_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('Products Inventory CSV downloaded successfully!');
  }

  function printOrderInvoice(order) {
    if (!order) return;
    const printWindow = window.open('', '_blank', 'width=800,height=900');
    if (!printWindow) return;
    const itemsHtml = (order.items || []).map((it, idx) => `
      <tr>
        <td style="padding:9px;border-bottom:1px solid #e2e8f0;">${idx + 1}</td>
        <td style="padding:9px;border-bottom:1px solid #e2e8f0;"><strong>${it.name}</strong></td>
        <td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:center;">${it.quantity || it.qty || 1}</td>
        <td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${it.price}</td>
        <td style="padding:9px;border-bottom:1px solid #e2e8f0;text-align:right;">₹${(it.price || 0) * (it.quantity || it.qty || 1)}</td>
      </tr>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice #${order.orderId} - Gupta Store Bakani</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; padding: 30px; color: #0f172a; max-width: 720px; margin: auto; }
            .header { border-bottom: 2.5px solid #f97316; padding-bottom: 18px; margin-bottom: 24px; display: flex; justify-content: space-between; align-items: flex-start; }
            .logo { font-size: 26px; font-weight: 900; color: #f97316; letter-spacing: -0.02em; }
            .badge { background: #fef3c7; color: #92400e; padding: 4px 10px; border-radius: 999px; font-size: 11px; font-weight: 800; }
            .grid { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin-bottom: 24px; }
            .box { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 10px; padding: 14px 18px; font-size: 13px; line-height: 1.6; }
            table { width: 100%; border-collapse: collapse; margin-bottom: 24px; font-size: 13px; }
            th { background: #f1f5f9; padding: 10px 9px; text-align: left; font-size: 11px; text-transform: uppercase; color: #475569; letter-spacing: 0.05em; font-weight: 800; }
            .total-box { text-align: right; margin-top: 15px; font-size: 14px; }
            .total-box strong { font-size: 20px; color: #047857; }
            .signatures { margin-top: 45px; display: flex; justify-content: space-between; font-size: 12px; color: #475569; padding-top: 15px; border-top: 1px solid #e2e8f0; }
            .footer { margin-top: 30px; padding-top: 15px; border-top: 1px dashed #cbd5e1; font-size: 11px; color: #64748b; text-align: center; }
          </style>
        </head>
        <body>
          <div class="header">
            <div>
              <div class="logo">Gupta Store</div>
              <div style="font-size:13px;color:#475569;margin-top:2px;">Main Market, Bakani, Rajasthan</div>
              <div style="font-size:12px;color:#64748b;">Support: +91 81076 15285</div>
            </div>
            <div style="text-align:right;">
              <div style="font-size:15px;font-weight:800;letter-spacing:0.04em;">DELIVERY DISPATCH BILL</div>
              <div style="font-size:13px;color:#f97316;font-weight:700;margin-top:2px;">Order ID: #${order.orderId}</div>
              <div style="font-size:11px;color:#94a3b8;margin-top:2px;">${new Date(order.createdAt || Date.now()).toLocaleString('en-IN')}</div>
            </div>
          </div>

          <div class="grid">
            <div class="box">
              <strong style="display:block;margin-bottom:6px;color:#0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Customer Delivery Info:</strong>
              <div style="font-weight:700;font-size:14px;">${order.address?.name || order.customerName || 'Customer'}</div>
              <div>Phone: <strong>${order.address?.phone || order.phone || order.customerPhone || 'N/A'}</strong></div>
              <div>${order.address?.address || order.address?.area || 'Bakani, Rajasthan'}</div>
              ${order.address?.landmark ? `<div style="color:#64748b;">Landmark: ${order.address.landmark}</div>` : ''}
            </div>
            <div class="box">
              <strong style="display:block;margin-bottom:6px;color:#0f172a;font-size:12px;text-transform:uppercase;letter-spacing:0.04em;">Payment & Dispatch:</strong>
              <div>Payment Mode: <strong>${(order.paymentMethod || order.payment || 'COD').toUpperCase()}</strong></div>
              <div>Current Status: <span class="badge">${(order.status || 'PENDING').toUpperCase()}</span></div>
              <div>Store Dispatch: <strong>Gupta Store Hub, Bakani</strong></div>
            </div>
          </div>

          <table>
            <thead>
              <tr>
                <th style="width:30px;">#</th>
                <th>Item Description</th>
                <th style="text-align:center;">Qty</th>
                <th style="text-align:right;">Price</th>
                <th style="text-align:right;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
          </table>

          <div class="total-box">
            <div>Subtotal: ₹${order.subtotal || order.total}</div>
            <div>Delivery Charges: ${order.deliveryFee > 0 ? `₹${order.deliveryFee}` : 'FREE'}</div>
            ${order.discount > 0 ? `<div style="color:#dc2626;">Coupon Discount: -₹${order.discount}</div>` : ''}
            <div style="margin-top:10px;padding-top:8px;border-top:1.5px solid #e2e8f0;">TOTAL AMOUNT TO COLLECT: <strong>₹${order.total}</strong></div>
          </div>

          <div class="signatures">
            <div>Customer Signature: __________________</div>
            <div>Delivery Driver: __________________</div>
          </div>

          <div class="footer">
            Thank you for ordering with Gupta Store! For any product returns or inquiries WhatsApp: +91 81076 15285
          </div>
          <script>
            window.onload = function() { window.print(); }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  }

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const t = setInterval(() => setResendCooldown(c => c - 1), 1000);
    return () => clearInterval(t);
  }, [resendCooldown]);

  // Step 1: Verify Password
  async function handlePasswordSubmit(e) {
    if (e) e.preventDefault();
    if (!pwd.trim()) {
      setPwdErr('Kripya admin password bharein.');
      return;
    }
    setLoginLoading(true);
    setPwdErr('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'STEP1_PASSWORD', password: pwd.trim() }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setPwdErr(data.message || 'Access Denied. Galat password.');
        return;
      }
      if (data.step === '2FA_REQUIRED') {
        setChallengeId(data.challengeId);
        setMaskedEmail(data.maskedEmail || 'owner email');
        setEmailConfigured(data.emailConfigured !== false);
        setAuthStep('2fa');
        setResendCooldown(30);
        showToast(data.message || 'Password correct! 2-Step Verification code sent to your email.', 'info');
        return;
      }
      if (data.token) {
        setAuthed(true);
        sessionStorage.setItem('ggsAdminAuth', JSON.stringify({
          valid: true,
          token: data.token,
          expiresAt: data.expiresAt,
          email: data.adminEmail,
        }));
        localStorage.removeItem('ggsAdminAuth');
        try {
          document.cookie = `ggs_admin_token=${data.token}; path=/; SameSite=Lax`;
        } catch {}
        setPwd('');
        showToast('Login successful! Welcome to Admin Panel.');
        return;
      }
    } catch (err) {
      setPwdErr('Network error ya server issue. Dobara koshish karein.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Step 2: Verify 2FA OTP or Master PIN
  async function handle2FASubmit(e) {
    if (e) e.preventDefault();
    if (!usePin && !otp.trim()) {
      setOtpErr('Kripya 6-digit verification code bharein.');
      return;
    }
    if (usePin && !emergencyPin.trim()) {
      setOtpErr('Kripya Master Emergency PIN bharein.');
      return;
    }

    setLoginLoading(true);
    setOtpErr('');
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'STEP2_VERIFY_2FA',
          challengeId,
          otp: otp.trim(),
          emergencyPin: emergencyPin.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) {
        setOtpErr(data.message || 'Galat verification code.');
        return;
      }

      setAuthed(true);
      sessionStorage.setItem('ggsAdminAuth', JSON.stringify({
        valid: true,
        token: data.token,
        expiresAt: data.expiresAt,
        email: data.adminEmail,
      }));
      localStorage.removeItem('ggsAdminAuth');
      try {
        document.cookie = `ggs_admin_token=${data.token}; path=/; SameSite=Lax`;
      } catch {}
      setPwd('');
      setOtp('');
      setEmergencyPin('');
      setAuthStep('password');
      showToast('2-Step Verification complete. Welcome, Owner.');
    } catch (err) {
      setOtpErr('Network issue. Dobara koshish karein.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Resend 2FA Code
  async function handleResend2FA() {
    if (resendCooldown > 0) return;
    setLoginLoading(true);
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'RESEND_2FA', challengeId }),
      });
      const data = await res.json();
      if (data.ok) {
        setResendCooldown(30);
        showToast('Naya verification code bhej diya gaya hai!');
      } else {
        setOtpErr(data.message || 'Resend fail ho gaya.');
      }
    } catch {
      setOtpErr('Resend failed. Internet connection check karein.');
    } finally {
      setLoginLoading(false);
    }
  }

  // Restore the signed session on refresh — verify in background without dropping active session on reload
  useEffect(() => {
    async function restoreSession() {
      const token = getAdminToken();

      if (!token) {
        clearAdminSession();
        setAuthed(false);
        setAuthChecking(false);
        return;
      }

      setAuthed(true);
      setAuthChecking(false);

      // Verify token with server in background
      try {
        const res = await fetch('/api/admin/verify-session', {
          method: 'POST',
          headers: { 
            Authorization: `Bearer ${token}`,
            'x-admin-token': token,
          },
          cache: 'no-store',
        });
        const data = await res.json().catch(() => ({}));
        if (res.status === 401 || (res.ok && data.valid === false)) {
          clearAdminSession();
          setAuthed(false);
        }
      } catch {
        // Do NOT log out on network hiccup/refresh; keep active session intact
      }
    }

    restoreSession();
  }, []);

  const refresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // 1. Synchronize products safely
      try {
        setProducts(getMergedProducts());
        const prodRes = await fetch('/api/products?t=' + Date.now(), { cache: 'no-store' });
        if (prodRes.ok) {
          const prodData = await prodRes.json().catch(() => ({}));
          if (prodData.ok && Array.isArray(prodData.products)) {
            setProducts(prodData.products);
            updateLocalProductsCache(prodData.products);
          }
        }
      } catch (e) {
        console.warn('Products sync notice:', e?.message);
      }

      const token = getAdminToken();
      const headers = { 'x-admin-token': token || '' };

      // 2. Fetch admin feeds in parallel safely
      const [res, messagesRes, wishlistRes, customersRes, couponsRes, reviewsRes] = await Promise.all([
        fetch('/api/admin/orders', { headers, cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/inquiries', { headers, cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/wishlist', { headers, cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/customers', { headers, cache: 'no-store' }).catch(() => null),
        fetch('/api/admin/coupons', { headers, cache: 'no-store' }).catch(() => null),
        fetch('/api/reviews', { cache: 'no-store' }).catch(() => null),
      ]);

      if (res?.status === 401 && !token) {
        localStorage.removeItem('ggsAdminAuth');
        try { document.cookie = 'ggs_admin_token=; path=/; max-age=0; expires=Thu, 01 Jan 1970 00:00:00 GMT'; } catch {}
        setAuthed(false);
        showToast('Admin session expired. Kripya login karein.', 'error');
        return;
      }

      if (res && res.ok) {
        const data = await res.json().catch(() => ({}));
        if (data.ok && Array.isArray(data.orders)) {
          const cleanOrders = data.orders.filter(o => 
            o && 
            !String(o.orderId || o.id || '').startsWith('SYS_') && 
            !String(o.orderId || o.id || '').startsWith('CART_') && 
            o.status !== 'cart_cloud_sync'
          );
          setOrders(cleanOrders);
          setAnalytics(getAnalyticsForOrders(cleanOrders));
        } else {
          setAnalytics(curr => curr || getAnalyticsForOrders([]));
        }
      } else {
        setAnalytics(curr => curr || getAnalyticsForOrders([]));
      }

      if (messagesRes && messagesRes.ok) {
        const messagesData = await messagesRes.json().catch(() => ({}));
        if (messagesData.ok && Array.isArray(messagesData.inquiries)) {
          setMessages(messagesData.inquiries);
        }
      }

      if (customersRes && customersRes.ok) {
        const customersData = await customersRes.json().catch(() => ({}));
        if (customersData.ok && Array.isArray(customersData.customers)) {
          setCustomers(customersData.customers);
        }
      }

      if (couponsRes && couponsRes.ok) {
        const couponsData = await couponsRes.json().catch(() => ({}));
        if (couponsData.ok && couponsData.coupons) {
          setCouponCodes(couponsData.coupons);
        }
      }

      if (reviewsRes && reviewsRes.ok) {
        const reviewsData = await reviewsRes.json().catch(() => ({}));
        if (reviewsData.ok && Array.isArray(reviewsData.reviews)) {
          setCustomerReviews(reviewsData.reviews);
        }
      }

      let localWishlist = {};
      try {
        const ids = JSON.parse(localStorage.getItem('ggsWishlist') || '[]');
        localWishlist = Object.fromEntries(ids.map(id => [String(id), 1]));
      } catch {}

      if (wishlistRes && wishlistRes.ok) {
        const wishlistData = await wishlistRes.json().catch(() => ({}));
        setWishlistCounts(wishlistData.ok ? { ...localWishlist, ...wishlistData.counts } : localWishlist);
      } else {
        setWishlistCounts(localWishlist);
      }
    } catch (err) {
      console.warn('Refresh error caught:', err);
      setAnalytics(curr => curr || getAnalyticsForOrders([]));
    } finally {
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    if (!authed) return;
    refresh().catch(error => showToast(error.message, 'error'));
  }, [authed, refresh]);

  function handleLogout() {
    clearAdminSession();
    setAuthed(false);
    setAuthStep('password');
  }

  async function handleStatusUpdate() {
    if (!selOrder || !newStatus) return;
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const tracking = [
        ...(selOrder.tracking || []),
        { status: newStatus, time: new Date().toISOString(), note: adminNote || `Status updated to ${newStatus}` },
      ];
      const res = await fetch(`/api/orders/${selOrder.orderId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || getAdminToken() || '' },
        body: JSON.stringify({ status: newStatus, tracking, ...(adminNote ? { adminNote } : {}) }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Status update failed.');
      showToast(data.statusNotificationSent
        ? `Status update saved. Customer notification email sent.`
        : data.statusNotificationMessage || (data.deliveryEmailSent
          ? `Order delivered. Thank-you bill email sent to customer.`
          : data.deliveryEmailMessage || `Order ${selOrder.orderId} status updated!`),
      data.statusNotificationMessage || data.deliveryEmailMessage ? 'info' : 'success');
      setSelOrder(null);
      setNewStatus('');
      setAdminNote('');
      await refresh();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function handleDeleteOrder(orderId) {
    if (!confirm(`Order ${orderId} delete karna chahte ho?`)) return;
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const res = await fetch(`/api/orders/${orderId}`, { method: 'DELETE', headers: { 'x-admin-token': session.token || getAdminToken() || '' } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Order delete failed.');
      showToast('Order deleted!', 'error');
      await refresh();
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function toggleMessageStatus(message) {
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const nextStatus = message.status === 'unread' ? 'read' : 'unread';
      const msgId = message._id || message.id;
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || getAdminToken() || '' },
        body: JSON.stringify({ id: msgId, status: nextStatus }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Message update failed.');
      setMessages(current => current.map(item => (item._id || item.id) === msgId ? { ...item, status: nextStatus } : item));
      if (selMessage && (selMessage._id || selMessage.id) === msgId) {
        setSelMessage(m => ({ ...m, status: nextStatus }));
      }
      showToast(nextStatus === 'read' ? 'Message marked as read.' : 'Message marked as unread.', 'info');
    } catch (error) { showToast(error.message, 'error'); }
  }

  async function deleteMessage(message) {
    if (!message) return;
    if (!window.confirm(`Kya aap "${message.name}" ka yeh customer message delete karna chahte hain?`)) return;
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const msgId = message._id || message.id;
      const res = await fetch(`/api/admin/inquiries?id=${encodeURIComponent(msgId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': session.token || getAdminToken() || '' },
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Message delete nahi ho saka.');
      setMessages(current => current.filter(item => (item._id || item.id) !== msgId));
      if (selMessage && (selMessage._id || selMessage.id) === msgId) {
        setSelMessage(null);
      }
      showToast('Customer message successfully delete ho gaya.', 'success');
    } catch (error) {
      showToast(error.message, 'error');
    }
  }

  async function submitReply(message, customText) {
    if (!message) return;
    const textToSend = customText !== undefined ? customText : replyText;
    if (!textToSend || !textToSend.trim()) {
      showToast('Reply text empty nahi ho sakta.', 'error');
      return;
    }
    setSendingReply(true);
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const msgId = message._id || message.id;
      const res = await fetch('/api/admin/inquiries', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || getAdminToken() || '',
        },
        body: JSON.stringify({
          id: msgId,
          action: 'REPLY',
          reply: textToSend.trim(),
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Reply send nahi ho saka.');

      const nowIso = new Date().toISOString();
      setMessages(current => current.map(item => (item._id || item.id) === msgId ? {
        ...item,
        status: 'replied',
        reply: textToSend.trim(),
        repliedAt: nowIso,
      } : item));

      if (selMessage && (selMessage._id || selMessage.id) === msgId) {
        setSelMessage(m => ({
          ...m,
          status: 'replied',
          reply: textToSend.trim(),
          repliedAt: nowIso,
        }));
      }

      showToast(`"${message.name}" ko reply bhej diya gaya! Customer notifications me live dikhega.`, 'success');
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSendingReply(false);
    }
  }

  async function saveCoupon(e) {
    e.preventDefault();
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const editing = Boolean(editingCoupon);
      const res = await fetch('/api/admin/coupons', { method: editing ? 'PATCH' : 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || getAdminToken() || '' }, body: JSON.stringify(editing ? { ...newCoupon, code: editingCoupon } : newCoupon) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Coupon save nahi ho saka.');
      setCouponCodes(current => ({ ...current, [data.code]: data.discount }));
      setNewCoupon({ code: '', discount: '', minOrder: '' });
      setEditingCoupon('');
      showToast(editing ? `Coupon ${data.code} update ho gaya.` : `Coupon ${data.code} create ho gaya.`);
    } catch (error) { showToast(error.message, 'error'); }
  }

  async function deleteCoupon(code) {
    if (!confirm(`${code} coupon delete karna chahte ho?`)) return;
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const res = await fetch(`/api/admin/coupons?code=${encodeURIComponent(code)}`, { method: 'DELETE', headers: { 'x-admin-token': session.token || getAdminToken() || '' } });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Coupon delete nahi ho saka.');
      setCouponCodes(current => { const next = { ...current }; delete next[code]; return next; });
      showToast(`Coupon ${code} delete ho gaya.`, 'info');
    } catch (error) { showToast(error.message, 'error'); }
  }

  function startCouponEdit(code) {
    const offer = getCouponOffer(code, couponCodes);
    setEditingCoupon(code);
    setNewCoupon({ code, discount: offer.discount, minOrder: offer.minOrder });
    document.querySelector('.coupon-admin-form')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  async function toggleCustomerBlock(customer) {
    const nextBlocked = !customer.blocked;
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const res = await fetch('/api/admin/customers', { method: 'PATCH', headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || getAdminToken() || '' }, body: JSON.stringify({ email: customer.email, phone: customer.phone, blocked: nextBlocked, reason: 'Blocked by store admin' }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Customer access update failed.');
      setCustomers(current => current.map(item => item.id === customer.id ? { ...item, blocked: nextBlocked } : item));
      showToast(nextBlocked ? 'Customer blocked. New orders will be rejected.' : 'Customer unblocked.', nextBlocked ? 'info' : 'success');
    } catch (error) { showToast(error.message, 'error'); }
  }

  async function handleDeleteReview(reviewId) {
    if (!confirm('Kya aap sach me is customer review ko delete karna chahte hain?')) return;
    setDeletingReviewId(reviewId);
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const token = session.token || getAdminToken() || '';
      const res = await fetch(`/api/reviews?id=${encodeURIComponent(reviewId)}`, {
        method: 'DELETE',
        headers: { 'x-admin-token': token },
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) {
        setCustomerReviews(current => current.filter(r => r.id !== reviewId));
        showToast('Review successfully delete ho gaya.', 'info');
      } else {
        throw new Error(data.message || 'Review delete nahi ho saka.');
      }
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setDeletingReviewId(null);
    }
  }

  async function callProductsApi(action, payload = {}) {
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const res = await fetch('/api/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-token': session.token || getAdminToken() || '',
        },
        body: JSON.stringify({ action, ...payload }),
      });
      const data = await res.json();
      if (data.ok && Array.isArray(data.products)) {
        setProducts(data.products);
        updateLocalProductsCache(data.products);
      }
      return data;
    } catch (err) {
      console.warn('callProductsApi error:', err);
      return null;
    }
  }

  async function handleUploadImageFile(e, targetId, type = 'edit') {
    const file = e.target.files?.[0];
    console.log("IMAGE UPLOAD HANDLER TRIGGERED", {
  targetId,
  type,
  fileName: file?.name,
  fileType: file?.type,
  fileSize: file?.size,
});
    if (!file) return;
    setImageUploading(true);
    try {
      
const form = new FormData();
if (targetId) form.append('productId', String(targetId));
form.append('image', file);

const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');

const res = await fetch('/api/uploadProductImage', {
  method: 'POST',
  headers: {
    'x-admin-token': session.token || getAdminToken() || '',
  },
  body: form,
});

      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Image upload failed');

      const uploadedUrl = data.url || data.image;

      if (type === 'new') {
        setNewProduct(prev => ({ ...prev, image: uploadedUrl }));
        showToast('Nayi photo select ho gayi! 🖼️');
      } else if (type === 'edit') {
        setEditProd(prev => ({ ...prev, image: uploadedUrl }));
        showToast('Photo upload ho gayi! "Save Changes" dabayein.');
      } else if (type === 'direct' && targetId) {
        // Direct table upload
        await callProductsApi('SET_IMAGE', { id: targetId, image: uploadedUrl });
        showToast('Photo turant update ho gayi aur sabhi users ko dikhegi! 🎉');
        await refresh();
      }
    } catch (err) {
      showToast(err.message || 'Image upload failed', 'error');
    } finally {
      setImageUploading(false);
      e.target.value = '';
    }
  }

  async function handleStockUpdate(id, qty) {
    setProductStock(id, Number(qty));
    await callProductsApi('SET_STOCK', { id, stock: Number(qty) });
    showToast(`Stock updated!`);
    refresh();
  }

  async function handleCreateProduct() {
    if (!newProduct.name.trim()) {
      showToast('Product name required!', 'error');
      return;
    }
    if (!newProduct.category.trim()) {
      showToast('Category required!', 'error');
      return;
    }

    const id = Date.now();
    const created = {
      id,
      name: newProduct.name.trim(),
      category: newProduct.category.trim().toLowerCase(),
      price: Number(newProduct.price) || 0,
      mrp: Number(newProduct.mrp) || Number(newProduct.price) || 0,
      stock: Number(newProduct.stock) || 0,
      rating: Number(newProduct.rating) || 4.5,
      reviews: Number(newProduct.reviews) || 0,
      badge: newProduct.badge?.trim() || 'New',
      image: newProduct.image || 'https://placehold.co/200x200/f1f5f9/94a3b8?text=IMG',
      desc: newProduct.desc || 'Fresh product added by admin.',
      tags: [newProduct.name.trim().toLowerCase(), newProduct.category.trim().toLowerCase()],
      features: ['Admin added product', 'Fresh stock', 'Ready to sell'],
    };

    const customs = JSON.parse(localStorage.getItem('ggsCustomProducts') || '[]');
    customs.push(created);
    localStorage.setItem('ggsCustomProducts', JSON.stringify(customs));

    await callProductsApi('CREATE_PRODUCT', { product: created });

    showToast(`Product "${created.name}" added aur saare users ke liye LIVE hai!`);
    setNewProductOpen(false);
    setNewProduct({
      name: '',
      category: 'pen',
      price: 99,
      mrp: 149,
      stock: 10,
      badge: 'New',
      rating: 4.5,
      reviews: 0,
      image: 'https://m.media-amazon.com/images/I/71VxWwbdwmL._SX679_.jpg',
      desc: '',
    });
    refresh();
  }

  async function handleDeleteProduct(id) {
    if (!confirm('Is product ko delete karna chahte ho? Sabhi users ke liye remove ho jayega.')) return;
    const customs = JSON.parse(localStorage.getItem('ggsCustomProducts') || '[]');
    const deleted = JSON.parse(localStorage.getItem('ggsDeletedProducts') || '[]');
    const nextCustoms = customs.filter(p => p.id !== id);
    const nextDeleted = deleted.includes(id) ? deleted : [...deleted, id];
    localStorage.setItem('ggsCustomProducts', JSON.stringify(nextCustoms));
    localStorage.setItem('ggsDeletedProducts', JSON.stringify(nextDeleted));

    await callProductsApi('DELETE_PRODUCT', { id });

    showToast('Product removed from catalog.', 'error');
    refresh();
  }

  async function handleSaveProd(prod) {
    const overrides = JSON.parse(localStorage.getItem('ggsProductOverrides') || '{}');
    overrides[prod.id] = { name: prod.name, price: Number(prod.price), mrp: Number(prod.mrp), category: prod.category, badge: prod.badge, desc: prod.desc, image: prod.image };
    localStorage.setItem('ggsProductOverrides', JSON.stringify(overrides));
    setProductStock(prod.id, Number(prod.stock));

    await callProductsApi('UPDATE_PRODUCT', { product: prod });

    showToast('Product aur photo update ho gayi — saare users ko LIVE dikhegi! ✅');
    setEditProd(null);
    refresh();
  }

  async function handleSaveOffer(prod) {
    const overrides = JSON.parse(localStorage.getItem('ggsProductOverrides') || '{}');
    const existing = overrides[prod.id] || {};
    const updatedProd = {
      ...existing,
      ...prod,
      name: prod.name,
      price: Number(prod.price),
      mrp: Number(prod.mrp) || Number(prod.price),
      category: prod.category,
      badge: prod.badge || '',
      desc: prod.desc || existing.desc || '',
      image: prod.image || existing.image,
    };
    overrides[prod.id] = updatedProd;
    localStorage.setItem('ggsProductOverrides', JSON.stringify(overrides));
    if (prod.stock !== undefined) {
      setProductStock(prod.id, Number(prod.stock));
    }

    await callProductsApi('UPDATE_PRODUCT', { product: updatedProd });

    showToast(`"${prod.name}" ka price ₹${prod.price} aur offer live ho gaya!`);
    setOfferProd(null);
    refresh();
  }

  async function toggleAvailability(id, current) {
    const nextAvail = !current;
    const a = JSON.parse(localStorage.getItem('ggsAvailability') || '{}');
    a[id] = nextAvail;
    localStorage.setItem('ggsAvailability', JSON.stringify(a));

    await callProductsApi('TOGGLE_AVAILABILITY', { id, available: nextAvail });

    showToast(current ? 'Product hidden from users!' : 'Product visible to all users!');
    refresh();
  }

  function getAvailabilityState(id) {
    const avails = JSON.parse(localStorage.getItem('ggsAvailability') || '{}');
    return avails[id] === false;
  }

  function getFilteredProducts() {
    let list = [...products];
    
    // High-performance Search filter
    const searchVal = (deferredProdSearch || '').trim().toLowerCase();
    if (searchVal) {
      list = list.filter(p => (p.name || '').toLowerCase().includes(searchVal) || String(p.id).includes(searchVal));
    }
    
    // Category filter
    if (prodCatFilter !== 'all') {
      list = list.filter(p => p.category === prodCatFilter);
    }
    
    // Non-mutating Sort
    if (prodSort === 'name') list.sort((a, b) => (a.name || '').localeCompare(b.name || ''));
    else if (prodSort === 'price-asc') list.sort((a, b) => (a.price || 0) - (b.price || 0));
    else if (prodSort === 'price-desc') list.sort((a, b) => (b.price || 0) - (a.price || 0));
    else if (prodSort === 'stock') list.sort((a, b) => (b.stock || 0) - (a.stock || 0));
    else if (prodSort === 'rating') list.sort((a, b) => (b.rating || 0) - (a.rating || 0));
    else if (prodSort === 'wishlist') list.sort((a, b) => (wishlistCounts[b.id] || 0) - (wishlistCounts[a.id] || 0));
    
    return list;
  }

  function handleSetBadge(id, badge) {
    const overrides = JSON.parse(localStorage.getItem('ggsProductOverrides') || '{}');
    const p = products.find(x => x.id === id);
    if (p) {
      overrides[id] = { ...overrides[id], name: p.name, price: p.price, mrp: p.mrp, category: p.category, badge, desc: p.desc };
      localStorage.setItem('ggsProductOverrides', JSON.stringify(overrides));
      showToast(`Badge updated to "${badge}"!`);
      refresh();
    }
  }

  function getCategoryStats() {
    const stats = {};
    products.forEach(p => {
      if (!stats[p.category]) stats[p.category] = { count: 0, totalStock: 0, avgPrice: 0, totalPrice: 0 };
      stats[p.category].count++;
      stats[p.category].totalStock += p.stock;
      stats[p.category].totalPrice += p.price;
    });
    Object.keys(stats).forEach(cat => {
      stats[cat].avgPrice = (stats[cat].totalPrice / stats[cat].count).toFixed(0);
    });
    return stats;
  }

  function openCategoryProducts(category) {
    setProdCatFilter(category);
    setProdSearch('');
    setProdSort('name');
    setTab('products');
  }

  async function changeAdminPassword(e) {
    e.preventDefault();
    if (adminPasswordForm.next.length < 10) { showToast('New password kam se kam 10 characters ka hona chahiye.', 'error'); return; }
    if (adminPasswordForm.next !== adminPasswordForm.confirm) { showToast('New passwords match nahi kar rahe.', 'error'); return; }
    setPasswordChanging(true);
    try {
      const session = JSON.parse(localStorage.getItem('ggsAdminAuth') || '{}');
      const res = await fetch('/api/admin/settings', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-token': session.token || getAdminToken() || '' }, body: JSON.stringify({ action: 'CHANGE_PASSWORD', currentPassword: adminPasswordForm.current, newPassword: adminPasswordForm.next }) });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Password change nahi ho saka.');
      setAdminPasswordForm({ current: '', next: '', confirm: '' });
      showToast('Admin password securely change ho gaya.');
    } catch (error) { showToast(error.message, 'error'); }
    finally { setPasswordChanging(false); }
  }


  const statusInfo = (s) => ORDER_STATUSES.find(x => x.key === s) || ORDER_STATUSES[0];
  const getInitials = (name) => {
    if (!name) return 'CU';
    const parts = String(name).trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0].slice(0, 2).toUpperCase();
  };
  const formatOrderId = (id) => {
    if (!id) return '#ORDER';
    const clean = String(id).replace(/^#/, '');
    if (clean.length > 18) return `#${clean.slice(0, 14)}...`;
    return `#${clean}`;
  };
  const wishlistTotal = Object.values(wishlistCounts).reduce((total, count) => total + Number(count || 0), 0);
  const categoryStats = getCategoryStats();
  const customerRows = Object.values(orders.reduce((map, order) => {
    const key = order.address?.phone || order.customerEmail || 'guest';
    map[key] = { ...(map[key] || { name: order.address?.name || 'Guest', phone: order.address?.phone || '-', email: order.customerEmail || '-', orders: 0, spend: 0 }), orders: map[key]?.orders + 1 || 1, spend: (map[key]?.spend || 0) + Number(order.total || 0) };
    return map;
  }, {}));
  const customerDirectory = customers.length > 0
    ? customers.map(account => {
      const orderStats = customerRows.find(row => row.email === account.email || (row.phone && row.phone === account.phone));
      return { ...account, name: account.name || orderStats?.name || 'Customer', phone: account.phone || orderStats?.phone || '-', email: account.email || orderStats?.email || '-', orders: orderStats?.orders || 0, spend: orderStats?.spend || 0 };
    })
    : customerRows;

  const filteredCustomerDirectory = customerDirectory.filter(customer => {
    const qCust = (deferredCustomerSearch || '').trim().toLowerCase();
    if (!qCust) return true;
    return (
      (customer.name && customer.name.toLowerCase().includes(qCust)) ||
      (customer.phone && customer.phone.includes(qCust)) ||
      (customer.email && customer.email.toLowerCase().includes(qCust))
    );
  });

  const filteredCustomerReviews = customerReviews.filter(rev => {
    if (reviewFilterRating !== 'all' && Number(rev.rating) !== Number(reviewFilterRating)) return false;
    if (!reviewSearch.trim()) return true;
    const q = reviewSearch.trim().toLowerCase();
    return (
      (rev.customerName && rev.customerName.toLowerCase().includes(q)) ||
      (rev.productName && rev.productName.toLowerCase().includes(q)) ||
      (rev.comment && rev.comment.toLowerCase().includes(q)) ||
      (rev.orderId && rev.orderId.toLowerCase().includes(q))
    );
  });
  const offerProducts = products.filter(product => Number(product.mrp) > Number(product.price) || product.badge);
  const notificationRows = orders.filter(order => order.status && order.status !== 'placed').slice(0, 20);
  const inventoryProducts = products.filter(product => {
    const query = (deferredInventorySearch || '').trim().toLowerCase();
    const matchesSearch = !query || (product.name || '').toLowerCase().includes(query) || String(product.id).includes(query);
    const matchesFilter = inventoryFilter === 'low' ? Number(product.stock) > 0 && Number(product.stock) <= 5 : inventoryFilter === 'out' ? Number(product.stock) <= 0 : true;
    return matchesSearch && matchesFilter;
  });
  // Real live product sales aggregation directly from actual customer orders
  const productSalesMap = useMemo(() => {
    const map = {};
    (orders || []).forEach(o => {
      if (['cancelled'].includes(o.status)) return;
      (o.items || []).forEach(i => {
        const idKey = String(i.id || i._id || '');
        const nameKey = String(i.name || '').trim().toLowerCase();
        const qty = Number(i.qty || 1);
        if (idKey) map[idKey] = (map[idKey] || 0) + qty;
        if (nameKey) map[nameKey] = (map[nameKey] || 0) + qty;
      });
    });
    return map;
  }, [orders]);

  const topWishlistedProducts = [...products]
    .map(product => ({
      ...product,
      wishlistCount: Number(wishlistCounts[product.id] || wishlistCounts[String(product.id)] || 0),
      unitsSold: Number(productSalesMap[String(product.id)] || productSalesMap[String(product.name || '').trim().toLowerCase()] || 0),
    }))
    .sort((a, b) => (b.wishlistCount + b.unitsSold * 2) - (a.wishlistCount + a.unitsSold * 2))
    .slice(0, 6);

  if (authChecking) return (
    <div className="admin-session-loading">
      <div className="admin-session-spinner" />
      <strong>Admin session verify ho raha hai...</strong>
      <span>Dashboard ko secure way se restore kar rahe hain.</span>
    </div>
  );

  if (!authed) return (
    <div className="admin-auth-page">
      <div className="admin-auth-card">
        
        {/* Top 2FA Shield Badge */}
        <div style={{display:'flex',justifyContent:'center',marginBottom:'1.25rem'}}>
          <span className="admin-auth-security">
            Bank-grade 2-step verification protected
          </span>
        </div>

        {authStep === 'password' ? (
          /* ── STEP 1: PASSWORD SCREEN ── */
          <div>
            <div className="admin-auth-brand">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Gupta Store Logo"
                className="admin-auth-logo"
              />
              <h1 className="admin-auth-title">
                Owner Portal
              </h1>
              <p className="admin-auth-subtitle">
                Step 1 of 2: Enter Admin Password
              </p>
            </div>

            <form onSubmit={handlePasswordSubmit}>
              <div className="form-group">
                <label className="form-label">Secret Passkey / Password</label>
                <div style={{position:'relative',display:'flex',alignItems:'center'}}>
                  <input
                    className="form-input"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••••••"
                    value={pwd}
                    onChange={e=>{setPwd(e.target.value);setPwdErr('');}}
                    style={{paddingRight:'2.5rem'}}
                    autoFocus
                  />
                  <button
                    type="button"
                    onClick={()=>setShowPassword(!showPassword)}
                    style={{position:'absolute',right:'12px',background:'none',border:'none',cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center',color:'var(--text-muted)'}}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    <AppIcon name={showPassword ? 'eyeOff' : 'eye'} size={18} />
                  </button>
                </div>
                {pwdErr && <p style={{color:'var(--red)',fontSize:'0.8rem',fontWeight:600,marginTop:'0.5rem'}}>{pwdErr}</p>}
                <div style={{ marginTop: '0.75rem', padding: '0.65rem 0.85rem', background: 'rgba(249, 115, 22, 0.04)', borderRadius: '10px', border: '1px solid rgba(249, 115, 22, 0.16)', fontSize: '0.74rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '8px', lineHeight: 1.4 }}>
                  <AppIcon name="shield" size={16} />
                  <span>Confidential Store Portal. Unauthorized access is strictly prohibited and logged.</span>
                </div>
              </div>

              <button
                type="submit"
                className="btn btn-orange"
                style={{width:'100%',padding:'0.85rem',fontSize:'1rem',fontWeight:700,opacity:loginLoading?0.7:1}}
                disabled={loginLoading}
              >
                {loginLoading ? 'Verifying Password & Sending OTP...' : 'Verify Password & Send OTP →'}
              </button>
            </form>

            <div style={{textAlign:'center',marginTop:'1.5rem'}}>
              <a href="/" onClick={clearAdminSession} style={{color:'var(--text-muted)',fontSize:'0.8rem',textDecoration:'none'}}>← Back to Gupta Store</a>
            </div>
          </div>
        ) : (
          /* ── STEP 2: 2FA OTP SCREEN ── */
          <div>
            <div className="admin-auth-brand compact">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/logo.png"
                alt="Gupta Store Logo"
                className="admin-auth-logo"
              />
              <h1 className="admin-auth-title compact">
                2-Step Verification
              </h1>
              <p className="admin-auth-subtitle">
                Step 2 of 2: Enter Verification Code
              </p>
            </div>

            {/* Email notice box */}
            <div style={{
              background: '#eff6ff',
              border: '1.5px solid #bfdbfe',
              borderRadius: 'var(--radius-md)',
              padding: '0.9rem 1.1rem',
              fontSize: '0.85rem',
              color: '#1e40af',
              marginBottom: '1.25rem',
              lineHeight: 1.5,
            }}>
              <div style={{fontWeight: 800, marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.4rem'}}>
                <span>📧</span> Security Verification OTP Sent
              </div>
              <div>Registered Owner Email: <strong>{maskedEmail}</strong></div>
              <div style={{fontSize: '0.78rem', color: '#3b82f6', marginTop: '0.35rem'}}>
                This code is valid for 5 minutes. Check your inbox.
              </div>
            </div>

            <form onSubmit={handle2FASubmit}>
              {!usePin ? (
                <div className="form-group">
                  <label className="form-label" style={{display:'flex',justifyContent:'space-between'}}>
                    <span>Enter 6-Digit OTP</span>
                    <span style={{color:'var(--text-muted)',fontSize:'0.75rem'}}>From your inbox</span>
                  </label>
                  <input
                    className="form-input"
                    type="text"
                    maxLength={6}
                    placeholder="123456"
                    value={otp}
                    onChange={e=>{setOtp(e.target.value.replace(/\D/g, ''));setOtpErr('');}}
                    style={{
                      fontSize: '1.5rem',
                      letterSpacing: '0.5rem',
                      textAlign: 'center',
                      fontWeight: 800,
                      padding: '0.65rem',
                    }}
                    autoFocus
                  />
                  {otpErr && <p style={{color:'var(--red)',fontSize:'0.8rem',fontWeight:600,marginTop:'0.5rem'}}>{otpErr}</p>}
                </div>
              ) : (
                <div className="form-group">
                  <label className="form-label" style={{display:'flex',justifyContent:'space-between'}}>
                    <span>Emergency Master PIN</span>
                    <span style={{color:'var(--orange)',fontSize:'0.75rem'}}>Owner Recovery Key</span>
                  </label>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Master PIN"
                    value={emergencyPin}
                    onChange={e=>{setEmergencyPin(e.target.value);setOtpErr('');}}
                    style={{fontSize: '1.2rem', textAlign: 'center', fontWeight: 700}}
                    autoFocus
                  />
                  {otpErr && <p style={{color:'var(--red)',fontSize:'0.8rem',fontWeight:600,marginTop:'0.5rem'}}>{otpErr}</p>}
                </div>
              )}

              <button
                type="submit"
                className="btn btn-orange"
                style={{width:'100%',padding:'0.85rem',fontSize:'1rem',fontWeight:700,opacity:loginLoading?0.7:1,marginBottom:'0.75rem'}}
                disabled={loginLoading}
              >
                {loginLoading ? 'Verifying 2FA...' : 'Verify & Access Dashboard'}
              </button>
            </form>

            {/* Actions: Resend OTP and Toggle Master PIN */}
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'1rem',fontSize:'0.82rem'}}>
              <button
                type="button"
                onClick={handleResend2FA}
                disabled={resendCooldown > 0 || loginLoading}
                style={{
                  background: 'none',
                  border: 'none',
                  color: resendCooldown > 0 ? 'var(--text-muted)' : 'var(--blue)',
                  cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                  fontWeight: 600,
                }}
              >
                {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend Code'}
              </button>

              <button
                type="button"
                onClick={()=>{setUsePin(!usePin);setOtpErr('');}}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--orange)',
                  cursor: 'pointer',
                  fontWeight: 600,
                }}
              >
                {usePin ? '← Use Email OTP' : 'Use Master PIN'}
              </button>
            </div>

            <div style={{textAlign:'center',marginTop:'1.5rem',borderTop:'1px solid var(--border)',paddingTop:'1rem'}}>
              <button
                type="button"
                onClick={()=>{setAuthStep('password');setOtpErr('');setOtp('');}}
                style={{background:'none',border:'none',color:'var(--text-muted)',fontSize:'0.8rem',cursor:'pointer'}}
              >
                ← Back to Step 1 (Change Password)
              </button>
            </div>
          </div>
        )}

      </div>
    </div>
  );

  const pendingOrdersBadge = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
  const unreadMessagesBadge = messages.filter(m => m.status === 'unread').length;
  const notificationsBadge = notificationRows.length;

  const NAV_GROUPS = [
    {
      title: 'WORKSPACE',
      items: [
        { id: 'dashboard', icon: 'barChart', label: 'Dashboard' },
        { id: 'orders', icon: 'package', label: 'Orders', badge: pendingOrdersBadge },
      ]
    },
    {
      title: 'CATALOG',
      items: [
        { id: 'products', icon: 'shop', label: 'Products' },
        { id: 'categories', icon: 'grid', label: 'Categories' },
        { id: 'inventory', icon: 'clipboard', label: 'Inventory' },
      ]
    },
    {
      title: 'CUSTOMERS',
      items: [
        { id: 'customers', icon: 'user', label: 'Customers' },
        { id: 'reviews', icon: 'star', label: 'Reviews' },
      ]
    },
    {
      title: 'MARKETING',
      items: [
        { id: 'coupons', icon: 'tag', label: 'Coupons' },
        { id: 'offers', icon: 'sale', label: 'Offers' },
      ]
    },
    {
      title: 'COMMUNICATION',
      items: [
        { id: 'notifications', icon: 'bell', label: 'Notifications', badge: notificationsBadge },
        { id: 'messages', icon: 'message', label: 'Messages', badge: unreadMessagesBadge },
      ]
    },
    {
      title: 'BUSINESS',
      items: [
        { id: 'analytics', icon: 'barChart', label: 'Reports & Analytics' },
      ]
    },
    {
      title: 'SYSTEM',
      items: [
        { id: 'settings', icon: 'settings', label: 'Settings' },
      ]
    }
  ];

  const NAV_ITEMS = NAV_GROUPS.flatMap(g => g.items);

  return (
    <>
      {/* Slide-Over Off-Canvas Mobile Navigation Drawer */}
      {mobDrawerOpen && (
        <div className="admin-mob-drawer-overlay" onClick={() => setMobDrawerOpen(false)}>
          <div className="admin-mob-drawer" onClick={e => e.stopPropagation()}>
            <div className="admin-mob-drawer-head">
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src="/logo.png"
                  alt="Gupta Store"
                  style={{ width: 36, height: 36, borderRadius: '10px', background: '#fff', padding: 2 }}
                />
                <div>
                  <strong style={{ fontSize: '1.05rem', color: '#fff', display: 'block' }}>Gupta Store</strong>
                  <small style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.72rem' }}>Executive Admin</small>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setMobDrawerOpen(false)}
                style={{ background: 'none', border: 'none', color: '#fff', fontSize: '1.3rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div className="admin-mob-drawer-body">
              {NAV_GROUPS.map(group => (
                <div key={group.title} className="admin-drawer-group" style={{ marginBottom: '0.85rem' }}>
                  <div className="admin-drawer-sec-title">{group.title}</div>
                  {group.items.map(n => (
                    <button
                      key={n.id}
                      className={`admin-drawer-item ${tab === n.id ? 'active' : ''}`}
                      onClick={() => { setTab(n.id); setMobDrawerOpen(false); }}
                    >
                      <span className="admin-drawer-icon"><AppIcon name={n.icon} size={18} /></span>
                      <span className="admin-drawer-label">{n.label}</span>
                      {n.badge > 0 && <span className="admin-drawer-badge">{n.badge}</span>}
                    </button>
                  ))}
                </div>
              ))}
            </div>

            <div className="admin-mob-drawer-footer">
              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-danger btn-sm"
                style={{ width: '100%', borderRadius: '10px', padding: '0.65rem', justifyContent: 'center', fontWeight: 700 }}
              >
                <AppIcon name="logout" size={15} /> Logout Admin Session
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="admin-layout" style={{minHeight:'100vh'}}>
      {/* Toast */}
      {toast && (
        <div style={{position:'fixed',bottom:'1.5rem',right:'1.5rem',zIndex:9999,background:toast.type==='error'?'var(--red)':'var(--green)',color:'#fff',padding:'0.85rem 1.5rem',borderRadius:'var(--radius-md)',boxShadow:'var(--shadow-lg)',fontWeight:700,fontSize:'0.88rem',animation:'toastIn 0.3s cubic-bezier(0.34,1.56,0.64,1)'}}>
          {toast.msg}
        </div>
      )}

      {/* Sidebar */}
      <div className="admin-sidebar">
        <div className="sidebar-logo">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/logo.png"
              alt="Gupta Store Logo"
              style={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                objectFit: 'contain',
                background: '#ffffff',
                padding: '2px',
                boxShadow: '0 2px 6px rgba(0,0,0,0.2)'
              }}
            />
            <div>
              <h2 style={{ fontSize: '1.15rem', margin: 0 }}>Gupta <span>Store</span></h2>
              <p style={{ fontSize: '0.72rem', margin: 0, opacity: 0.75 }}>Admin Panel</p>
            </div>
          </div>
          <div className="sidebar-workspace"><span className="sidebar-live-dot" /> Store operations <span>Owner</span></div>
        </div>
        <nav className="sidebar-nav">
          {NAV_GROUPS.map(group => (
            <div key={group.title} className="sidebar-group" style={{ marginBottom: '0.65rem' }}>
              <div className="sidebar-section-label">{group.title}</div>
              {group.items.map(n => (
                <button key={n.id} className={`nav-item ${tab === n.id ? 'active' : ''}`} onClick={() => setTab(n.id)}>
                  <span className="nav-item-icon"><AppIcon name={n.icon} size={16} /></span>
                  <span className="nav-item-label">{n.label}</span>
                  {n.badge > 0 && <span className="nav-item-badge">{n.badge}</span>}
                </button>
              ))}
            </div>
          ))}
          <div className="sidebar-footer">
            <div className="sidebar-store-status"><span className="sidebar-live-dot" /><div><strong>Store is online</strong><small>Ready to receive orders</small></div></div>
            <Link
              href="/"
              target="_blank"
              className="nav-item"
              style={{ textDecoration: 'none' }}
              title="Open customer storefront in a new tab"
            >
              <span className="nav-item-icon"><AppIcon name="shop" size={15} /></span>
              <span className="nav-item-label">View Storefront ↗</span>
            </Link>
            <button type="button" className="nav-item" onClick={toggleAdminTheme} title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
              <span className="nav-item-icon"><AppIcon name={isDark ? 'sun' : 'moon'} size={15} /></span>
              <span className="nav-item-label">{isDark ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
            <button className="nav-item" onClick={handleLogout}>
              <span className="nav-item-icon"><AppIcon name="logout" size={15} /></span> Logout
            </button>
          </div>
        </nav>
      </div>

      {/* Main content */}
      <div className="admin-content">
        {/* Mobile Top Navigation Bar */}
        <div className="admin-mobile-top-bar">
          <div className="admin-mob-top-brand">
            <button
              type="button"
              className="admin-mob-hamburger-btn"
              onClick={() => setMobDrawerOpen(true)}
              aria-label="Open Navigation Drawer"
              title="Navigation Menu (☰)"
            >
              <span className="admin-mob-ham-bar" />
              <span className="admin-mob-ham-bar" />
              <span className="admin-mob-ham-bar" />
            </button>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/logo.png" alt="Gupta Store" className="admin-mob-top-logo" />
            <div className="admin-mob-top-title">
              <span>Gupta Store</span>
              <span className="admin-mob-top-tab-pill">{NAV_ITEMS.find(n => n.id === tab)?.label || 'Dashboard'}</span>
            </div>
          </div>

          <div className="admin-mob-top-actions">
            <button
              type="button"
              className="admin-mob-top-btn"
              onClick={refresh}
              disabled={refreshing}
              title="Refresh Data"
              aria-label="Refresh Data"
            >
              <AppIcon name="refresh" size={16} className={refreshing ? 'spin' : ''} />
            </button>
            <button
              type="button"
              className="admin-mob-top-btn"
              onClick={() => setTab('notifications')}
              title="Notifications"
              aria-label="Notifications"
            >
              <AppIcon name="bell" size={16} />
              {notificationRows.length > 0 && (
                <span className="admin-mob-top-badge">{notificationRows.length}</span>
              )}
            </button>
            <button
              type="button"
              className="admin-mob-avatar-btn"
              onClick={() => setAdminProfileDropdownOpen(v => !v)}
              aria-label="Admin Profile Menu"
            >
              AG
            </button>

          </div>
        </div>

        {/* Global Executive Admin Profile Modal / Backdrop */}
        {adminProfileDropdownOpen && (
          <div
            className="admin-profile-backdrop"
            onClick={() => setAdminProfileDropdownOpen(false)}
            role="dialog"
            aria-modal="true"
            aria-label="Admin Profile Menu"
          >
            <div
              className="admin-profile-modal"
              onClick={e => e.stopPropagation()}
            >
              {/* Profile Card Header */}
              <div className="admin-profile-card-header">
                <div className="admin-profile-avatar-large">AG</div>
                <div className="admin-profile-user-details">
                  <div className="admin-profile-user-name">Akshay Gupta</div>
                  <div className="admin-profile-user-role">
                    <span className="admin-profile-role-badge">Store Owner</span>
                    <span className="admin-profile-loc">• Bakani</span>
                  </div>
                  <div className="admin-profile-status-pill">
                    <span className="admin-profile-status-dot" />
                    <span>Store Live & Accepting Orders</span>
                  </div>
                </div>
                <button
                  type="button"
                  className="admin-profile-close-btn"
                  onClick={() => setAdminProfileDropdownOpen(false)}
                  aria-label="Close Profile Menu"
                >
                  ✕
                </button>
              </div>

              {/* Quick Info Metrics Grid */}
              <div className="admin-profile-info-grid">
                <div className="admin-profile-info-item">
                  <span className="admin-profile-info-lbl">Store Status</span>
                  <span className="admin-profile-info-val green">Active</span>
                </div>
                <div className="admin-profile-info-item">
                  <span className="admin-profile-info-lbl">Products</span>
                  <span className="admin-profile-info-val">{products.length} SKUs</span>
                </div>
                <div className="admin-profile-info-item">
                  <span className="admin-profile-info-lbl">Orders</span>
                  <span className="admin-profile-info-val orange">{orders.length} Total</span>
                </div>
              </div>

              <div className="admin-profile-divider" />

              {/* Action Links */}
              <div className="admin-profile-menu-list">
                <Link
                  href="/"
                  target="_blank"
                  className="admin-profile-action-btn"
                  onClick={() => setAdminProfileDropdownOpen(false)}
                >
                  <span className="admin-profile-action-icon blue"><AppIcon name="shop" size={17} /></span>
                  <div className="admin-profile-action-text">
                    <strong>Customer Storefront</strong>
                    <small>View live website in new tab ↗</small>
                  </div>
                </Link>

                <button
                  type="button"
                  className="admin-profile-action-btn"
                  onClick={() => { toggleAdminTheme(); setAdminProfileDropdownOpen(false); }}
                >
                  <span className="admin-profile-action-icon yellow"><AppIcon name={isDark ? 'sun' : 'moon'} size={17} /></span>
                  <div className="admin-profile-action-text">
                    <strong>{isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}</strong>
                    <small>{isDark ? 'Comfortable day appearance' : 'High contrast night appearance'}</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-profile-action-btn"
                  onClick={() => { setTab('settings'); setAdminProfileDropdownOpen(false); }}
                >
                  <span className="admin-profile-action-icon purple"><AppIcon name="settings" size={17} /></span>
                  <div className="admin-profile-action-text">
                    <strong>Admin Settings & Security</strong>
                    <small>Password, store info & policies</small>
                  </div>
                </button>

                <button
                  type="button"
                  className="admin-profile-action-btn"
                  onClick={() => { setTab('notifications'); setAdminProfileDropdownOpen(false); }}
                >
                  <span className="admin-profile-action-icon orange"><AppIcon name="bell" size={17} /></span>
                  <div className="admin-profile-action-text">
                    <strong>Store Notifications</strong>
                    <small>{notificationRows.length > 0 ? `${notificationRows.length} unread alerts` : 'Order & stock updates'}</small>
                  </div>
                  {notificationRows.length > 0 && (
                    <span className="admin-profile-notif-count">{notificationRows.length}</span>
                  )}
                </button>
              </div>

              <div className="admin-profile-divider" />

              {/* Logout Action */}
              <button
                type="button"
                className="admin-profile-logout-btn"
                onClick={() => { setAdminProfileDropdownOpen(false); handleLogout(); }}
              >
                <AppIcon name="logout" size={16} />
                <span>Logout Admin Portal</span>
              </button>
            </div>
          </div>
        )}

        {/* Mobile Bottom Navigation Bar (4 Primary Tabs) */}
        <div className="admin-mobile-bottom-bar">
          <button
            type="button"
            className={`admin-mob-bottom-item ${tab === 'dashboard' ? 'active' : ''}`}
            onClick={() => setTab('dashboard')}
          >
            <AppIcon name="barChart" size={19} />
            <span className="admin-mob-bottom-label">Overview</span>
          </button>
          <button
            type="button"
            className={`admin-mob-bottom-item ${tab === 'orders' ? 'active' : ''}`}
            onClick={() => setTab('orders')}
          >
            <AppIcon name="package" size={19} />
            <span className="admin-mob-bottom-label">Orders</span>
            {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length > 0 && (
              <span className="admin-mob-bottom-badge">
                {orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length}
              </span>
            )}
          </button>
          <button
            type="button"
            className={`admin-mob-bottom-item ${tab === 'products' ? 'active' : ''}`}
            onClick={() => setTab('products')}
          >
            <AppIcon name="shop" size={19} />
            <span className="admin-mob-bottom-label">Products</span>
          </button>
          <button
            type="button"
            className={`admin-mob-bottom-item ${!['dashboard', 'orders', 'products'].includes(tab) ? 'active' : ''}`}
            onClick={() => setMobDrawerOpen(true)}
          >
            <AppIcon name="grid" size={19} />
            <span className="admin-mob-bottom-label">More</span>
            {(messages.filter(m => m.status === 'unread').length > 0 || notificationRows.length > 0) && (
              <span className="admin-mob-bottom-badge">●</span>
            )}
          </button>
        </div>

        {/* ── GLOBAL EXECUTIVE DESKTOP TOPBAR (High-Craft SaaS Header - Dashboard Only) ── */}
        {tab === 'dashboard' && (
          <header className="pro-topbar hidden md:flex">
            {/* Left: Breadcrumbs & Live Store Status */}
            <div className="pro-topbar-left">
              <div className="pro-topbar-breadcrumb">
                <span className="pro-topbar-brand">Gupta Store</span>
                <span className="pro-topbar-sep">/</span>
                <span className="pro-topbar-current">
                  Dashboard
                </span>
              </div>
              <span className="pro-topbar-live-badge">
                <span className="pro-topbar-live-dot" />
                <span>Store Live (Bakani)</span>
              </span>
            </div>

            {/* Center: Global Quick Search Bar */}
            <div className="pro-topbar-search-wrap">
              <span className="pro-topbar-search-icon">
                <AppIcon name="search" size={16} />
              </span>
              <input
                ref={searchInputRef}
                type="text"
                placeholder="Search orders, products, customers..."
                value={adminGlobalSearch}
                onChange={e => setAdminGlobalSearch(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && adminGlobalSearch.trim()) {
                    const q = adminGlobalSearch.trim();
                    if (q.startsWith('#') || q.toUpperCase().startsWith('GGS') || /^\d{5,}$/.test(q)) {
                      setOrderSearch(q);
                      setTab('orders');
                    } else {
                      setProdSearch(q);
                      setTab('products');
                    }
                  }
                }}
                className="pro-topbar-search-input"
              />
              <div className="pro-topbar-search-kbd">
                {adminGlobalSearch && (
                  <button
                    type="button"
                    onClick={() => setAdminGlobalSearch('')}
                    style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: '2px', fontSize: '11px', fontWeight: 'bold' }}
                    title="Clear search"
                  >
                    ✕
                  </button>
                )}
                <kbd className="pro-topbar-kbd-pill">
                  Ctrl K
                </kbd>
              </div>
            </div>

            {/* Right: Quick Action, Theme, Refresh & Profile */}
            <div className="pro-topbar-right">
              <button
                type="button"
                onClick={() => { setNewProductOpen(true); setTab('products'); }}
                className="pro-topbar-btn-add"
              >
                <span style={{ fontSize: '1rem', lineHeight: 1, fontWeight: 900 }}>+</span>
                <span>Add Product</span>
              </button>
              <button
                type="button"
                onClick={toggleAdminTheme}
                title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
                className="pro-topbar-icon-btn"
              >
                <AppIcon name={isDark ? 'sun' : 'moon'} size={16} />
              </button>
              <button
                type="button"
                onClick={refresh}
                disabled={refreshing}
                title="Refresh All Store Data"
                className="pro-topbar-icon-btn"
              >
                <AppIcon name="refresh" size={16} className={refreshing ? 'animate-spin' : ''} />
              </button>
              <div
                onClick={() => setAdminProfileDropdownOpen(v => !v)}
                className="pro-topbar-profile-pill"
              >
                <div className="pro-topbar-avatar">
                  MS
                </div>
                <div className="pro-topbar-profile-info hidden xl:flex">
                  <div className="pro-topbar-name">M.S. Gupta</div>
                  <div className="pro-topbar-role">Owner</div>
                </div>
                <AppIcon name="logout" size={12} style={{ color: '#94a3b8', transform: 'rotate(180deg)' }} />
              </div>
            </div>
          </header>
        )}

        {/* ── DASHBOARD (Proper Professional Stripe-Quality Dashboard) ── */}
        {tab === 'dashboard' && (() => {
          const activeAnalytics = analytics || getAnalyticsForOrders(orders);
          const pendingOrdersCount = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
          const lowStockCount = products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length;

          return (
            <div className="pro-dashboard">
              {/* Executive Welcome Strip */}
              <div className="pro-welcome-strip">
                <div>
                  <h1 className="pro-welcome-title">Welcome, M.S. Gupta</h1>
                  <p className="pro-welcome-sub">
                    📅 {new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })} • 🟢 Store Live (Bakani) — Daily stationery store operations.
                  </p>
                </div>
                <div className="pro-welcome-actions">
                  <button className="pro-btn-subtle" onClick={exportOrdersCSV}>
                    📥 Export Orders CSV
                  </button>
                  <button className="pro-btn-primary" onClick={() => { setOrderFilter('all'); setTab('orders'); }}>
                    📦 Manage Orders ({orders.length})
                  </button>
                </div>
              </div>

              {/* 4 Clean, Unified Metric Cards (Proper Business Admin System) */}
              <div className="pro-kpi-grid">
                <div className="pro-kpi-card" onClick={() => setTab('analytics')} style={{ cursor: 'pointer' }}>
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">TOTAL REVENUE</span>
                    <div className="pro-kpi-icon green"><AppIcon name="credit" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{formatCurrency(activeAnalytics.totalRevenue || 0)}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill green">● Verified</span>
                    <span className="pro-kpi-note">{orders.filter(o => o.status !== 'cancelled').length} orders fulfilled</span>
                  </div>
                </div>

                <div className="pro-kpi-card" onClick={() => { setOrderFilter('all'); setTab('orders'); }} style={{ cursor: 'pointer' }}>
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">TOTAL ORDERS</span>
                    <div className="pro-kpi-icon blue"><AppIcon name="package" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{orders.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill blue">All time</span>
                    <span className="pro-kpi-note">{orders.filter(o => o.status === 'delivered').length} delivered</span>
                  </div>
                </div>

                <div className="pro-kpi-card" onClick={() => { setOrderFilter('placed'); setTab('orders'); }} style={{ cursor: 'pointer' }}>
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">PENDING ORDERS</span>
                    <div className="pro-kpi-icon orange"><AppIcon name="clock" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{pendingOrdersCount}</div>
                  <div className="pro-kpi-meta">
                    {pendingOrdersCount > 0 ? (
                      <span className="pro-badge-pill orange">⚠️ {pendingOrdersCount} to dispatch</span>
                    ) : (
                      <span className="pro-badge-pill green">✓ All fulfilled</span>
                    )}
                    <span className="pro-kpi-note">Needs packaging</span>
                  </div>
                </div>

                <div className="pro-kpi-card" onClick={() => setTab('products')} style={{ cursor: 'pointer' }}>
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">TOTAL PRODUCTS</span>
                    <div className="pro-kpi-icon purple"><AppIcon name="shop" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{products.length}</div>
                  <div className="pro-kpi-meta">
                    {lowStockCount > 0 ? (
                      <span className="pro-badge-pill warning">{lowStockCount} low stock</span>
                    ) : (
                      <span className="pro-badge-pill green">✓ Healthy stock</span>
                    )}
                    <span className="pro-kpi-note">Active SKUs</span>
                  </div>
                </div>
              </div>

              {/* Main Content Grid: Balanced 2-Column SaaS Layout */}
              <div className="pro-grid-layout">
                {/* Left Column: Recent Orders + Wishlist Demand Leaderboard */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', minWidth: 0, width: '100%', maxWidth: '100%', boxSizing: 'border-box' }}>
                  <div className="pro-card pro-card-orders">
                    <div className="pro-card-head">
                      <div>
                        <h2 className="pro-card-title">Recent Customer Orders</h2>
                        <p className="pro-card-sub">Recent orders placed on the storefront requiring packaging and delivery</p>
                      </div>
                      <button className="pro-card-link" onClick={() => setTab('orders')}>
                        View all orders ({orders.length}) →
                      </button>
                    </div>

                    <div className="admin-orders-desktop-table hidden md:block" style={{ overflowX: 'auto', width: '100%' }}>
                      <table className="pro-table">
                        <thead>
                          <tr>
                            <th style={{ whiteSpace: 'nowrap' }}>Order</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Customer</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Items</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Amount</th>
                            <th style={{ whiteSpace: 'nowrap' }}>Status</th>
                            <th style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {orders.slice(0, 6).map(o => {
                            const st = statusInfo(o.status);
                            const initial = (o.address?.name || 'Customer').charAt(0).toUpperCase();
                            return (
                              <tr key={o.orderId}>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <strong className="pro-order-code" onClick={() => { setSelOrder(o); setNewStatus(o.status); setTab('orders'); }}>
                                    #{o.orderId}
                                  </strong>
                                  <div className="pro-table-time" style={{ whiteSpace: 'nowrap' }}>{formatDate(o.createdAt)}</div>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem' }}>
                                    {(() => {
                                    const avStyle = getAvatarColor(o.address?.name || 'Customer');
                                    return (
                                      <div className="pro-user-avatar-small" style={{ background: avStyle.bg, color: avStyle.color }}>
                                        {initial}
                                      </div>
                                    );
                                  })()}
                                    <div style={{ minWidth: 0 }}>
                                      <div style={{ fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap' }}>{o.address?.name || 'Customer'}</div>
                                      <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{o.address?.phone || o.phone || 'N/A'}</div>
                                    </div>
                                  </div>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <span className="pro-items-badge" style={{ whiteSpace: 'nowrap' }}>{(o.items || []).length} {(o.items || []).length === 1 ? 'item' : 'items'}</span>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <strong style={{ color: 'var(--green-dark)', fontSize: '0.9rem', display: 'block', whiteSpace: 'nowrap' }}>{formatCurrency(o.total)}</strong>
                                  <div style={{ fontSize: '0.68rem', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>COD Payment</div>
                                </td>
                                <td style={{ whiteSpace: 'nowrap' }}>
                                  <span className="pro-status-tag" style={{ background: `${st.color}15`, color: st.color, borderColor: `${st.color}35`, whiteSpace: 'nowrap' }}>
                                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: st.color, display: 'inline-block' }} />
                                    {st.label}
                                  </span>
                                </td>
                                <td style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                                  <button className="pro-btn-action" style={{ whiteSpace: 'nowrap' }} onClick={() => { setSelOrder(o); setNewStatus(o.status); setTab('orders'); }}>
                                    View Details
                                  </button>
                                </td>
                              </tr>
                            );
                          })}
                          {orders.length === 0 && (
                            <tr>
                              <td colSpan={6} style={{ textAlign: 'center', padding: '3.5rem 1rem', color: 'var(--text-muted)' }}>
                                <div style={{ fontSize: '2.2rem', marginBottom: '0.4rem' }}>📦</div>
                                <strong style={{ display: 'block', fontSize: '0.95rem', color: 'var(--text-primary)' }}>No customer orders placed yet</strong>
                                <span style={{ fontSize: '0.8rem' }}>Orders placed on the storefront will appear here instantly.</span>
                              </td>
                            </tr>
                          )}
                        </tbody>
                      </table>
                    </div>

                    {/* Mobile Admin Recent Orders Feed - 100% Responsive & Zero Cut-off */}
                    <div className="admin-orders-mobile-list md:hidden flex flex-col gap-3 w-full">
                      {orders.slice(0, 5).map(o => {
                        const st = statusInfo(o.status);
                        const isDelivered = o.status === 'delivered';
                        const isCancelled = o.status === 'cancelled';
                        const isCod = String(o.payment || 'cod').toLowerCase() === 'cod';

                        const statusBorderClass =
                          o.status === 'delivered' ? 'border-l-4 border-l-emerald-500' :
                          o.status === 'cancelled' ? 'border-l-4 border-l-rose-500' :
                          o.status === 'confirmed' ? 'border-l-4 border-l-purple-500' :
                          o.status === 'shipped' || o.status === 'out_for_delivery' ? 'border-l-4 border-l-orange-500' :
                          o.status === 'packed' ? 'border-l-4 border-l-amber-500' :
                          'border-l-4 border-l-blue-500';

                        return (
                          <div
                            key={o.orderId}
                            className={`bg-white dark:bg-slate-800 rounded-xl shadow-sm border border-slate-200 dark:border-slate-700 p-3.5 space-y-2.5 w-full box-border ${statusBorderClass}`}
                          >
                            {/* 1. Header: Order ID + Status Badge */}
                            <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-700/60 gap-2">
                              <div className="min-w-0 flex-1">
                                <span className="font-mono font-bold text-orange-600 dark:text-orange-400 text-xs sm:text-sm tracking-wide">
                                  #{o.orderId}
                                </span>
                                <span className="block text-[11px] text-slate-400 dark:text-slate-400 mt-0.5 truncate">
                                  📅 {formatDate(o.createdAt || o.created_at || o.date)}
                                </span>
                              </div>
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border flex-shrink-0 ${
                                  isDelivered
                                    ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800'
                                    : isCancelled
                                    ? 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/40 dark:text-rose-400 dark:border-rose-800'
                                    : 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-950/40 dark:text-orange-400 dark:border-orange-800'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isDelivered ? 'bg-emerald-500' : isCancelled ? 'bg-rose-500' : 'bg-orange-500'
                                  }`}
                                />
                                {st.label}
                              </span>
                            </div>

                            {/* 2. Customer & Financial Info */}
                            <div className="flex items-center justify-between text-xs sm:text-sm gap-2">
                              <div className="min-w-0 flex-1">
                                <strong className="text-slate-900 dark:text-slate-100 font-bold block truncate">
                                  {o.address?.name || o.customerName || 'Customer'}
                                </strong>
                                <span className="text-[11px] text-slate-500 dark:text-slate-400 block truncate mt-0.5">
                                  📍 {o.address?.area || 'Bakani'} • {o.address?.phone || o.phone || o.customerPhone || 'No Phone'}
                                </span>
                              </div>
                              <div className="text-right flex-shrink-0">
                                <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm sm:text-base block">
                                  {formatCurrency(o.total)}
                                </span>
                                <span className={`text-[10px] font-bold uppercase tracking-wider px-1.5 py-0.5 rounded ${
                                  isCod
                                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
                                    : 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                                }`}>
                                  {isCod ? 'COD' : 'ONLINE'}
                                </span>
                              </div>
                            </div>

                            {/* 3. Items Summary */}
                            <div className="text-[11px] text-slate-600 dark:text-slate-300 bg-slate-50 dark:bg-slate-900/60 rounded-lg px-2.5 py-1.5 flex items-center gap-1.5 min-w-0 border border-slate-100 dark:border-slate-800">
                              <span className="text-orange-600 dark:text-orange-400 font-bold flex-shrink-0">
                                📦 {(o.items || []).length || 1} item{((o.items || []).length || 1) > 1 ? 's' : ''}:
                              </span>
                              <span className="truncate text-slate-500 dark:text-slate-400">
                                {(o.items || []).map(i => i.name).slice(0, 3).join(', ') || 'Stationery Package'}
                              </span>
                            </div>

                            {/* 4. Action Buttons */}
                            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 dark:border-slate-700/60">
                              {(o.address?.phone || o.customerPhone) && (
                                <a
                                  href={`https://wa.me/${String(o.address?.phone || o.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Namaskar ${o.address?.name || o.customerName || ''}! Gupta Store se aapke Order #${o.orderId} ka status: ${st.label}`)}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="p-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-600 dark:bg-emerald-950/50 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800 rounded-lg transition-colors flex items-center justify-center flex-shrink-0"
                                  title="WhatsApp Customer"
                                  aria-label="WhatsApp Customer"
                                >
                                  <AppIcon name="message" size={16} />
                                </a>
                              )}
                              <button
                                type="button"
                                onClick={() => { setSelOrder(o); setNewStatus(o.status); setTab('orders'); }}
                                className="flex-1 py-2 px-3 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition-all text-center flex items-center justify-center gap-1 min-h-[36px]"
                              >
                                Manage Order →
                              </button>
                            </div>
                          </div>
                        );
                      })}
                      {orders.length === 0 && (
                        <div className="text-center py-8 px-4 bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700">
                          <div className="text-3xl mb-1">📦</div>
                          <strong className="text-sm text-slate-800 dark:text-slate-200 block">No orders yet</strong>
                          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">Customer orders will appear here in real-time.</p>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right: Sales Performance & Store Operations */}
                <div className="pro-sidebar-col">
                  {/* Clean Revenue Bar Chart with 7D / 30D Filter */}
                  {(() => {
                    const daysCount = chartDays === '30d' ? 30 : 7;
                    const today = new Date();
                    const chartPoints = Array.from({ length: daysCount }, (_, i) => {
                      const d = new Date(today);
                      d.setDate(d.getDate() - (daysCount - 1 - i));
                      const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });
                      const dayOrders = orders.filter(o => {
                        const od = new Date(o.createdAt);
                        return od.toDateString() === d.toDateString() && o.status !== 'cancelled';
                      });
                      return {
                        label,
                        revenue: dayOrders.reduce((a, o) => a + (o.total || 0), 0),
                        count: dayOrders.length
                      };
                    });
                    const totalChartRev = chartPoints.reduce((sum, d) => sum + (d.revenue || 0), 0);
                    const maxRev = Math.max(...chartPoints.map(x => x.revenue), 100);

                    return (
                      <div className="pro-card">
                        <div className="pro-card-head" style={{ alignItems: 'flex-start' }}>
                          <div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                              <h2 className="pro-card-title">Sales Analytics</h2>
                              <div style={{ display: 'inline-flex', background: '#f1f5f9', padding: '2px', borderRadius: '8px' }}>
                                <button
                                  type="button"
                                  onClick={() => setChartDays('7d')}
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: chartDays === '7d' ? '#ffffff' : 'transparent',
                                    color: chartDays === '7d' ? '#ea580c' : '#64748b',
                                    boxShadow: chartDays === '7d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  7D
                                </button>
                                <button
                                  type="button"
                                  onClick={() => setChartDays('30d')}
                                  style={{
                                    padding: '0.2rem 0.55rem',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    borderRadius: '6px',
                                    border: 'none',
                                    cursor: 'pointer',
                                    background: chartDays === '30d' ? '#ffffff' : 'transparent',
                                    color: chartDays === '30d' ? '#ea580c' : '#64748b',
                                    boxShadow: chartDays === '30d' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none'
                                  }}
                                >
                                  30D
                                </button>
                              </div>
                            </div>
                            <p className="pro-card-sub">{chartDays === '7d' ? 'Last 7 days' : 'Last 30 days'} verified revenue trend</p>
                          </div>
                          <strong style={{ color: 'var(--green-dark)', fontSize: '1.1rem' }}>
                            {formatCurrency(totalChartRev)}
                          </strong>
                        </div>

                        <div className="pro-chart-box">
                          <div className="pro-chart-bars-wrap" style={{ gap: chartDays === '30d' ? '2px' : '0.5rem' }}>
                            {chartPoints.map((d, i) => {
                              const hasRev = d.revenue > 0;
                              const h = hasRev ? Math.max((d.revenue / maxRev) * 100, 22) : 0;
                              return (
                                <div key={i} className="pro-chart-col" title={`${d.label}: ₹${d.revenue} (${d.count} orders)`}>
                                  <span className={`pro-chart-val ${hasRev ? 'has-rev' : ''}`} style={{ fontSize: chartDays === '30d' ? '0.55rem' : '0.65rem' }}>
                                    {hasRev ? `₹${d.revenue}` : ''}
                                  </span>
                                  <div className="pro-chart-track" style={{ maxWidth: chartDays === '30d' ? '12px' : '24px' }}>
                                    <div
                                      className={`pro-chart-bar ${hasRev ? 'active' : 'idle'}`}
                                      style={{ height: hasRev ? `${h}%` : '4px' }}
                                    />
                                  </div>
                                  <span className={`pro-chart-date ${hasRev ? 'has-rev' : ''}`} style={{ fontSize: chartDays === '30d' ? '0.55rem' : '0.65rem' }}>
                                    {chartDays === '30d' ? (i % 5 === 0 ? d.label.split(' ')[0] : '') : d.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      </div>
                    );
                  })()}

                  {/* Low Stock Operational Alerts */}
                  {lowStockCount > 0 && (
                    <div className="pro-card" style={{ borderLeft: '4px solid #f59e0b' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.65rem' }}>
                        <h3 style={{ fontSize: '0.88rem', fontWeight: 800, color: '#b45309', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <span>⚠️</span> Low Stock Alerts ({lowStockCount})
                        </h3>
                        <button
                          type="button"
                          onClick={() => setTab('inventory')}
                          style={{ fontSize: '0.75rem', fontWeight: 700, color: '#f97316', background: 'none', border: 'none', cursor: 'pointer' }}
                        >
                          Inventory Control →
                        </button>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.45rem' }}>
                        {products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).slice(0, 3).map(p => (
                          <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.45rem 0.65rem', background: '#fefce8', borderRadius: '8px', fontSize: '0.78rem' }}>
                            <div>
                              <strong style={{ color: '#0f172a' }}>{p.name}</strong>
                              <span style={{ color: '#b45309', marginLeft: '0.5rem', fontWeight: 700 }}>Only {p.stock} left</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => handleStockUpdate(p.id, Number(p.stock || 0) + 10)}
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem', fontWeight: 700, background: '#f97316', color: '#fff', border: 'none', borderRadius: '6px', cursor: 'pointer' }}
                              title="Add +10 stock instantly"
                            >
                              +10 Restock
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Compact Quick Operations List */}
                  <div className="pro-card">
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.25rem' }}>
                      <h2 className="pro-card-title" style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: 26, height: 26, borderRadius: 8, background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange)' }}>
                          ⚡
                        </span>
                        Store Operations
                      </h2>
                      <span style={{ fontSize: '0.68rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Quick Shortcuts
                      </span>
                    </div>
                    <p className="pro-card-sub" style={{ marginBottom: '0.95rem' }}>Direct management shortcuts for orders, catalog, stock & coupons</p>

                    <div className="pro-quick-list">
                      <button className="pro-quick-row" onClick={() => setTab('orders')}>
                        <span className="pro-quick-icon orange"><AppIcon name="package" size={17} /></span>
                        <div className="pro-quick-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <strong>Pending Orders</strong>
                            <span className="pro-quick-chip orange">{pendingOrdersCount} pending</span>
                          </div>
                          <small>{pendingOrdersCount} orders need packaging & dispatch</small>
                        </div>
                        <span className="pro-quick-arrow"><AppIcon name="arrowRight" size={14} /></span>
                      </button>

                      <button className="pro-quick-row" onClick={() => setNewProductOpen(true)}>
                        <span className="pro-quick-icon green"><AppIcon name="plus" size={17} /></span>
                        <div className="pro-quick-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <strong>Add New Product</strong>
                            <span className="pro-quick-chip green">+ New SKU</span>
                          </div>
                          <small>List a stationery item, book, or gift supply</small>
                        </div>
                        <span className="pro-quick-arrow"><AppIcon name="arrowRight" size={14} /></span>
                      </button>

                      <button className="pro-quick-row" onClick={() => setTab('inventory')}>
                        <span className="pro-quick-icon purple"><AppIcon name="clipboard" size={17} /></span>
                        <div className="pro-quick-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <strong>Stock & Inventory</strong>
                            <span className="pro-quick-chip purple">{products.length} SKUs</span>
                          </div>
                          <small>{lowStockCount > 0 ? `${lowStockCount} items low stock` : 'All inventory levels healthy'}</small>
                        </div>
                        <span className="pro-quick-arrow"><AppIcon name="arrowRight" size={14} /></span>
                      </button>

                      <button className="pro-quick-row" onClick={() => setTab('coupons')}>
                        <span className="pro-quick-icon yellow"><AppIcon name="tag" size={17} /></span>
                        <div className="pro-quick-info">
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem' }}>
                            <strong>Discount Coupons</strong>
                            <span className="pro-quick-chip yellow">{Object.keys(couponCodes || {}).length} Active</span>
                          </div>
                          <small>Promotional discount codes & festive offers</small>
                        </div>
                        <span className="pro-quick-arrow"><AppIcon name="arrowRight" size={14} /></span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── ORDERS (Tailwind Enterprise Edition) ── */}
        {tab === 'orders' && (() => {
          const activeOrders = orders.filter(o => !['delivered', 'cancelled'].includes(o.status));
          const deliveredOrders = orders.filter(o => o.status === 'delivered');
          const cancelledOrders = orders.filter(o => o.status === 'cancelled');

          const qOrder = (deferredOrderSearch || '').toLowerCase().trim();
          const filteredOrders = orders.filter(o => {
            if (orderFilter === 'active' && ['delivered', 'cancelled'].includes(o.status)) return false;
            if (orderFilter === 'delivered' && o.status !== 'delivered') return false;
            if (orderFilter === 'cancelled' && o.status !== 'cancelled') return false;

            if (qOrder) {
              const matchId = String(o.orderId || '').toLowerCase().includes(qOrder);
              const matchName = String(o.address?.name || o.customerName || '').toLowerCase().includes(qOrder);
              const matchPhone = String(o.address?.phone || o.phone || o.customerPhone || '').includes(qOrder);
              if (!matchId && !matchName && !matchPhone) return false;
            }
            return true;
          });

          return (
            <div className="space-y-6">
              {/* 1. Header & Actions Bar */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Customer Orders</h1>
                    <span className="pro-pill-badge orange">
                      {orders.length} Total
                    </span>
                    {activeOrders.length > 0 && (
                      <span className="pro-pill-badge red">
                        🔥 {activeOrders.length} Pending
                      </span>
                    )}
                  </div>
                  <p className="pro-page-sub">
                    Live customer order fulfillment, dispatch status and tracking management.
                  </p>
                </div>
                <div className="pro-page-actions">
                  <button
                    onClick={exportOrdersCSV}
                    title="Export all orders to CSV / Excel sheet"
                    className="pro-btn-subtle"
                  >
                    📥 <span>Export Orders CSV</span>
                  </button>
                  <button
                    onClick={refresh}
                    disabled={refreshing}
                    title="Refresh orders"
                    className={`pro-btn-subtle ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Orders'}</span>
                  </button>
                </div>
              </div>

              {/* 2. KPI Metric Cards */}
              <div className="pro-kpi-grid">
                <div
                  onClick={() => setOrderFilter('all')}
                  className="pro-kpi-card"
                  style={{ cursor: 'pointer', border: orderFilter === 'all' ? '2px solid var(--orange)' : '1px solid var(--border)' }}
                >
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">TOTAL ORDERS</span>
                    <div className="pro-kpi-icon"><AppIcon name="package" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{orders.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill">Store Total</span>
                    <span className="pro-kpi-note">All registered store orders</span>
                  </div>
                </div>

                <div
                  onClick={() => setOrderFilter('active')}
                  className="pro-kpi-card"
                  style={{ cursor: 'pointer', border: orderFilter === 'active' ? '2px solid var(--orange)' : '1px solid var(--border)' }}
                >
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--orange-dark)' }}>ACTIVE / PENDING</span>
                    <div className="pro-kpi-icon" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>🔥</div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--orange)' }}>{activeOrders.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>Dispatching</span>
                    <span className="pro-kpi-note">Needs packaging & dispatch</span>
                  </div>
                </div>

                <div
                  onClick={() => setOrderFilter('delivered')}
                  className="pro-kpi-card"
                  style={{ cursor: 'pointer', border: orderFilter === 'delivered' ? '2px solid var(--green)' : '1px solid var(--border)' }}
                >
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--green-dark)' }}>DELIVERED</span>
                    <div className="pro-kpi-icon green">✅</div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--green-dark)' }}>{deliveredOrders.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill green">Completed</span>
                    <span className="pro-kpi-note">Successfully delivered</span>
                  </div>
                </div>

                <div
                  onClick={() => setOrderFilter('cancelled')}
                  className="pro-kpi-card"
                  style={{ cursor: 'pointer', border: orderFilter === 'cancelled' ? '2px solid var(--red)' : '1px solid var(--border)' }}
                >
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--red)' }}>CANCELLED</span>
                    <div className="pro-kpi-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>❌</div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--red)' }}>{cancelledOrders.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>Cancelled</span>
                    <span className="pro-kpi-note">Cancelled by buyer / admin</span>
                  </div>
                </div>
              </div>

              {/* 3. Search & Active Filters Bar */}
              <div className="pro-filter-box">
                <div className="pro-search-row">
                  <div className="pro-search-input-wrap">
                    <span className="icon">
                      <AppIcon name="search" size={16} strokeWidth={2.2} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search by Order ID, customer name, phone number..."
                      value={orderSearch}
                      onChange={e => setOrderSearch(e.target.value)}
                      className="pro-search-input"
                    />
                    {orderSearch && (
                      <button
                        type="button"
                        onClick={() => setOrderSearch('')}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}
                        title="Clear search query"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                  {(orderSearch || orderFilter !== 'all') && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <span className="pro-pill-badge gray">
                        {filteredOrders.length} {filteredOrders.length === 1 ? 'order' : 'orders'} found
                      </span>
                      <button
                        type="button"
                        onClick={() => { setOrderSearch(''); setOrderFilter('all'); }}
                        className="pro-pill-badge red"
                        style={{ cursor: 'pointer' }}
                      >
                        ✕ Reset Filter
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* 4. Desktop Enterprise Data Table */}
              <div className="pro-table-card hidden md:block">
                <div className="pro-table-inner">
                  <table className="pro-data-table">
                    <thead>
                      <tr>
                        <th>Order ID</th>
                        <th>Customer</th>
                        <th>Phone</th>
                        <th>Items</th>
                        <th>Total Amount</th>
                        <th>Payment</th>
                        <th>Fulfillment Status</th>
                        <th>Date</th>
                        <th style={{ textAlign: 'right' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredOrders.map(o => {
                        const st = statusInfo(o.status);
                        const isDelivered = o.status === 'delivered';
                        const isCancelled = o.status === 'cancelled';
                        const isPending = !isDelivered && !isCancelled;

                        return (
                          <tr key={o.orderId} className="hover:bg-gray-50 transition-colors">
                            <td className="px-4 py-3.5 font-bold text-orange-600 whitespace-nowrap">
                              #{o.orderId}
                            </td>
                            <td className="px-4 py-3.5 font-semibold text-gray-900 whitespace-nowrap">
                              {o.address?.name || o.customerName || 'Guest Customer'}
                            </td>
                            <td className="px-4 py-3.5 text-gray-500 whitespace-nowrap">
                              {o.address?.phone || o.customerPhone || '—'}
                            </td>
                            <td className="px-4 py-3.5 text-gray-600 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700">
                                {o.items?.length || 1} item{((o.items?.length || 1) > 1) ? 's' : ''}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 font-bold text-gray-900 whitespace-nowrap">
                              {formatCurrency(o.total)}
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-bold uppercase tracking-wide bg-slate-100 text-slate-700">
                                {o.payment || 'COD'}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 whitespace-nowrap">
                              <span
                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                                  isDelivered
                                    ? 'bg-green-50 text-green-700 border-green-200'
                                    : isCancelled
                                    ? 'bg-red-50 text-red-700 border-red-200'
                                    : 'bg-orange-50 text-orange-700 border-orange-200'
                                }`}
                              >
                                <span
                                  className={`w-1.5 h-1.5 rounded-full ${
                                    isDelivered ? 'bg-green-500' : isCancelled ? 'bg-red-500' : 'bg-orange-500'
                                  }`}
                                />
                                {st.label}
                              </span>
                            </td>
                            <td className="px-4 py-3.5 text-xs text-gray-500 whitespace-nowrap">
                              {formatDate(o.createdAt)}
                            </td>
                            <td className="px-4 py-3.5 text-right whitespace-nowrap">
                              <div className="pro-action-group" style={{ justifyContent: 'flex-end' }}>
                                <button
                                  onClick={() => { setSelOrder(o); setNewStatus(o.status); }}
                                  className="pro-action-btn offer"
                                  style={{ padding: '0.45rem 0.95rem', fontSize: '0.8rem', fontWeight: 700 }}
                                >
                                  Manage
                                </button>
                                <button
                                  onClick={() => handleDeleteOrder(o.orderId)}
                                  className="pro-action-btn delete"
                                  style={{ padding: '0.4rem', borderRadius: '8px' }}
                                  title="Delete order"
                                >
                                  <AppIcon name="trash" size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                      {filteredOrders.length === 0 && (
                        <tr>
                          <td colSpan={9} className="px-4 py-12 text-center text-gray-500">
                            <div className="text-3xl mb-2">📦</div>
                            <strong className="block text-sm text-gray-900">No matching orders found</strong>
                            <span className="text-xs text-gray-500">Try adjusting your search query or filter criteria.</span>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Mobile Orders Card Feed */}
              <div className="md:hidden space-y-3.5">
                {filteredOrders.map(o => {
                  const st = statusInfo(o.status);
                  const isDelivered = o.status === 'delivered';
                  const isCancelled = o.status === 'cancelled';
                  const isCod = String(o.payment || 'cod').toLowerCase() === 'cod';

                  return (
                    <div key={o.orderId} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                      <div className="flex items-center justify-between pb-2 border-b border-gray-100">
                        <div>
                          <span className="font-bold text-orange-600 text-sm">#{o.orderId}</span>
                          <span className="block text-xs text-gray-400 mt-0.5">{formatDate(o.createdAt)}</span>
                        </div>
                        <span
                          className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${
                            isDelivered
                              ? 'bg-green-50 text-green-700 border-green-200'
                              : isCancelled
                              ? 'bg-red-50 text-red-700 border-red-200'
                              : 'bg-orange-50 text-orange-700 border-orange-200'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              isDelivered ? 'bg-green-500' : isCancelled ? 'bg-red-500' : 'bg-orange-500'
                            }`}
                          />
                          {st.label}
                        </span>
                      </div>

                      <div className="flex items-center justify-between text-sm">
                        <div>
                          <strong className="text-gray-900 block">{o.address?.name || o.customerName || 'Customer'}</strong>
                          <span className="text-xs text-gray-500">{o.address?.phone || o.customerPhone || 'No phone'}</span>
                        </div>
                        <div className="text-right">
                          <span className="font-extrabold text-gray-900 block">{formatCurrency(o.total)}</span>
                          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded">
                            {isCod ? 'COD' : 'ONLINE'}
                          </span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 pt-2">
                        {(o.address?.phone || o.customerPhone) && (
                          <a
                            href={`https://wa.me/${String(o.address?.phone || o.customerPhone).replace(/\D/g, '')}?text=${encodeURIComponent(`Namaskar ${o.address?.name || o.customerName || ''}! Gupta Store se aapke Order #${o.orderId} ka status: ${st.label}`)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="p-2 bg-green-50 text-green-600 hover:bg-green-100 border border-green-200 rounded-lg transition-colors flex items-center justify-center"
                            title="WhatsApp Customer"
                          >
                            <AppIcon name="message" size={16} />
                          </a>
                        )}
                        <button
                          type="button"
                          onClick={() => { setSelOrder(o); setNewStatus(o.status); }}
                          className="flex-1 py-2 px-3 bg-orange-500 hover:bg-orange-600 text-white rounded-lg text-xs font-semibold shadow-sm transition-all text-center"
                        >
                          Manage Order →
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* 6. Order Detail & Status Management Modal */}
              {selOrder && (
                <div className="pro-modal-overlay">
                  <div className="pro-modal-box">
                    {/* Modal Head */}
                    <div className="pro-modal-header">
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Order Details</span>
                        <h3 style={{ fontSize: '1.25rem', fontWeight: 900, color: '#ea580c', margin: '0.15rem 0 0' }}>#{selOrder.orderId}</h3>
                      </div>
                      <button
                        onClick={() => setSelOrder(null)}
                        className="pro-modal-close"
                        title="Close modal"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Customer & Delivery Summary Card */}
                    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '0.75rem', padding: '1rem', display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 1fr))', gap: '0.75rem', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Customer Name</span>
                        <strong style={{ color: '#0f172a', fontWeight: 800 }}>{selOrder.address?.name || selOrder.customerName}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Phone Number</span>
                        <strong style={{ color: '#0f172a', fontWeight: 800 }}>{selOrder.address?.phone || selOrder.customerPhone || '—'}</strong>
                      </div>
                      <div style={{ gridColumn: '1 / -1' }}>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Delivery Address</span>
                        <strong style={{ color: '#0f172a', fontWeight: 800 }}>{selOrder.address?.area} {selOrder.address?.pincode ? `(${selOrder.address.pincode})` : ''}</strong>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Payment Method</span>
                        <span className="pro-pill-badge gray">
                          {selOrder.payment?.toUpperCase() || 'COD'}
                        </span>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.75rem', fontWeight: 600, color: '#64748b', display: 'block' }}>Total Order Amount</span>
                        <strong style={{ color: '#047857', fontSize: '1.1rem', fontWeight: 900 }}>{formatCurrency(selOrder.total)}</strong>
                      </div>
                    </div>

                    {/* Items Table */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <h4 style={{ fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#64748b', marginBottom: '0.5rem' }}>
                        Ordered Items ({selOrder.items?.length || 0})
                      </h4>
                      <div className="pro-table-inner" style={{ overflowX: 'auto', marginBottom: 0, borderRadius: '10px', border: '1px solid #e2e8f0' }}>
                        <table className="pro-data-table pro-table-fit" style={{ minWidth: '100%', width: '100%' }}>
                          <thead>
                            <tr>
                              <th>Item Name</th>
                              <th style={{ textAlign: 'center' }}>Qty</th>
                              <th style={{ textAlign: 'right' }}>Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selOrder.items?.map((item, i) => (
                              <tr key={i}>
                                <td style={{ fontWeight: 700, color: '#0f172a' }}>{item.name}</td>
                                <td style={{ textAlign: 'center', fontWeight: 800, color: '#475569' }}>{item.qty}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#0f172a' }}>
                                  {formatCurrency(item.price * item.qty)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Status Update Form */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem', marginBottom: '1.25rem' }}>
                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '0.35rem' }}>
                          Update Delivery Status
                        </label>
                        <select
                          value={newStatus}
                          onChange={e => setNewStatus(e.target.value)}
                          className="pro-select-styled"
                          style={{ width: '100%' }}
                        >
                          {ORDER_STATUSES.map(s => (
                            <option key={s.key} value={s.key}>{s.label}</option>
                          ))}
                        </select>
                      </div>

                      <div>
                        <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: '#475569', marginBottom: '0.35rem' }}>
                          Admin Status Note (Optional)
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Package dispatched from Bakani store..."
                          value={adminNote}
                          onChange={e => setAdminNote(e.target.value)}
                          className="pro-search-input"
                          style={{ paddingLeft: '0.85rem' }}
                        />
                      </div>
                    </div>

                    {/* Modal Actions */}
                    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '0.65rem', paddingTop: '1rem', borderTop: '1px solid #e2e8f0' }}>
                      <button
                        onClick={handleStatusUpdate}
                        className="pro-btn pro-btn-primary"
                        style={{ flex: 1, padding: '0.65rem 1rem' }}
                      >
                        💾 Update Status
                      </button>
                      <button
                        type="button"
                        onClick={() => printOrderInvoice(selOrder)}
                        className="pro-btn pro-btn-secondary"
                      >
                        🖨️ Print Dispatch Bill
                      </button>
                      {selOrder.address?.phone && (
                        <a
                          href={`https://wa.me/${String(selOrder.address.phone).replace(/\D/g, '')}?text=${encodeURIComponent(`Namaskar ${selOrder.address.name || ''}! Gupta Store se aapke Order #${selOrder.orderId} ka status: ${statusInfo(newStatus || selOrder.status).label}`)}`}
                          target="_blank"
                          rel="noreferrer"
                          className="pro-btn"
                          style={{ background: '#25d366', color: '#ffffff', border: '1px solid #22c55e' }}
                        >
                          <AppIcon name="message" size={15} /> WhatsApp
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {tab === 'messages' && (() => {
          const unreadCount = messages.filter(m => m.status === 'unread').length;
          const repliedCount = messages.filter(m => m.status === 'replied' || m.reply).length;
          const readCount = messages.filter(m => m.status === 'read').length;

          const filteredMessages = messages.filter(m => {
            if (msgFilter === 'unread' && m.status !== 'unread') return false;
            if (msgFilter === 'replied' && !m.reply && m.status !== 'replied') return false;
            if (msgFilter === 'read' && (m.status !== 'read' || m.reply)) return false;
            if (msgSearch.trim()) {
              const q = msgSearch.toLowerCase().trim();
              const n = (m.name || '').toLowerCase();
              const p = String(m.phone || '');
              const s = (m.subject || '').toLowerCase();
              const msg = (m.message || '').toLowerCase();
              const rep = (m.reply || '').toLowerCase();
              return n.includes(q) || p.includes(q) || s.includes(q) || msg.includes(q) || rep.includes(q);
            }
            return true;
          });

          function getInitials(name) {
            if (!name) return 'GS';
            const parts = name.trim().split(/\s+/);
            if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
            return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
          }

          function formatPhone(phone) {
            const digits = String(phone || '').replace(/\D/g, '').slice(-10);
            if (digits.length === 10) {
              return `+91 ${digits.slice(0, 5)} ${digits.slice(5)}`;
            }
            return phone || 'N/A';
          }

          return (
            <div className="space-y-6">
              {/* Executive Inquiries Header */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Customer Inquiries</h1>
                    <span className="pro-pill-badge blue">
                      ● Live Feed
                    </span>
                    {unreadCount > 0 && (
                      <span className="pro-pill-badge orange">
                        🔥 {unreadCount} Unread
                      </span>
                    )}
                  </div>
                  <p className="pro-page-sub">
                    Website contact form inquiries manage karein, official reply bhejein aur WhatsApp connect karein.
                  </p>
                </div>
                <div className="pro-page-actions">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Feed'}</span>
                  </button>
                </div>
              </div>

              {/* Top KPI Cards (Shopify / Stripe Executive Style) */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
                  gap: '1rem',
                  marginBottom: '1.75rem',
                }}
              >
                {/* 1. New / Unread */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid rgba(249,115,22,0.22)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.4rem',
                    boxShadow: '0 4px 18px rgba(249,115,22,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #f97316, #ea580c)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#ea580c', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block' }}>
                        NEW / UNREAD
                      </span>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#ea580c', fontFamily: 'var(--font-display)', marginTop: '0.2rem', lineHeight: 1 }}>
                        {unreadCount}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(249,115,22,0.15) 0%, rgba(249,115,22,0.05) 100%)',
                        color: '#ea580c',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(249,115,22,0.2)',
                      }}
                    >
                      <AppIcon name="mail" size={20} strokeWidth={2.3} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '5px' }}>
                    <span style={{ width: 6, height: 6, borderRadius: '50%', background: unreadCount > 0 ? '#ea580c' : '#94a3b8' }} />
                    {unreadCount > 0 ? 'Requires attention / reply' : 'All caught up!'}
                  </div>
                </div>

                {/* 2. Replied & Resolved */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1.5px solid rgba(139,92,246,0.22)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.4rem',
                    boxShadow: '0 4px 18px rgba(139,92,246,0.06)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #8b5cf6, #6d28d9)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#6d28d9', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block' }}>
                        STORE REPLIED
                      </span>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: '#6d28d9', fontFamily: 'var(--font-display)', marginTop: '0.2rem', lineHeight: 1 }}>
                        {repliedCount}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(139,92,246,0.15) 0%, rgba(139,92,246,0.05) 100%)',
                        color: '#6d28d9',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(139,92,246,0.2)',
                      }}
                    >
                      <AppIcon name="reply" size={20} strokeWidth={2.4} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Customer notifications sent
                  </div>
                </div>

                {/* 3. Total Inquiries */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    border: '1px solid var(--border)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.4rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #3b82f6, #2563eb)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#3b82f6', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block' }}>
                        TOTAL INQUIRIES
                      </span>
                      <div style={{ fontSize: '1.9rem', fontWeight: 900, color: 'var(--text-primary)', fontFamily: 'var(--font-display)', marginTop: '0.2rem', lineHeight: 1 }}>
                        {messages.length}
                      </div>
                    </div>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, rgba(59,130,246,0.15) 0%, rgba(59,130,246,0.05) 100%)',
                        color: '#2563eb',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        border: '1px solid rgba(59,130,246,0.2)',
                      }}
                    >
                      <AppIcon name="message" size={20} strokeWidth={2.3} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                    Direct web leads & queries
                  </div>
                </div>

                {/* 4. Instant Connect */}
                <div
                  style={{
                    background: 'linear-gradient(135deg, rgba(37,211,102,0.08) 0%, rgba(37,211,102,0.02) 100%)',
                    border: '1px solid rgba(37,211,102,0.28)',
                    borderRadius: '16px',
                    padding: '1.25rem 1.4rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    position: 'relative',
                    overflow: 'hidden',
                  }}
                >
                  <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg, #25d366, #128c7e)' }} />
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                    <div>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: '#15803d', textTransform: 'uppercase', letterSpacing: '0.6px', display: 'block' }}>
                        INSTANT CONNECT
                      </span>
                      <div style={{ fontSize: '1.45rem', fontWeight: 900, color: '#15803d', fontFamily: 'var(--font-display)', marginTop: '0.4rem', lineHeight: 1.1 }}>
                        WhatsApp & Call
                      </div>
                    </div>
                    <div
                      style={{
                        width: 42,
                        height: 42,
                        borderRadius: '12px',
                        background: '#25d366',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        boxShadow: '0 4px 10px rgba(37,211,102,0.3)',
                      }}
                    >
                      <AppIcon name="phone" size={19} />
                    </div>
                  </div>
                  <div style={{ fontSize: '0.76rem', color: '#166534', fontWeight: 600 }}>
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px" }}><AppIcon name="zap" size={13} strokeWidth={2.4} /> <span>1-Click Customer Chat Ready</span></span>
                  </div>
                </div>
              </div>

              {/* Controls Toolbar: Filter Tabs & Search */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '1rem',
                  marginBottom: '1.25rem',
                  background: 'var(--bg-card)',
                  padding: '0.75rem 1rem',
                  borderRadius: '14px',
                  border: '1px solid var(--border)',
                  boxShadow: '0 2px 6px rgba(0,0,0,0.02)',
                }}
              >
                {/* Segmented Filter Pills */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', flexWrap: 'wrap' }}>
                  {[
                    { key: 'all', label: 'All Inquiries', count: messages.length },
                    { key: 'unread', label: 'New / Unread', count: unreadCount, isNew: true },
                    { key: 'replied', label: 'Replied', count: repliedCount },
                    { key: 'read', label: 'Attended', count: readCount },
                  ].map(tabItem => {
                    const isActive = msgFilter === tabItem.key;
                    return (
                      <button
                        key={tabItem.key}
                        onClick={() => setMsgFilter(tabItem.key)}
                        style={{
                          padding: '0.45rem 0.95rem',
                          borderRadius: '10px',
                          fontSize: '0.82rem',
                          fontWeight: isActive ? 800 : 600,
                          border: isActive ? '1px solid var(--orange)' : '1px solid transparent',
                          background: isActive ? 'rgba(249,115,22,0.1)' : 'transparent',
                          color: isActive ? 'var(--orange-dark)' : 'var(--text-secondary)',
                          cursor: 'pointer',
                          transition: 'all 0.15s ease',
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: '0.5rem',
                        }}
                      >
                        {tabItem.isNew && tabItem.count > 0 && (
                          <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c' }} />
                        )}
                        <span>{tabItem.label}</span>
                        <span
                          style={{
                            fontSize: '0.7rem',
                            fontWeight: 800,
                            padding: '0.1rem 0.45rem',
                            borderRadius: '999px',
                            background: isActive ? 'var(--orange)' : 'var(--bg-secondary)',
                            color: isActive ? '#ffffff' : 'var(--text-muted)',
                            border: '1px solid var(--border-light)',
                          }}
                        >
                          {tabItem.count}
                        </span>
                      </button>
                    );
                  })}
                </div>

                {/* Search Box */}
                <div style={{ position: 'relative', minWidth: 280, flex: '1 1 280px', maxWidth: 440 }}>
                  <input
                    type="text"
                    value={msgSearch}
                    onChange={e => setMsgSearch(e.target.value)}
                    placeholder="Search by customer name, phone, subject..."
                    style={{
                      width: '100%',
                      padding: '0.55rem 0.95rem 0.55rem 2.3rem',
                      borderRadius: '10px',
                      border: '1px solid var(--border)',
                      fontSize: '0.84rem',
                      background: 'var(--bg)',
                      color: 'var(--text-primary)',
                      outline: 'none',
                      transition: 'border-color 0.15s ease',
                    }}
                  />
                  <div style={{ position: 'absolute', left: '0.8rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>
                    <AppIcon name="search" size={15} />
                  </div>
                  {msgSearch && (
                    <button
                      onClick={() => setMsgSearch('')}
                      style={{
                        position: 'absolute',
                        right: '0.75rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        color: 'var(--text-muted)',
                        fontSize: '0.82rem',
                        padding: '2px',
                      }}
                      title="Clear search"
                     title="Clear search"><AppIcon name="close" size={13} strokeWidth={2.4} /></button>
                  )}
                </div>
              </div>

              {/* Enhanced Customer Messages Table */}
              <div
                className="admin-messages-desktop-table"
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '18px',
                  border: '1px solid var(--border)',
                  overflow: 'hidden',
                  boxShadow: '0 4px 20px rgba(0,0,0,0.04)',
                }}
              >
                <div style={{ overflowX: 'auto' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: 840 }}>
                    <thead>
                      <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1.5px solid var(--border)' }}>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', width: 110 }}>
                          Status
                        </th>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', width: 230 }}>
                          Customer
                        </th>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', width: 230 }}>
                          Contact & Quick Connect
                        </th>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)' }}>
                          Sandesh (Customer Message)
                        </th>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', width: 160 }}>
                          Date & Source
                        </th>
                        <th style={{ padding: '0.95rem 1.25rem', fontSize: '0.72rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.6px', color: 'var(--text-muted)', textAlign: 'right', width: 170 }}>
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredMessages.map(message => {
                        const isUnread = message.status === 'unread';
                        const cleanPhone = String(message.phone || '').replace(/\D/g, '').slice(-10);
                        const whatsappMsg = `Namaste ${message.name} ji! Gupta General Store Bakani se aapke online message (${message.subject || 'Inquiry'}) ke sandarbh mein sampark kar rahe hain. Batayein hum aapki kya sahayata kar sakte hain?`;
                        const initials = getInitials(message.name);

                        return (
                          <tr
                            key={message._id || message.id}
                            style={{
                              borderBottom: '1px solid var(--border-light)',
                              background: isUnread ? 'rgba(249,115,22,0.025)' : 'transparent',
                              transition: 'background 0.15s ease',
                            }}
                          >
                            {/* 1. Status Column */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle' }}>
                              {message.reply ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '0.3rem 0.72rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    background: '#ede9fe',
                                    color: '#6d28d9',
                                    border: '1px solid #ddd6fe',
                                    boxShadow: '0 1px 4px rgba(109, 40, 217, 0.1)',
                                  }}
                                >
                                  <AppIcon name="reply" size={11} strokeWidth={2.6} />
                                  <span>Replied</span>
                                </span>
                              ) : isUnread ? (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '6px',
                                    padding: '0.3rem 0.75rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 800,
                                    background: '#ffedd5',
                                    color: '#c2410c',
                                    border: '1px solid #fed7aa',
                                    boxShadow: '0 1px 4px rgba(234, 88, 12, 0.12)',
                                  }}
                                >
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c' }} />
                                  New
                                </span>
                              ) : (
                                <span
                                  style={{
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '5px',
                                    padding: '0.28rem 0.7rem',
                                    borderRadius: '999px',
                                    fontSize: '0.72rem',
                                    fontWeight: 700,
                                    background: 'var(--bg-secondary)',
                                    color: 'var(--text-muted)',
                                    border: '1px solid var(--border)',
                                  }}
                                >
                                  <AppIcon name="check" size={11} strokeWidth={2.6} style={{ color: "#16a34a" }} />
                                  <span>Read</span>
                                </span>
                              )}
                            </td>

                            {/* 2. Customer Column with Letter Avatar */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                                {/* Stylish Customer Avatar Circle */}
                                <div
                                  style={{
                                    width: 42,
                                    height: 42,
                                    borderRadius: '12px',
                                    background: isUnread
                                      ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                                      : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                                    color: '#ffffff',
                                    display: 'flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    fontWeight: 900,
                                    fontSize: '0.92rem',
                                    flexShrink: 0,
                                    boxShadow: isUnread ? '0 4px 12px rgba(249, 115, 22, 0.28)' : '0 2px 6px rgba(0,0,0,0.1)',
                                    letterSpacing: '0.5px',
                                  }}
                                >
                                  {initials}
                                </div>

                                <div style={{ minWidth: 0 }}>
                                  <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                    {message.name}
                                  </div>
                                  <div style={{ marginTop: '0.25rem' }}>
                                    <span
                                      style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 700,
                                        color: '#ea580c',
                                        background: 'rgba(249,115,22,0.1)',
                                        border: '1px solid rgba(249,115,22,0.2)',
                                        padding: '0.15rem 0.55rem',
                                        borderRadius: '6px',
                                        display: 'inline-block',
                                        maxWidth: '100%',
                                        whiteSpace: 'nowrap',
                                        overflow: 'hidden',
                                        textOverflow: 'ellipsis',
                                      }}
                                      title={message.subject || 'General Inquiry'}
                                    >
                                      <AppIcon name="tag" size={11} strokeWidth={2.4} style={{ flexShrink: 0 }} /> <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{message.subject || "General Inquiry"}</span>
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </td>

                            {/* 3. Contact & Quick Connect Column */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle' }}>
                              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                <div style={{ fontWeight: 700, fontSize: '0.86rem', color: 'var(--text-primary)', letterSpacing: '0.2px' }}>
                                  {formatPhone(cleanPhone)}
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', flexWrap: 'wrap' }}>
                                  {/* Direct WhatsApp Button */}
                                  <a
                                    href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                                    target="_blank"
                                    rel="noreferrer"
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.35rem 0.75rem',
                                      borderRadius: '8px',
                                      fontSize: '0.74rem',
                                      fontWeight: 800,
                                      background: '#25d366',
                                      color: '#ffffff',
                                      textDecoration: 'none',
                                      boxShadow: '0 2px 8px rgba(37,211,102,0.28)',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title="WhatsApp par direct reply karein"
                                  >
                                    <AppIcon name="whatsapp" size={13} strokeWidth={2.4} />
                                    <span>WhatsApp</span>
                                  </a>

                                  {/* Direct Call Button */}
                                  <a
                                    href={`tel:${cleanPhone}`}
                                    style={{
                                      display: 'inline-flex',
                                      alignItems: 'center',
                                      gap: '0.35rem',
                                      padding: '0.35rem 0.7rem',
                                      borderRadius: '8px',
                                      fontSize: '0.74rem',
                                      fontWeight: 700,
                                      background: 'var(--bg)',
                                      color: 'var(--text-primary)',
                                      border: '1px solid var(--border)',
                                      textDecoration: 'none',
                                      transition: 'all 0.15s ease',
                                    }}
                                    title="Direct phone call karein"
                                  >
                                    <AppIcon name="phone" size={12} strokeWidth={2.2} style={{ color: "var(--text-muted)" }} />
                                    <span>Call</span>
                                  </a>
                                </div>
                              </div>
                            </td>

                            {/* 4. Sandesh (Message) Column */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle' }}>
                              <div
                                onClick={() => {
                                  setSelMessage(message);
                                  setReplyText(message.reply || '');
                                }}
                                style={{
                                  background: 'var(--bg)',
                                  border: '1px solid var(--border-light)',
                                  borderRadius: '12px',
                                  padding: '0.75rem 0.95rem',
                                  fontSize: '0.84rem',
                                  color: 'var(--text-primary)',
                                  lineHeight: 1.55,
                                  cursor: 'pointer',
                                  maxWidth: 420,
                                  boxShadow: '0 1px 3px rgba(0,0,0,0.02)',
                                  transition: 'border-color 0.15s ease',
                                }}
                                title="Click to view full message & reply"
                              >
                                <div style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                  “{message.message || '(Koi message text nahi diya gaya)'}”
                                </div>
                              </div>

                              {message.reply && (
                                <div
                                  style={{
                                    marginTop: '0.45rem',
                                    background: 'rgba(139, 92, 246, 0.08)',
                                    border: '1px solid rgba(139, 92, 246, 0.22)',
                                    borderRadius: '8px',
                                    padding: '0.4rem 0.65rem',
                                    fontSize: '0.76rem',
                                    color: '#6d28d9',
                                    maxWidth: 420,
                                  }}
                                >
                                  <div style={{ fontWeight: 800, display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '2px' }}>
                                    <AppIcon name="reply" size={11} strokeWidth={2.4} />
                                    <span>Store Reply:</span>
                                  </div>
                                  <div style={{ fontStyle: 'italic', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                                    “{message.reply}”
                                  </div>
                                </div>
                              )}

                              <button
                                type="button"
                                onClick={() => {
                                  setSelMessage(message);
                                  setReplyText(message.reply || '');
                                }}
                                style={{
                                  background: 'none',
                                  border: 'none',
                                  color: 'var(--orange)',
                                  fontSize: '0.74rem',
                                  fontWeight: 800,
                                  cursor: 'pointer',
                                  padding: '0.25rem 0 0',
                                  display: 'inline-flex',
                                  alignItems: 'center',
                                  gap: '3px',
                                }}
                              >
                                <span>{message.reply ? 'View Full & Edit Reply' : 'View Full Message'}</span> <AppIcon name="externalLink" size={11} strokeWidth={2.4} />
                              </button>
                            </td>

                            {/* 5. Date & Source Column */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle', whiteSpace: 'nowrap' }}>
                              <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                                {formatDate(message.createdAt)}
                              </div>
                              <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)', marginTop: '0.2rem', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                <AppIcon name="globe" size={12} strokeWidth={2.2} style={{ color: "#3b82f6" }} /> <span style={{ fontWeight: 600 }}>Online Contact</span>
                              </div>
                            </td>

                            {/* 6. Actions Column (Clean Horizontal Group) */}
                            <td style={{ padding: '1.15rem 1.25rem', verticalAlign: 'middle', textAlign: 'right' }}>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', justifyContent: 'flex-end', flexWrap: 'nowrap' }}>
                                {/* Mark Read/Unread */}
                                <button
                                  type="button"
                                  onClick={() => toggleMessageStatus(message)}
                                  style={{
                                    fontSize: '0.76rem',
                                    fontWeight: 700,
                                    padding: '0.42rem 0.75rem',
                                    borderRadius: '8px',
                                    border: '1px solid var(--border)',
                                    background: isUnread ? 'var(--bg)' : 'var(--bg-secondary)',
                                    color: isUnread ? 'var(--text-primary)' : 'var(--text-muted)',
                                    cursor: 'pointer',
                                    whiteSpace: 'nowrap',
                                    transition: 'all 0.15s ease',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                  }}
                                  title={isUnread ? 'Mark as Read' : 'Mark as Unread'}
                                >
                                  {isUnread ? (
                                    <>
                                      <AppIcon name="check" size={13} strokeWidth={2.8} style={{ color: '#16a34a' }} />
                                      <span>Mark Read</span>
                                    </>
                                  ) : (
                                    <>
                                      <AppIcon name="mail" size={13} strokeWidth={2} style={{ color: 'var(--text-muted)' }} />
                                      <span>Mark Unread</span>
                                    </>
                                  )}
                                </button>

                                {/* Dedicated Reply Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelMessage(message);
                                    setReplyText(message.reply || '');
                                  }}
                                  style={{
                                    background: 'rgba(139, 92, 246, 0.1)',
                                    color: '#6d28d9',
                                    border: '1px solid rgba(139, 92, 246, 0.28)',
                                    padding: '0.42rem 0.8rem',
                                    borderRadius: '8px',
                                    fontSize: '0.76rem',
                                    fontWeight: 800,
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    gap: '0.35rem',
                                    boxShadow: '0 1px 3px rgba(109, 40, 217, 0.08)',
                                    transition: 'all 0.15s ease',
                                    whiteSpace: 'nowrap',
                                  }}
                                  title="Customer ko official reply karein"
                                >
                                  <AppIcon name="reply" size={13} strokeWidth={2.4} />
                                  <span>{message.reply ? 'Edit Reply' : 'Reply'}</span>
                                </button>

                                {/* View Details Eye Button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelMessage(message);
                                    setReplyText(message.reply || '');
                                  }}
                                  style={{
                                    background: 'rgba(59, 130, 246, 0.08)',
                                    color: '#2563eb',
                                    border: '1px solid rgba(59, 130, 246, 0.22)',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(37, 99, 235, 0.06)',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="View Full Inquiry Details"
                                >
                                  <AppIcon name="eye" size={15} strokeWidth={2.2} />
                                </button>

                                {/* Delete Button */}
                                <button
                                  type="button"
                                  onClick={() => deleteMessage(message)}
                                  style={{
                                    background: 'rgba(239, 68, 68, 0.08)',
                                    color: '#ef4444',
                                    border: '1px solid rgba(239, 68, 68, 0.22)',
                                    padding: '0.45rem 0.65rem',
                                    borderRadius: '8px',
                                    cursor: 'pointer',
                                    display: 'inline-flex',
                                    alignItems: 'center',
                                    justifyContent: 'center',
                                    boxShadow: '0 1px 3px rgba(239, 68, 68, 0.06)',
                                    transition: 'all 0.15s ease',
                                  }}
                                  title="Delete Message"
                                >
                                  <AppIcon name="trash" size={15} strokeWidth={2.2} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}

                      {filteredMessages.length === 0 && (
                        <tr>
                          <td colSpan={6} style={{ textAlign: 'center', padding: '4rem 1.5rem', color: 'var(--text-muted)' }}>
                            <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'rgba(249,115,22,0.1)', color: 'var(--orange)', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}><AppIcon name="mail" size={28} strokeWidth={2} /></div>
                            <div style={{ fontSize: '1.1rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                              {msgSearch ? 'Aapki search se match hone wala koi sandesh nahi mila' : 'Abhi koi customer message nahi hai'}
                            </div>
                            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: '0.35rem' }}>
                              {msgSearch ? 'Kripya doosra naam, mobile number ya keyword try karein.' : 'Website contact form se aane wale naye sandesh yahan real-time dikhenge.'}
                            </div>
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Mobile Messages Feed */}
              <div className="admin-messages-mobile-list">
                {filteredMessages.map(message => {
                  const isUnread = message.status === 'unread';
                  const cleanPhone = String(message.phone || '').replace(/\D/g, '').slice(-10);
                  const whatsappMsg = `Namaste ${message.name} ji! Gupta General Store Bakani se aapke online message (${message.subject || 'Inquiry'}) ke sandarbh mein sampark kar rahe hain. Batayein hum aapki kya sahayata kar sakte hain?`;
                  const initials = getInitials(message.name);

                  return (
                    <div
                      key={message._id || message.id}
                      className={`admin-message-mob-card ${isUnread ? 'is-unread' : ''}`}
                    >
                      <div className="admin-msg-mob-top">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                          <div
                            style={{
                              width: 38,
                              height: 38,
                              borderRadius: '10px',
                              background: isUnread
                                ? 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)'
                                : 'linear-gradient(135deg, #64748b 0%, #475569 100%)',
                              color: '#ffffff',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 900,
                              fontSize: '0.86rem',
                              flexShrink: 0,
                            }}
                          >
                            {initials}
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                              {message.name}
                            </div>
                            <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                              {formatPhone(cleanPhone)} • {formatDate(message.createdAt || message.date)}
                            </div>
                          </div>
                        </div>

                        {message.reply ? (
                          <span className="status-badge" style={{ background: '#ede9fe', color: '#6d28d9', border: '1px solid #ddd6fe', fontSize: '0.72rem', fontWeight: 800 }}>
                            <AppIcon name="reply" size={11} strokeWidth={2.4} /> Replied
                          </span>
                        ) : isUnread ? (
                          <span className="status-badge" style={{ background: '#ffedd5', color: '#c2410c', border: '1px solid #fed7aa', fontSize: '0.72rem', fontWeight: 800 }}>
                            ● New
                          </span>
                        ) : (
                          <span className="status-badge" style={{ background: 'var(--bg-secondary)', color: 'var(--text-muted)', border: '1px solid var(--border)', fontSize: '0.72rem', fontWeight: 700 }}>
                            Read
                          </span>
                        )}
                      </div>

                      {message.subject && (
                        <div style={{ marginTop: '0.45rem', display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '0.78rem', fontWeight: 700, color: 'var(--orange-dark)' }}>
                          <AppIcon name="tag" size={12} strokeWidth={2.4} />
                          <span>{message.subject}</span>
                        </div>
                      )}

                      <div
                        onClick={() => {
                          setSelMessage(message);
                          setReplyText(message.reply || '');
                        }}
                        style={{
                          background: 'var(--bg-secondary)',
                          borderRadius: '10px',
                          padding: '0.65rem 0.8rem',
                          marginTop: '0.5rem',
                          fontSize: '0.82rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.5,
                          cursor: 'pointer',
                        }}
                      >
                        “{message.message || '(Koi message text nahi diya gaya)'}”
                      </div>

                      {message.reply && (
                        <div style={{ background: 'rgba(139, 92, 246, 0.08)', borderRadius: '8px', padding: '0.45rem 0.65rem', marginTop: '0.4rem', fontSize: '0.76rem', color: '#6d28d9' }}>
                          <strong>Store Reply:</strong> “{message.reply}”
                        </div>
                      )}

                      <div className="admin-msg-mob-actions" style={{ display: 'flex', gap: '0.45rem', marginTop: '0.65rem' }}>
                        {cleanPhone && (
                          <a
                            href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(whatsappMsg)}`}
                            target="_blank"
                            rel="noreferrer"
                            className="btn btn-sm"
                            style={{ flex: 1, background: '#25d366', color: '#ffffff', justifyContent: 'center', textDecoration: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem', minHeight: 38 }}
                          >
                            <AppIcon name="whatsapp" size={14} /> WhatsApp
                          </a>
                        )}
                        {cleanPhone && (
                          <a
                            href={`tel:${cleanPhone}`}
                            className="btn btn-sm"
                            style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', color: 'var(--text-primary)', justifyContent: 'center', textDecoration: 'none', borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem', minHeight: 38, padding: '0 0.8rem' }}
                          >
                            <AppIcon name="phone" size={13} /> Call
                          </a>
                        )}
                        <button
                          type="button"
                          className="btn btn-sm btn-orange"
                          style={{ flex: 1, justifyContent: 'center', borderRadius: '10px', fontWeight: 700, fontSize: '0.78rem', minHeight: 38 }}
                          onClick={() => {
                            setSelMessage(message);
                            setReplyText(message.reply || '');
                          }}
                        >
                          <AppIcon name="reply" size={13} /> {message.reply ? 'View' : 'Reply'}
                        </button>
                      </div>
                    </div>
                  );
                })}

                {filteredMessages.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '3rem 1.5rem', background: 'var(--bg-card)', borderRadius: '16px', border: '1px solid var(--border)' }}>
                    <div style={{ fontSize: '2.2rem', marginBottom: '0.5rem' }}>💬</div>
                    <strong style={{ color: 'var(--text-primary)' }}>Koi customer message nahi mila</strong>
                  </div>
                )}
              </div>

              {/* High-End Message Details Modal */}
              {selMessage && (
                <div
                  style={{
                    position: 'fixed',
                    inset: 0,
                    background: 'rgba(15, 23, 42, 0.72)',
                    zIndex: 1000,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    padding: '1rem',
                    backdropFilter: 'blur(8px)',
                  }}
                  onClick={e => { if (e.target === e.currentTarget) setSelMessage(null); }}
                >
                  <div
                    className="admin-modal-card admin-inquiry-modal"
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '24px',
                      maxWidth: 620,
                      width: '100%',
                      maxHeight: '90vh',
                      overflow: 'auto',
                      padding: '2rem',
                      boxShadow: '0 25px 60px -15px rgba(0,0,0,0.3)',
                      border: '1px solid var(--border)',
                      position: 'relative',
                    }}
                  >
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem', paddingBottom: '1.1rem', borderBottom: '1px solid var(--border-light)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.9rem' }}>
                        <div
                          style={{
                            width: 48,
                            height: 48,
                            borderRadius: '14px',
                            background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                            color: '#ffffff',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontWeight: 900,
                            fontSize: '1.1rem',
                            boxShadow: '0 4px 14px rgba(249, 115, 22, 0.3)',
                          }}
                        >
                          {getInitials(selMessage.name)}
                        </div>
                        <div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <h2 style={{ fontSize: '1.3rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                              {selMessage.name}
                            </h2>
                            <span
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 800,
                                background: selMessage.reply ? '#ede9fe' : selMessage.status === 'unread' ? '#ffedd5' : 'var(--bg-secondary)',
                                color: selMessage.reply ? '#6d28d9' : selMessage.status === 'unread' ? '#ea580c' : 'var(--text-muted)',
                                padding: '0.15rem 0.65rem',
                                borderRadius: '999px',
                                border: '1px solid var(--border)',
                              }}
                            >
                              {selMessage.reply ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AppIcon name="reply" size={12} strokeWidth={2.6} />
                                  <span>Replied</span>
                                </span>
                              ) : selMessage.status === 'unread' ? (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#ea580c' }} />
                                  <span>New Inquiry</span>
                                </span>
                              ) : (
                                <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                                  <AppIcon name="check" size={12} strokeWidth={2.6} style={{ color: '#16a34a' }} />
                                  <span>Attended</span>
                                </span>
                              )}
                            </span>
                          </div>
                          <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                            Received: {formatDate(selMessage.createdAt)}
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelMessage(null)}
                        style={{
                          width: 34,
                          height: 34,
                          borderRadius: '50%',
                          background: 'var(--bg-secondary)',
                          border: '1px solid var(--border)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-muted)',
                          transition: 'all 0.15s ease',
                        }}
                        title="Close Modal"
                      >
                        <AppIcon name="close" size={16} strokeWidth={2.2} />
                      </button>
                    </div>

                    {/* Subject Pill */}
                    <div style={{ marginBottom: '1.25rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                        INQUIRY SUBJECT
                      </span>
                      <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#ea580c', background: 'rgba(249,115,22,0.1)', padding: '0.35rem 0.85rem', borderRadius: '8px', border: '1px solid rgba(249,115,22,0.2)', display: 'inline-block' }}>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><AppIcon name="tag" size={13} strokeWidth={2.2} /> <span>{selMessage.subject || "General Inquiry"}</span></span>
                      </span>
                    </div>

                    {/* Full Message Box */}
                    <div style={{ marginBottom: '1.5rem' }}>
                      <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.5px', display: 'block', marginBottom: '0.4rem' }}>
                        CUSTOMER KA SANDESH (MESSAGE)
                      </span>
                      <div
                        style={{
                          background: 'var(--bg)',
                          border: '1px solid var(--border-light)',
                          borderRadius: '14px',
                          padding: '1.25rem',
                          fontSize: '0.94rem',
                          color: 'var(--text-primary)',
                          lineHeight: 1.7,
                          whiteSpace: 'pre-wrap',
                          boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.02)',
                        }}
                      >
                        “{selMessage.message || '(Koi message text nahi diya gaya)'}”
                      </div>
                    </div>

                    {/* Official Store Reply Section (Shopify / Crisp High-End Style) */}
                    <div
                      style={{
                        marginBottom: '1.5rem',
                        background: 'rgba(139, 92, 246, 0.04)',
                        border: '1.5px solid rgba(139, 92, 246, 0.22)',
                        borderRadius: '16px',
                        padding: '1.25rem',
                        boxShadow: '0 2px 12px rgba(139, 92, 246, 0.04)',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span style={{ width: 28, height: 28, borderRadius: '8px', background: '#ede9fe', color: '#6d28d9', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}>
                            <AppIcon name="reply" size={15} strokeWidth={2.4} />
                          </span>
                          <div>
                            <span style={{ fontSize: '0.84rem', fontWeight: 900, color: '#6d28d9', letterSpacing: '0.3px', display: 'block' }}>
                              Official Store Reply
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              Customer ke notification bell aur contact message me live dikhega
                            </span>
                          </div>
                        </div>

                        {selMessage.reply && selMessage.repliedAt && (
                          <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#6d28d9', background: '#ede9fe', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                            Sent: {formatDate(selMessage.repliedAt)}
                          </span>
                        )}
                      </div>

                      {/* Display already sent reply if any */}
                      {selMessage.reply && (
                        <div style={{ background: 'var(--bg-card)', border: '1px solid #ddd6fe', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '0.85rem', color: 'var(--text-primary)', fontSize: '0.88rem', lineHeight: 1.6 }}>
                          <div style={{ fontSize: '0.72rem', fontWeight: 800, color: '#7c3aed', marginBottom: '0.25rem' }}>
                            Current Saved Reply:
                          </div>
                          “{selMessage.reply}”
                        </div>
                      )}

                      {/* Quick Template Chips */}
                      <div style={{ marginBottom: '0.65rem' }}>
                        <div style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.4rem', letterSpacing: '0.4px' }}>
                          Quick 1-Click Templates:
                        </div>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {[
                            'Ji, yeh item hamare Bakani store par available hai. Aap shop visit kar sakte hain ya online order place kar sakte hain.',
                            'Aapka stationery request note kar liya hai, hamari team jald hi dispatch process karegi.',
                            'School & bulk requirements par best discount available hai. Kripya shop par sampark karein.',
                            'Namaste! Aapka query receive ho gaya hai, hum aapko telephone par jald call karenge.',
                          ].map((tmpl, idx) => (
                            <button
                              key={idx}
                              type="button"
                              onClick={() => setReplyText(tmpl)}
                              style={{
                                fontSize: '0.72rem',
                                fontWeight: 700,
                                background: 'var(--bg)',
                                border: '1px solid rgba(139, 92, 246, 0.28)',
                                color: '#6d28d9',
                                padding: '0.3rem 0.65rem',
                                borderRadius: '8px',
                                cursor: 'pointer',
                                transition: 'all 0.15s ease',
                                textAlign: 'left',
                              }}
                              title="Click to insert this response template"
                            >
                              + {tmpl.slice(0, 42)}...
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Textarea */}
                      <textarea
                        rows={3}
                        value={replyText}
                        onChange={e => setReplyText(e.target.value)}
                        placeholder="Yahan Gupta General Store ka official reply likhein..."
                        style={{
                          width: '100%',
                          borderRadius: '12px',
                          border: '1.5px solid rgba(139, 92, 246, 0.35)',
                          padding: '0.75rem 0.95rem',
                          fontSize: '0.88rem',
                          background: 'var(--bg)',
                          color: 'var(--text-primary)',
                          resize: 'vertical',
                          outline: 'none',
                          marginBottom: '0.75rem',
                          fontFamily: 'inherit',
                          lineHeight: 1.5,
                        }}
                      />

                      {/* Reply Submit Bar */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.65rem' }}>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          {replyText.length} characters • Real-time customer sync
                        </span>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <button
                            type="button"
                            disabled={sendingReply || !replyText.trim()}
                            onClick={() => submitReply(selMessage, replyText)}
                            style={{
                              background: 'linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%)',
                              color: '#ffffff',
                              border: 'none',
                              padding: '0.55rem 1.15rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              cursor: sendingReply || !replyText.trim() ? 'not-allowed' : 'pointer',
                              opacity: sendingReply || !replyText.trim() ? 0.6 : 1,
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 3px 10px rgba(109, 40, 217, 0.28)',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            <AppIcon name="reply" size={14} strokeWidth={2.4} />
                            <span>{sendingReply ? 'Sending...' : (selMessage.reply ? 'Update Official Reply' : 'Send Official Store Reply')}</span>
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Customer Contact Details Strip */}
                    <div style={{ background: 'var(--bg-secondary)', borderRadius: '14px', padding: '1.15rem', marginBottom: '1.75rem', border: '1px solid var(--border)' }}>
                      <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem', letterSpacing: '0.5px' }}>
                        DIRECT CUSTOMER CONNECT
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.85rem' }}>
                        <div>
                          <div style={{ fontWeight: 800, fontSize: '1rem', color: 'var(--text-primary)' }}>
                            <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><AppIcon name="phone" size={15} strokeWidth={2.2} style={{ color: "var(--text-muted)" }} /> <span>{formatPhone(selMessage.phone)}</span></span>
                          </div>
                          {selMessage.email && (
                            <div style={{ fontSize: '0.82rem', color: 'var(--text-muted)', marginTop: '0.2rem' }}>
                              <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}><AppIcon name="mail" size={14} strokeWidth={2} style={{ color: "var(--text-muted)" }} /> <span>{selMessage.email}</span></span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                          <a
                            href={`https://wa.me/91${String(selMessage.phone || '').replace(/\D/g, '').slice(-10)}?text=${encodeURIComponent((replyText || selMessage.reply) ? `Namaste ${selMessage.name} ji! Gupta General Store Bakani se aapke message (${selMessage.subject || 'Inquiry'}) ka reply:\n\n"${replyText || selMessage.reply}"` : `Namaste ${selMessage.name} ji! Gupta General Store Bakani se aapke online message (${selMessage.subject || 'Inquiry'}) ke sandarbh mein sampark kar rahe hain.`)}`}
                            target="_blank"
                            rel="noreferrer"
                            style={{
                              background: '#25d366',
                              color: '#ffffff',
                              padding: '0.5rem 0.95rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 800,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                              boxShadow: '0 4px 12px rgba(37,211,102,0.3)',
                            }}
                          >
                            <AppIcon name="whatsapp" size={15} strokeWidth={2.4} />
                            <span>Reply on WhatsApp</span>
                          </a>
                          <a
                            href={`tel:${String(selMessage.phone || '').replace(/\D/g, '').slice(-10)}`}
                            style={{
                              background: 'var(--bg)',
                              color: 'var(--text-primary)',
                              border: '1px solid var(--border)',
                              padding: '0.5rem 0.95rem',
                              borderRadius: '10px',
                              fontSize: '0.82rem',
                              fontWeight: 700,
                              textDecoration: 'none',
                              display: 'inline-flex',
                              alignItems: 'center',
                              gap: '0.45rem',
                            }}
                          >
                            <AppIcon name="phone" size={15} />
                            <span>Call</span>
                          </a>
                        </div>
                      </div>
                    </div>

                    {/* Modal Footer Actions */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', paddingTop: '0.5rem' }}>
                      <button
                        type="button"
                        onClick={() => deleteMessage(selMessage)}
                        style={{
                          background: 'rgba(239, 68, 68, 0.08)',
                          color: '#ef4444',
                          border: '1px solid rgba(239, 68, 68, 0.25)',
                          padding: '0.6rem 1.15rem',
                          borderRadius: '10px',
                          fontSize: '0.84rem',
                          fontWeight: 700,
                          cursor: 'pointer',
                        }}
                      >
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "0.45rem" }}><AppIcon name="trash" size={14} strokeWidth={2.2} /> <span>Delete Inquiry</span></span>
                      </button>

                      <div style={{ display: 'flex', gap: '0.65rem' }}>
                        <button
                          type="button"
                          onClick={() => toggleMessageStatus(selMessage)}
                          style={{
                            background: selMessage.status === 'unread' ? 'var(--orange)' : 'var(--bg-secondary)',
                            color: selMessage.status === 'unread' ? '#ffffff' : 'var(--text-primary)',
                            border: '1px solid var(--border)',
                            padding: '0.6rem 1.25rem',
                            borderRadius: '10px',
                            fontSize: '0.84rem',
                            fontWeight: 800,
                            cursor: 'pointer',
                          }}
                        >
                          {selMessage.status === 'unread' ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                <AppIcon name="check" size={14} strokeWidth={2.8} />
                                <span>Mark as Read</span>
                              </span>
                            ) : (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}>
                                <AppIcon name="mail" size={14} strokeWidth={2} />
                                <span>Mark as Unread</span>
                              </span>
                            )}
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelMessage(null)}
                          style={{
                            background: 'var(--bg-secondary)',
                            color: 'var(--text-secondary)',
                            border: '1px solid var(--border)',
                            padding: '0.6rem 1.15rem',
                            borderRadius: '10px',
                            fontSize: '0.84rem',
                            fontWeight: 700,
                            cursor: 'pointer',
                          }}
                        >
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── PRODUCTS (Tailwind + Pure Pro Design) ── */}
        {tab === 'products' && (
          <div className="space-y-6">
            {/* 1. Header & Actions Bar */}
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Products Catalog</h1>
                  <span className="pro-pill-badge orange">
                    {products.length} SKUs
                  </span>
                  {prodCatFilter !== 'all' && (
                    <span className="pro-pill-badge purple" style={{ textTransform: 'capitalize' }}>
                      Category: {prodCatFilter}
                    </span>
                  )}
                </div>
                <p className="pro-page-sub">
                  Manage product catalog, real-time stock levels, pricing and instant customer discounts.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={() => setNewProductOpen(true)}
                  className="pro-btn-primary"
                >
                  <span style={{ fontSize: '1rem', lineHeight: 1, fontWeight: 900 }}>+</span>
                  <span>Add Product</span>
                </button>
                <button
                  type="button"
                  onClick={exportProductsCSV}
                  title="Export catalog and stock count to CSV"
                  className="pro-btn-subtle"
                >
                  📥 <span>Export CSV</span>
                </button>
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh products"
                  className={`pro-btn-subtle ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh'}</span>
                </button>
              </div>
            </div>

            {/* Edit modal */}
            {editProd && (
              <div className="pro-modal-overlay">
                <div className="pro-modal-box" style={{ maxWidth: '42rem' }}>
                  <div className="pro-modal-header">
                    <h3 className="pro-modal-title">Edit Product Details</h3>
                    <button
                      onClick={() => setEditProd(null)}
                      className="pro-modal-close"
                      title="Close modal"
                    >
                      ✕
                    </button>
                  </div>

                  {/* Image Preview */}
                  {editProd.image && (
                    <div style={{ textAlign: 'center', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                      <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginBottom: '0.35rem' }}>Product Image Preview</div>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={editProd.image}
                        alt={editProd.name}
                        style={{ maxHeight: '140px', margin: '0 auto', objectFit: 'contain', borderRadius: '0.5rem', border: '1px solid #e2e8f0', background: '#fff', padding: '4px' }}
                        onError={e => e.target.style.display = 'none'}
                      />
                    </div>
                  )}

                  <div className="pro-grid-2" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Product Name *</label>
                      <input
                        type="text"
                        value={editProd.name || ''}
                        onChange={e => setEditProd(p => ({ ...p, name: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Category *</label>
                      <select
                        value={editProd.category || ''}
                        onChange={e => setEditProd(p => ({ ...p, category: e.target.value }))}
                        className="pro-select-styled"
                        style={{ width: '100%' }}
                      >
                        {CATEGORIES.map(cat => (
                          <option key={cat} value={cat}>{cat}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <div className="pro-grid-2" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={editProd.price || ''}
                        onChange={e => setEditProd(p => ({ ...p, price: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem', fontWeight: 800, color: '#047857' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>MRP (Original Price ₹) *</label>
                      <input
                        type="number"
                        value={editProd.mrp || ''}
                        onChange={e => setEditProd(p => ({ ...p, mrp: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                  </div>

                  {/* Live Discount Calculator & Presets */}
                  {(() => {
                    const m = Number(editProd.mrp) || 0;
                    const p = Number(editProd.price) || 0;
                    const disc = m > p ? Math.round(((m - p) / m) * 100) : 0;
                    const save = m > p ? (m - p) : 0;
                    return (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: disc > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0', background: disc > 0 ? '#ecfdf5' : '#f8fafc', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: disc > 0 ? '#047857' : '#64748b', marginBottom: '0.45rem' }}>
                          {disc > 0 ? `Active offer: ${disc}% OFF (Customer savings: ₹${save})` : 'Standard price (No discount)'}
                        </div>
                        <div style={{ fontSize: '0.7rem', color: '#64748b', fontWeight: 700, marginBottom: '0.35rem' }}>1-Click offer presets:</div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                const baseM = Number(editProd.mrp) || Number(editProd.price) || 100;
                                const calcP = Math.max(1, Math.round(baseM * (1 - pct / 100)));
                                setEditProd(curr => ({
                                  ...curr,
                                  mrp: baseM,
                                  price: calcP,
                                  badge: `${pct}% OFF`,
                                }));
                              }}
                              className="pro-chip-btn"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                            >
                              {pct}% OFF
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div className="pro-grid-2" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Stock Quantity</label>
                      <input
                        type="number"
                        value={editProd.stock || ''}
                        onChange={e => setEditProd(p => ({ ...p, stock: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Offer / Promotion Badge</label>
                      <input
                        type="text"
                        value={editProd.badge || ''}
                        onChange={e => setEditProd(p => ({ ...p, badge: e.target.value }))}
                        placeholder="e.g. 20% OFF, Mega Sale"
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                  </div>

                  <div style={{ marginBottom: '1rem' }}>
                    <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>
                      <span>Product Image (URL ya Direct File Upload)</span>
                      {imageUploading && <span style={{ color: '#ea580c', fontWeight: 800 }}>Uploading image...</span>}
                    </label>
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                      <input
                        type="text"
                        value={editProd.image || ''}
                        onChange={e => setEditProd(p => ({ ...p, image: e.target.value }))}
                        placeholder="Image URL paste karein ya file chunein"
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem', flex: 1 }}
                      />
                      <label className="pro-btn pro-btn-primary" style={{ cursor: 'pointer', whiteSpace: 'nowrap' }}>
                        {imageUploading ? '⏳ Uploading...' : '📷 File Upload'}
                        <input
                          type="file"
                          accept="image/*"
                          disabled={imageUploading}
                          style={{ display: 'none' }}
                          onChange={e => handleUploadImageFile(e, editProd.id, 'edit')}
                        />
                      </label>
                    </div>
                  </div>

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Description</label>
                    <textarea
                      rows={3}
                      value={editProd.desc || ''}
                      onChange={e => setEditProd(p => ({ ...p, desc: e.target.value }))}
                      className="pro-search-input"
                      style={{ padding: '0.65rem 0.85rem', height: 'auto', resize: 'vertical' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveProd(editProd)}
                      className="pro-btn pro-btn-primary"
                      style={{ flex: 1, padding: '0.75rem 1.25rem' }}
                    >
                      💾 Save Changes
                    </button>
                    <button
                      type="button"
                      onClick={() => setEditProd(null)}
                      className="pro-btn pro-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Dedicated Quick Price & Offer Modal */}
            {offerProd && (
              <div className="pro-modal-overlay">
                <div className="pro-modal-box" style={{ maxWidth: '32rem' }}>
                  <div className="pro-modal-header">
                    <div>
                      <h3 className="pro-modal-title">Price & Offer Manager</h3>
                      <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0.2rem 0 0' }}>{offerProd.name}</p>
                    </div>
                    <button
                      onClick={() => setOfferProd(null)}
                      className="pro-modal-close"
                      title="Close modal"
                    >
                      ✕
                    </button>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.75rem', background: '#f8fafc', borderRadius: '0.75rem', border: '1px solid #e2e8f0', marginBottom: '1rem' }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={offerProd.image}
                      alt={offerProd.name}
                      style={{ width: '48px', height: '48px', objectFit: 'contain', borderRadius: '0.5rem', background: '#fff', padding: '4px', border: '1px solid #e2e8f0', flexShrink: 0 }}
                      onError={e => e.target.style.display = 'none'}
                    />
                    <div>
                      <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>{offerProd.name}</div>
                      <div style={{ fontSize: '0.75rem', color: '#ea580c', fontWeight: 700, textTransform: 'capitalize' }}>{offerProd.category}</div>
                    </div>
                  </div>

                  <div className="pro-grid-2" style={{ marginBottom: '1rem' }}>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>MRP (Original ₹) *</label>
                      <input
                        type="number"
                        value={offerProd.mrp || ''}
                        onChange={e => setOfferProd(p => ({ ...p, mrp: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem' }}
                      />
                    </div>
                    <div>
                      <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Offer Selling Price (₹) *</label>
                      <input
                        type="number"
                        value={offerProd.price || ''}
                        onChange={e => setOfferProd(p => ({ ...p, price: e.target.value }))}
                        className="pro-search-input"
                        style={{ paddingLeft: '0.85rem', fontWeight: 800, color: '#047857', border: '2px solid #10b981' }}
                      />
                    </div>
                  </div>

                  {/* Live Discount Calculator */}
                  {(() => {
                    const m = Number(offerProd.mrp) || 0;
                    const p = Number(offerProd.price) || 0;
                    const disc = m > p ? Math.round(((m - p) / m) * 100) : 0;
                    const save = m > p ? (m - p) : 0;
                    return (
                      <div style={{ padding: '0.75rem 1rem', borderRadius: '0.75rem', border: disc > 0 ? '1px solid #a7f3d0' : '1px solid #e2e8f0', background: disc > 0 ? '#ecfdf5' : '#f8fafc', marginBottom: '1rem' }}>
                        <div style={{ fontSize: '0.75rem', fontWeight: 800, color: disc > 0 ? '#047857' : '#64748b', marginBottom: '0.45rem' }}>
                          {disc > 0 ? `Discount: ${disc}% OFF • Customer Savings: ₹${save}` : 'Regular price (No discount)'}
                        </div>
                        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
                          {[10, 15, 20, 25, 30, 40, 50].map(pct => (
                            <button
                              key={pct}
                              type="button"
                              onClick={() => {
                                const baseM = Number(offerProd.mrp) || Number(offerProd.price) || 100;
                                const calcP = Math.max(1, Math.round(baseM * (1 - pct / 100)));
                                setOfferProd(curr => ({
                                  ...curr,
                                  mrp: baseM,
                                  price: calcP,
                                  badge: `${pct}% OFF`,
                                }));
                              }}
                              className="pro-chip-btn"
                              style={{ padding: '0.2rem 0.55rem', fontSize: '0.7rem' }}
                            >
                              {pct}% OFF
                            </button>
                          ))}
                        </div>
                      </div>
                    );
                  })()}

                  <div style={{ marginBottom: '1.25rem' }}>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.35rem' }}>Offer Badge (Tag)</label>
                    <input
                      type="text"
                      value={offerProd.badge || ''}
                      onChange={e => setOfferProd(p => ({ ...p, badge: e.target.value }))}
                      placeholder="e.g. 20% OFF, Diwali Deal"
                      className="pro-search-input"
                      style={{ paddingLeft: '0.85rem' }}
                    />
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', paddingTop: '0.75rem', borderTop: '1px solid #e2e8f0' }}>
                    <button
                      type="button"
                      onClick={() => handleSaveOffer(offerProd)}
                      className="pro-btn pro-btn-primary"
                      style={{ flex: 1, padding: '0.75rem 1.25rem' }}
                    >
                      💾 Set Price & Offer
                    </button>
                    <button
                      type="button"
                      onClick={() => setOfferProd(null)}
                      className="pro-btn pro-btn-secondary"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* 2. Executive Search, Filter & Quick Category Bar */}
            <div className="pro-filter-box">
              <div className="pro-search-row">
                {/* Search Bar */}
                <div className="pro-search-input-wrap">
                  <span className="icon">
                    <AppIcon name="search" size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search by product name, SKU or ID..."
                    value={prodSearch}
                    onChange={e => setProdSearch(e.target.value)}
                    className="pro-search-input"
                  />
                  {prodSearch && (
                    <button
                      type="button"
                      onClick={() => setProdSearch('')}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  )}
                </div>

                {/* Category & Sort Dropdowns */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full md:w-auto">
                  <select
                    value={prodCatFilter}
                    onChange={e => setProdCatFilter(e.target.value)}
                    className="pro-select-styled"
                  >
                    <option value="all">📂 All Categories ({products.length})</option>
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>

                  <select
                    value={prodSort}
                    onChange={e => setProdSort(e.target.value)}
                    className="pro-select-styled"
                  >
                    <option value="name">📌 Name (A-Z)</option>
                    <option value="price-asc">Price (Low → High)</option>
                    <option value="price-desc">Price (High → Low)</option>
                    <option value="stock">Stock Available</option>
                    <option value="rating">⭐ Highest Rating</option>
                    <option value="wishlist">❤️ Most Wishlisted</option>
                  </select>
                </div>
              </div>

              {/* Horizontal Category Quick-Pills */}
              <div className="pro-chips-row">
                <button
                  type="button"
                  onClick={() => setProdCatFilter('all')}
                  className={`pro-chip-btn ${prodCatFilter === 'all' ? 'active' : ''}`}
                >
                  All ({products.length})
                </button>
                {CATEGORIES.map(cat => {
                  const count = products.filter(p => p.category === cat).length;
                  const isActive = prodCatFilter === cat;
                  return (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setProdCatFilter(cat)}
                      className={`pro-chip-btn ${isActive ? 'active' : ''}`}
                      style={{ textTransform: 'capitalize' }}
                    >
                      {cat} {count > 0 ? `(${count})` : ''}
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Summary & Clear */}
              {(prodSearch || prodCatFilter !== 'all' || prodSort !== 'name') && (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.75rem', color: '#64748b', background: '#f8fafc', padding: '0.5rem 0.75rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                  <span>
                    Showing <strong style={{ color: '#0f172a' }}>{getFilteredProducts().length}</strong> of {products.length} products
                  </span>
                  <button
                    type="button"
                    onClick={() => { setProdSearch(''); setProdCatFilter('all'); setProdSort('name'); }}
                    style={{ color: '#ea580c', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}
                  >
                    ✕ Reset All Filters
                  </button>
                </div>
              )}
            </div>

            {/* 3. Category Stats Cards Grid */}
            {Object.keys(getCategoryStats()).length > 0 && (
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3">
                {Object.entries(getCategoryStats()).map(([cat, stat]) => (
                  <div
                    key={cat}
                    onClick={() => setProdCatFilter(cat)}
                    className="pro-card"
                    style={{ padding: '0.75rem 1rem', cursor: 'pointer', transition: 'all 0.15s ease' }}
                  >
                    <div style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748b', textTransform: 'capitalize' }}>{cat}</div>
                    <div style={{ fontSize: '1.05rem', fontWeight: 900, color: 'var(--orange-dark)', marginTop: '0.2rem' }}>{stat.count} items</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem' }}>Stock: {stat.totalStock}</div>
                    <div style={{ fontSize: '0.7rem', color: '#64748b' }}>Avg: {formatCurrency(stat.avgPrice)}</div>
                  </div>
                ))}
              </div>
            )}

            {/* 4. Desktop Products Table */}
            <div className="pro-table-card hidden lg:block">
              <div className="pro-table-inner">
                <table className="pro-data-table">
                  <thead>
                    <tr>
                      <th>Image</th>
                      <th>Product Name</th>
                      <th>Category</th>
                      <th>Price / MRP</th>
                      <th>Stock</th>
                      <th style={{ textAlign: 'center' }}>❤️ Wishlist</th>
                      <th style={{ textAlign: 'center' }}>📦 Sold</th>
                      <th>Rating</th>
                      <th style={{ textAlign: 'right' }}>Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {getFilteredProducts().map(p => {
                      const hidden = getAvailabilityState(p.id);
                      const wCount = Number(wishlistCounts[p.id] || wishlistCounts[String(p.id)] || 0);
                      const sCount = Number(productSalesMap[String(p.id)] || productSalesMap[String(p.name || '').trim().toLowerCase()] || 0);
                      const isOutOfStock = Number(p.stock) === 0;
                      const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 5;

                      return (
                        <tr key={p.id} className="hover:bg-gray-50/80 transition-colors">
                          <td className="px-4 py-3.5">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={p.image}
                              alt={p.name}
                              className="w-11 h-11 object-contain rounded-lg border border-gray-200 bg-gray-50 p-1 cursor-pointer hover:scale-105 transition-transform"
                              onError={e => e.target.style.display = 'none'}
                              title="Click to view full image"
                            />
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-semibold text-gray-900 max-w-[220px] truncate" title={p.name}>
                              {p.name}
                            </div>
                            <div className="flex items-center gap-1.5 mt-0.5">
                              {p.badge && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200">
                                  {p.badge}
                                </span>
                              )}
                              {hidden && (
                                <span className="inline-flex items-center px-2 py-0.2 rounded-full text-[10px] font-bold bg-gray-100 text-gray-600 border border-gray-200">
                                  Hidden
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-gray-600 capitalize text-xs">
                            {p.category}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="font-bold text-emerald-700">{formatCurrency(p.price)}</div>
                            {p.mrp > p.price && (
                              <div className="text-xs text-gray-400 line-through font-normal">{formatCurrency(p.mrp)}</div>
                            )}
                          </td>
                          <td className="px-4 py-3.5">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                min={0}
                                defaultValue={p.stock}
                                className="w-16 px-2 py-1 text-xs font-semibold text-center rounded-lg border border-gray-300 focus:ring-2 focus:ring-orange-500 focus:border-orange-500 outline-none"
                                onBlur={e => handleStockUpdate(p.id, e.target.value)}
                              />
                              {isOutOfStock ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Out</span>
                              ) : isLowStock ? (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Low</span>
                              ) : (
                                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">In</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 font-bold text-xs">
                              <AppIcon name="heart" size={13} fill="#e11d48" /> {wCount}
                            </span>
                          </td>
                          <td className="px-4 py-3.5 text-center">
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-200 font-bold text-xs">
                              📦 {sCount}
                            </span>
                          </td>
                          <td className="px-4 py-3.5">
                            <span className="text-amber-500 font-bold text-xs">★ {p.rating}</span>
                            <span className="text-gray-400 text-xs font-normal ml-1">({p.reviews})</span>
                          </td>
                          <td className="px-4 py-3.5 text-right">
                            <div className="pro-action-group" style={{ justifyContent: 'flex-end' }}>
                              <button
                                onClick={() => setOfferProd({ ...p })}
                                title="Quick Price & Offer"
                                className="pro-action-btn offer"
                              >
                                Offer
                              </button>
                              <button
                                onClick={() => setEditProd({ ...p })}
                                title="Full Edit product"
                                className="pro-action-btn edit"
                              >
                                Edit
                              </button>
                              <label
                                title="Direct photo upload for this product"
                                className="pro-action-btn img"
                              >
                                📷 Img
                                <input
                                  type="file"
                                  accept="image/*"
                                  disabled={imageUploading}
                                  style={{ display: 'none' }}
                                  onChange={e => handleUploadImageFile(e, p.id, 'direct')}
                                />
                              </label>
                              <button
                                onClick={() => toggleAvailability(p.id, hidden)}
                                title={hidden ? 'Show product' : 'Hide product'}
                                className="pro-action-btn edit"
                              >
                                {hidden ? 'Show' : 'Hide'}
                              </button>
                              <button
                                onClick={() => handleDeleteProduct(p.id)}
                                title="Delete product"
                                className="pro-action-btn delete"
                              >
                                Delete
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                    {getFilteredProducts().length === 0 && (
                      <tr>
                        <td colSpan={9} className="text-center py-12 text-gray-500 text-sm">
                          🔍 Koi product nahi mila. Search query ya filter check karein.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* 5. Mobile Products Grid */}
            <div className="lg:hidden space-y-4">
              {getFilteredProducts().map(p => {
                const hidden = getAvailabilityState(p.id);
                const discount = p.mrp > p.price ? Math.round(((p.mrp - p.price) / p.mrp) * 100) : 0;
                const isOutOfStock = Number(p.stock) === 0;
                const isLowStock = Number(p.stock) > 0 && Number(p.stock) <= 5;

                return (
                  <div key={p.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                    <div className="flex gap-3">
                      <div className="relative w-16 h-16 rounded-lg border border-gray-200 bg-gray-50 p-1 flex-shrink-0">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-full h-full object-contain"
                          onError={e => { e.target.style.display = 'none'; }}
                        />
                        {discount > 0 && (
                          <span className="absolute -top-1.5 -right-1.5 px-1.5 py-0.5 rounded-full text-[9px] font-bold bg-red-500 text-white shadow-xs">
                            {discount}%
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="font-semibold text-gray-900 text-sm truncate">{p.name}</div>
                        <div className="text-xs text-gray-500 capitalize">{p.category} • ID #{p.id}</div>
                        <div className="flex items-center gap-2 mt-1">
                          <strong className="text-emerald-700 text-sm">{formatCurrency(p.price)}</strong>
                          {p.mrp > p.price && (
                            <span className="text-xs text-gray-400 line-through">{formatCurrency(p.mrp)}</span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-2 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-600">Stock:</span>
                        <input
                          type="number"
                          min={0}
                          defaultValue={p.stock}
                          className="w-14 px-1.5 py-0.5 text-center font-bold border border-gray-300 rounded"
                          onBlur={e => handleStockUpdate(p.id, e.target.value)}
                        />
                        {isOutOfStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">Out</span>
                        ) : isLowStock ? (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">Low</span>
                        ) : (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">In</span>
                        )}
                      </div>
                      <div className="text-gray-500 text-xs">
                        ❤️ {wishlistCounts[p.id] || wishlistCounts[String(p.id)] || 0} saves • 📦 {productSalesMap[String(p.id)] || 0} sold
                      </div>
                    </div>

                    <div className="flex gap-2 pt-2 border-t border-gray-100">
                      <button
                        type="button"
                        onClick={() => setOfferProd({ ...p })}
                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-orange-50 text-orange-700 border border-orange-200"
                      >
                        🏷️ Offer
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditProd({ ...p })}
                        className="flex-1 py-1.5 text-xs font-semibold rounded bg-gray-50 text-gray-700 border border-gray-200"
                      >
                        ✏️ Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleAvailability(p.id, hidden)}
                        className="px-3 py-1.5 text-xs font-medium rounded text-gray-600 hover:bg-gray-100"
                      >
                        {hidden ? '👁️' : '🙈'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteProduct(p.id)}
                        className="px-3 py-1.5 text-xs font-medium rounded text-red-600 hover:bg-red-50"
                      >
                        🗑️
                      </button>
                    </div>
                  </div>
                );
              })}
              {getFilteredProducts().length === 0 && (
                <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
                  <strong className="text-gray-900 block text-sm">No products found</strong>
                  <p className="text-xs text-gray-500 mt-1">Search term ya category filter change karein.</p>
                  <button
                    onClick={() => { setProdSearch(''); setProdCatFilter('all'); setProdSort('name'); }}
                    className="mt-3 px-3 py-1.5 bg-orange-500 text-white text-xs font-semibold rounded-lg"
                  >
                    Clear All Filters
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── CATEGORIES (Tailwind Enterprise Edition) ── */}
        {tab === 'categories' && (
          <div className="space-y-6">
            {/* 1. Header & Actions Bar */}
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Categories Management</h1>
                  <span className="pro-pill-badge purple">
                    {Object.keys(categoryStats).length} Categories
                  </span>
                  <span className="pro-pill-badge green">
                    {products.length} Products
                  </span>
                </div>
                <p className="pro-page-sub">
                  Catalogue ke sabhi product categories, stock distribution aur pricing health.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh categories"
                  className={`pro-btn-subtle ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Categories'}</span>
                </button>
              </div>
            </div>

            {/* 2. 3-Column KPI Metric Cards */}
            <div className="pro-kpi-grid">
              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">CATEGORIES</span>
                  <div className="pro-kpi-icon" style={{ background: '#faf5ff', color: '#9333ea' }}>
                    <AppIcon name="grid" size={16} />
                  </div>
                </div>
                <div className="pro-kpi-value">{Object.keys(categoryStats).length}</div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill" style={{ background: '#faf5ff', color: '#9333ea' }}>Departments</span>
                  <span className="pro-kpi-note">Active departments</span>
                </div>
              </div>

              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label" style={{ color: 'var(--orange-dark)' }}>TOTAL ITEMS</span>
                  <div className="pro-kpi-icon" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}>
                    <AppIcon name="shop" size={16} />
                  </div>
                </div>
                <div className="pro-kpi-value" style={{ color: 'var(--orange)' }}>{products.length}</div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>Catalog</span>
                  <span className="pro-kpi-note">Active SKUs</span>
                </div>
              </div>

              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label" style={{ color: 'var(--green-dark)' }}>IN STOCK UNITS</span>
                  <div className="pro-kpi-icon green">
                    <AppIcon name="clipboard" size={16} />
                  </div>
                </div>
                <div className="pro-kpi-value" style={{ color: 'var(--green-dark)' }}>
                  {products.reduce((sum, p) => sum + Number(p.stock || 0), 0)}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill green">Available</span>
                  <span className="pro-kpi-note">Ready for delivery</span>
                </div>
              </div>
            </div>

            {/* 3. Category Search & Filter */}
            <div className="pro-filter-box">
              <div className="pro-search-row">
                <div className="pro-search-input-wrap">
                  <span className="icon">
                    <AppIcon name="search" size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Filter category name (e.g. pen, notebook, colors)..."
                    value={categorySearch}
                    onChange={e => setCategorySearch(e.target.value)}
                    className="pro-search-input"
                  />
                  {categorySearch && (
                    <button
                      type="button"
                      onClick={() => setCategorySearch('')}
                      style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* 4. Enterprise Category Cards Grid */}
            <div className="pro-cat-grid">
              {Object.entries(categoryStats)
                .filter(([cat]) => !categorySearch || cat.toLowerCase().includes(categorySearch.toLowerCase()))
                .map(([category, stats]) => (
                  <button
                    key={category}
                    onClick={() => openCategoryProducts(category)}
                    className="pro-card"
                    style={{ padding: '1.25rem', textAlign: 'left', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                        <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(249, 115, 22, 0.12)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          <AppIcon name="grid" size={18} />
                        </div>
                        <span className="pro-pill-badge gray">
                          {stats.count} products
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-primary)', textTransform: 'capitalize', margin: '0 0 0.5rem' }}>
                        {category}
                      </h3>
                      <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
                        <div>Stock: <strong style={{ color: 'var(--text-primary)' }}>{stats.totalStock} units available</strong></div>
                        <div>Price: <strong style={{ color: 'var(--text-primary)' }}>Avg {formatCurrency(stats.avgPrice)}</strong></div>
                      </div>
                    </div>

                    <div style={{ paddingTop: '0.85rem', marginTop: '1rem', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '0.78rem', fontWeight: 700, color: 'var(--orange)' }}>
                      <span>View related products</span>
                      <span>→</span>
                    </div>
                  </button>
                ))}
            </div>
            {Object.entries(categoryStats).filter(([cat]) => !categorySearch || cat.toLowerCase().includes(categorySearch.toLowerCase())).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
                🔍 Koi matching category nahi mili. Filter check karein.
              </div>
            )}
          </div>
        )}

        {/* ── CUSTOMERS (Tailwind Enterprise Edition) ── */}
        {tab === 'customers' && (() => {
          const totalSpend = orders.reduce((sum, order) => sum + Number(order.total || 0), 0);
          const activeBuyers = customerDirectory.filter(c => !c.blocked);
          const blockedCustomers = customerDirectory.filter(c => c.blocked);

          return (
            <div className="space-y-6">
              {/* 1. Header & Actions Bar */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Customer Directory</h1>
                    <span className="pro-pill-badge purple">
                      {customerDirectory.length} Accounts
                    </span>
                    <span className="pro-pill-badge green">
                      🛍️ {activeBuyers.length} Active Buyers
                    </span>
                  </div>
                  <p className="pro-page-sub">
                    Registered customer accounts, orders history, WhatsApp communication aur lifetime spend analytics.
                  </p>
                </div>
                <div className="pro-page-actions">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    title="Refresh customer directory"
                    className={`pro-btn-subtle ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Directory'}</span>
                  </button>
                </div>
              </div>

              {/* 2. 4-Column KPI Metric Cards */}
              <div className="pro-kpi-grid">
                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">TOTAL ACCOUNTS</span>
                    <div className="pro-kpi-icon"><AppIcon name="user" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value">{customerDirectory.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill">Store Users</span>
                    <span className="pro-kpi-note">Bakani storefront</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--green-dark)' }}>ACTIVE BUYERS</span>
                    <div className="pro-kpi-icon green"><AppIcon name="shop" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--green-dark)' }}>{activeBuyers.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill green">Purchasers</span>
                    <span className="pro-kpi-note">Verified buyers</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--red)' }}>BLOCKED</span>
                    <div className="pro-kpi-icon" style={{ background: 'var(--red-light)', color: 'var(--red)' }}><AppIcon name="cancel" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--red)' }}>{blockedCustomers.length}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill" style={{ background: 'var(--red-light)', color: 'var(--red)' }}>Restricted</span>
                    <span className="pro-kpi-note">Account blocked</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label" style={{ color: 'var(--orange-dark)' }}>TOTAL SPEND</span>
                    <div className="pro-kpi-icon" style={{ background: 'var(--orange-light)', color: 'var(--orange)' }}><AppIcon name="credit" size={16} /></div>
                  </div>
                  <div className="pro-kpi-value" style={{ color: 'var(--orange)' }}>{formatCurrency(totalSpend)}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill" style={{ background: 'var(--orange-light)', color: 'var(--orange-dark)' }}>Volume</span>
                    <span className="pro-kpi-note">Gross store spend</span>
                  </div>
                </div>
              </div>

              {/* 3. Customer Search & Filter */}
              <div className="pro-filter-box">
                <div className="pro-search-row">
                  <div className="pro-search-input-wrap">
                    <span className="icon">
                      <AppIcon name="search" size={16} />
                    </span>
                    <input
                      type="text"
                      placeholder="Search customer by name, phone, or email..."
                      value={customerSearch}
                      onChange={e => setCustomerSearch(e.target.value)}
                      className="pro-search-input"
                    />
                    {customerSearch && (
                      <button
                        type="button"
                        onClick={() => setCustomerSearch('')}
                        style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'transparent', border: 'none', cursor: 'pointer', color: '#94a3b8', fontWeight: 'bold' }}
                      >
                        ✕
                      </button>
                    )}
                  </div>
                </div>
              </div>

              {/* 4. Desktop Enterprise Customers Table */}
              <div className="pro-table-card hidden lg:block">
                <div className="pro-table-inner">
                  <table className="pro-data-table">
                    <thead className="bg-gray-50/80 border-b border-gray-200 text-gray-500 uppercase text-xs font-semibold tracking-wider">
                      <tr>
                        <th className="px-4 py-3.5">Customer</th>
                        <th className="px-4 py-3.5">Phone / Quick Contact</th>
                        <th className="px-4 py-3.5">Email</th>
                        <th className="px-4 py-3.5">Orders</th>
                        <th className="px-4 py-3.5">Total Spend</th>
                        <th className="px-4 py-3.5">Status</th>
                        <th className="px-4 py-3.5 text-right">Account Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {filteredCustomerDirectory
                        .sort((a, b) => (b.spend || 0) - (a.spend || 0))
                        .map(customer => {
                          const cleanPhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
                          const initials = (customer.name || 'C')
                            .split(' ')
                            .map(part => part[0])
                            .slice(0, 2)
                            .join('')
                            .toUpperCase();
                          return (
                            <tr key={customer.id || customer.phone || customer.email} className="hover:bg-gray-50/80 transition-colors">
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-3">
                                  <div className="w-9 h-9 rounded-full bg-orange-100 text-orange-800 flex items-center justify-center font-bold text-xs flex-shrink-0">
                                    {initials}
                                  </div>
                                  <div>
                                    <div className="font-semibold text-gray-900">{customer.name || 'Customer'}</div>
                                    <div className="text-[11px] text-gray-500">
                                      {customer.id ? 'Registered Profile' : 'Guest Buyer'}
                                    </div>
                                  </div>
                                </div>
                              </td>
                              <td className="px-4 py-3.5">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium text-gray-800">{customer.phone || '-'}</span>
                                  {cleanPhone && cleanPhone.length === 10 && (
                                    <div className="inline-flex gap-1.5">
                                      <a
                                        href={`tel:+91${cleanPhone}`}
                                        title="Call customer"
                                        className="w-7 h-7 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 flex items-center justify-center transition-colors"
                                      >
                                        <AppIcon name="phone" size={13} />
                                      </a>
                                      <a
                                        href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent('Namaste ' + (customer.name || '') + ', Gupta General Store Bakani se sampark kar rahe hain.')}`}
                                        target="_blank"
                                        rel="noreferrer"
                                        title="WhatsApp customer"
                                        className="w-7 h-7 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-600 flex items-center justify-center transition-colors"
                                      >
                                        <AppIcon name="whatsapp" size={13} />
                                      </a>
                                    </div>
                                  )}
                                </div>
                              </td>
                              <td className="px-4 py-3.5 text-gray-600 text-xs">
                                {customer.email || '-'}
                              </td>
                              <td className="px-4 py-3.5">
                                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold bg-gray-100 text-gray-700">
                                  {customer.orders || 0} {customer.orders === 1 ? 'order' : 'orders'}
                                </span>
                              </td>
                              <td className="px-4 py-3.5 font-bold text-emerald-700">
                                {formatCurrency(customer.spend || 0)}
                              </td>
                              <td className="px-4 py-3.5">
                                {customer.blocked ? (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-50 text-red-700 border border-red-200">
                                    Blocked
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                                    Active
                                  </span>
                                )}
                              </td>
                              <td className="px-4 py-3.5 text-right">
                                {customer.id ? (
                                  <button
                                    onClick={() => toggleCustomerBlock(customer)}
                                    className={`pro-action-btn ${customer.blocked ? 'offer' : 'delete'}`}
                                  >
                                    {customer.blocked ? 'Unblock' : 'Block'}
                                  </button>
                                ) : (
                                  <span className="text-gray-400 text-xs font-normal">Guest</span>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      {filteredCustomerDirectory.length === 0 && (
                        <tr>
                          <td colSpan={7} className="text-center py-12 text-gray-500 text-sm">
                            🔍 Koi matching customers nahi mile. Search filter check karein.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* 5. Mobile Customers Feed */}
              <div className="lg:hidden space-y-3">
                {filteredCustomerDirectory
                  .sort((a, b) => (b.spend || 0) - (a.spend || 0))
                  .map(customer => {
                    const cleanPhone = String(customer.phone || '').replace(/\D/g, '').slice(-10);
                    const initials = (customer.name || 'C')
                      .split(' ')
                      .map(part => part[0])
                      .slice(0, 2)
                      .join('')
                      .toUpperCase();
                    return (
                      <div key={customer.id || customer.phone || customer.email} className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full bg-orange-100 text-orange-800 font-bold text-xs flex items-center justify-center">
                              {initials}
                            </div>
                            <div>
                              <div className="font-semibold text-gray-900 text-sm">{customer.name || 'Customer'}</div>
                              <div className="text-[10px] text-gray-500">{customer.id ? 'Registered Profile' : 'Guest Buyer'}</div>
                            </div>
                          </div>
                          {customer.blocked ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">
                              Blocked
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Active
                            </span>
                          )}
                        </div>

                        <div className="text-xs text-gray-600 space-y-1 bg-gray-50 p-2.5 rounded-lg border border-gray-100">
                          <div className="flex justify-between">
                            <span>Phone:</span>
                            <strong className="text-gray-900">{customer.phone || '-'}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Total Spend:</span>
                            <strong className="text-emerald-700 font-bold">{formatCurrency(customer.spend || 0)}</strong>
                          </div>
                          <div className="flex justify-between">
                            <span>Orders:</span>
                            <span>{customer.orders || 0} {customer.orders === 1 ? 'order' : 'orders'}</span>
                          </div>
                        </div>

                        <div className="flex gap-2 pt-1">
                          {cleanPhone && cleanPhone.length === 10 && (
                            <>
                              <a
                                href={`tel:+91${cleanPhone}`}
                                className="flex-1 py-1.5 text-xs font-semibold rounded bg-gray-100 text-gray-700 text-center"
                              >
                                📞 Call
                              </a>
                              <a
                                href={`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(`Namaste ${customer.name || 'Customer'} ji, Gupta Store Bakani se sampark kar rahe hain.`)}`}
                                target="_blank"
                                rel="noreferrer"
                                className="flex-1 py-1.5 text-xs font-semibold rounded bg-emerald-50 text-emerald-700 border border-emerald-200 text-center"
                              >
                                💬 WhatsApp
                              </a>
                            </>
                          )}
                          {customer.id && (
                            <button
                              type="button"
                              onClick={() => toggleCustomerBlock(customer)}
                              className={`px-3 py-1.5 text-xs font-semibold rounded ${
                                customer.blocked
                                  ? 'bg-orange-50 text-orange-700 border border-orange-200'
                                  : 'bg-red-50 text-red-700 border border-red-200'
                              }`}
                            >
                              {customer.blocked ? 'Unblock' : 'Block'}
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                {filteredCustomerDirectory.length === 0 && (
                  <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
                    🔍 Koi customer nahi mila. Search query check karein.
                  </div>
                )}
              </div>
            </div>
          );
        })()}

        {/* ── COUPONS (Tailwind Enterprise Edition) ── */}
        {tab === 'coupons' && (
          <div className="space-y-6">
            {/* 1. Header & Actions Bar */}
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Coupons & Discounts</h1>
                  <span className="pro-pill-badge orange">
                    🏷️ {Object.keys(couponCodes).length} Active Codes
                  </span>
                </div>
                <p className="pro-page-sub">
                  Store ke active promo codes, discount percentages aur minimum order threshold manage karein.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh coupons"
                  className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Coupons'}</span>
                </button>
              </div>
            </div>

            {/* 2. 3-Column KPI Metric Cards */}
            <div className="pro-grid-3">
              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Active Coupons</span>
                  <div className="pro-kpi-icon orange">
                    🏷️
                  </div>
                </div>
                <div className="pro-kpi-value">{Object.keys(couponCodes).length}</div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill orange">Live</span>
                  <span className="pro-kpi-note">Checkout vouchers</span>
                </div>
              </div>

              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Max Discount</span>
                  <div className="pro-kpi-icon green">
                    💰
                  </div>
                </div>
                <div className="pro-kpi-value text-emerald-600">
                  {formatCurrency(
                    Math.max(...Object.keys(couponCodes).map(code => getCouponOffer(code, couponCodes).discount || 0), 0)
                  )}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill green">Top Saving</span>
                  <span className="pro-kpi-note">Peak discount</span>
                </div>
              </div>

              <div className="pro-kpi-card">
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">All-Order Codes</span>
                  <div className="pro-kpi-icon blue">
                    ⚡
                  </div>
                </div>
                <div className="pro-kpi-value text-sky-600">
                  {Object.keys(couponCodes).filter(c => (getCouponOffer(c, couponCodes).minOrder || 0) <= 0).length}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill blue">Zero Limit</span>
                  <span className="pro-kpi-note">No minimum cart</span>
                </div>
              </div>
            </div>

            {/* 3. Create / Edit Coupon Form Card */}
            <div className="pro-card">
              <div style={{ marginBottom: '1rem', paddingBottom: '0.75rem', borderBottom: '1px solid #f1f5f9' }}>
                <h3 className="pro-card-title">
                  {editingCoupon ? `Edit Coupon: ${editingCoupon}` : '✨ Create New Discount Coupon'}
                </h3>
                <p className="pro-card-sub" style={{ marginTop: '0.25rem' }}>
                  Minimum order amount ₹0 rakhne par coupon sabhi cart amounts par valid hoga.
                </p>
              </div>

              <form onSubmit={saveCoupon} className="pro-grid-3">
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Coupon Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. FESTIVE50"
                    value={newCoupon.code}
                    disabled={Boolean(editingCoupon)}
                    onChange={e => setNewCoupon(v => ({ ...v, code: e.target.value.toUpperCase() }))}
                    required
                    className="pro-search-input"
                    style={{ textTransform: 'uppercase', fontFamily: 'monospace', fontWeight: 700, paddingLeft: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Discount Amount (₹) *</label>
                  <input
                    type="number"
                    min="1"
                    placeholder="e.g. 50"
                    value={newCoupon.discount}
                    onChange={e => setNewCoupon(v => ({ ...v, discount: e.target.value }))}
                    required
                    className="pro-search-input"
                    style={{ fontWeight: 700, color: '#047857', paddingLeft: '0.85rem' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 700, color: '#475569', marginBottom: '0.35rem' }}>Min Cart Shopping (₹)</label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = No minimum"
                    value={newCoupon.minOrder}
                    onChange={e => setNewCoupon(v => ({ ...v, minOrder: e.target.value }))}
                    className="pro-search-input"
                    style={{ paddingLeft: '0.85rem' }}
                  />
                </div>
                <div style={{ gridColumn: '1 / -1', display: 'flex', gap: '0.5rem', paddingTop: '0.5rem' }}>
                  <button
                    type="submit"
                    className="pro-btn pro-btn-primary"
                    style={{ flex: 1, padding: '0.75rem 1.5rem' }}
                  >
                    {editingCoupon ? '💾 Save Coupon Changes' : '➕ Create & Publish Coupon'}
                  </button>
                  {editingCoupon && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingCoupon('');
                        setNewCoupon({ code: '', discount: '', minOrder: '' });
                      }}
                      className="pro-btn pro-btn-secondary"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* 4. Active Store Coupons Grid */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                <h4 style={{ fontSize: '0.92rem', fontWeight: 800, color: '#0f172a' }}>
                  Active Store Coupons ({Object.keys(couponCodes).length})
                </h4>
              </div>
              <div className="pro-grid-3">
                {Object.entries(couponCodes).map(([code, rawOffer]) => {
                  const offer = getCouponOffer(code, couponCodes);
                  return (
                    <div
                      key={code}
                      className="pro-card"
                      style={{
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        borderLeft: '4px solid #f97316'
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.75rem' }}>
                          <span className="pro-pill-badge green">
                            ₹{offer.discount} FLAT OFF
                          </span>
                          <span style={{ fontSize: '1.1rem' }}>🏷️</span>
                        </div>
                        <div style={{ fontSize: '1.25rem', fontWeight: 900, fontFamily: 'monospace', letterSpacing: '0.05em', color: '#0f172a' }}>
                          {code}
                        </div>
                        <div style={{ fontSize: '0.78rem', color: '#64748b', marginTop: '0.25rem' }}>
                          {offer.minOrder > 0 ? `Minimum cart: ₹${offer.minOrder}` : 'Valid on all orders'}
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', paddingTop: '0.85rem', marginTop: '1rem', borderTop: '1px solid #f1f5f9' }}>
                        <button
                          type="button"
                          onClick={() => startCouponEdit(code)}
                          className="pro-btn pro-btn-secondary pro-btn-sm"
                          style={{ flex: 1 }}
                        >
                          ✏️ Edit
                        </button>
                        <button
                          type="button"
                          onClick={() => deleteCoupon(code)}
                          className="pro-btn pro-btn-danger pro-btn-sm"
                          style={{ flex: 1 }}
                        >
                          🗑️ Disable
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        )}

        {/* ── REVIEWS (Tailwind Enterprise Edition) ── */}
        {tab === 'reviews' && (() => {
          const totalCustomerReviews = customerReviews.length;
          const avgCustomerRating = totalCustomerReviews > 0
            ? (customerReviews.reduce((sum, r) => sum + (Number(r.rating) || 5), 0) / totalCustomerReviews).toFixed(1)
            : '4.8';
          const fiveStarCount = customerReviews.filter(r => Number(r.rating) === 5).length;
          const verifiedBuyerCount = customerReviews.filter(r => r.verifiedBuyer || r.orderId).length;

          return (
            <div className="space-y-6">
              {/* 1. Header & Actions Bar */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Customer Reviews & Ratings</h1>
                    <span className="pro-pill-badge orange">
                      ★ {avgCustomerRating} Store Rating
                    </span>
                    <span className="pro-pill-badge green">
                      🛡️ {verifiedBuyerCount} Verified Buyers
                    </span>
                  </div>
                  <p className="pro-page-sub">
                    Real verified customer feedback monitor karein aur product reputation manage karein.
                  </p>
                </div>
                <div className="pro-page-actions">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    title="Refresh reviews"
                    className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Reviews'}</span>
                  </button>
                </div>
              </div>

              {/* 2. 4-Column KPI Metric Cards */}
              <div className="pro-kpi-grid">
                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Total Reviews</span>
                    <div className="pro-kpi-icon blue">
                      💬
                    </div>
                  </div>
                  <div className="pro-kpi-value">{totalCustomerReviews}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill blue">Feedback</span>
                    <span className="pro-kpi-note">Customer voices</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Average Rating</span>
                    <div className="pro-kpi-icon orange">
                      ★
                    </div>
                  </div>
                  <div className="pro-kpi-value text-amber-500">★ {avgCustomerRating}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill warning">Overall</span>
                    <span className="pro-kpi-note">Out of 5.0 stars</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">5-Star Reviews</span>
                    <div className="pro-kpi-icon green">
                      🌟
                    </div>
                  </div>
                  <div className="pro-kpi-value text-emerald-600">{fiveStarCount}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill green">Top Tier</span>
                    <span className="pro-kpi-note">Highest score</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Verified Buyers</span>
                    <div className="pro-kpi-icon purple">
                      🛡️
                    </div>
                  </div>
                  <div className="pro-kpi-value text-purple-600">{verifiedBuyerCount}</div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill purple">Genuine</span>
                    <span className="pro-kpi-note">Confirmed orders</span>
                  </div>
                </div>
              </div>

              {/* 3. Sub-tabs Navigation */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                <button
                  type="button"
                  onClick={() => setReviewSubTab('feed')}
                  className={`pro-chip-btn justify-center w-full ${reviewSubTab === 'feed' ? 'active' : ''}`}
                  style={{ padding: '0.65rem 1rem', fontSize: '0.8125rem', textAlign: 'center' }}
                >
                  💬 Customer Feedback Feed ({customerReviews.length})
                </button>
                <button
                  type="button"
                  onClick={() => setReviewSubTab('products')}
                  className={`pro-chip-btn justify-center w-full ${reviewSubTab === 'products' ? 'active' : ''}`}
                  style={{ padding: '0.65rem 1rem', fontSize: '0.8125rem', textAlign: 'center' }}
                >
                  ⭐ Product Ratings Summary ({products.length})
                </button>
              </div>

              {/* 4. Review Feed Content */}
              {reviewSubTab === 'feed' && (
                <div className="pro-card" style={{ padding: '1rem' }}>
                  <div className="pro-filter-box" style={{ marginBottom: '1rem', border: 'none', padding: 0, boxShadow: 'none' }}>
                    <div className="pro-search-row flex-col sm:flex-row gap-2.5 w-full">
                      <div className="pro-search-input-wrap w-full">
                        <span className="icon">
                          <AppIcon name="search" size={16} />
                        </span>
                        <input
                          type="text"
                          placeholder="Search review, product, customer name..."
                          value={reviewSearch}
                          onChange={e => setReviewSearch(e.target.value)}
                          className="pro-search-input"
                        />
                      </div>
                      <select
                        value={reviewFilterRating}
                        onChange={e => setReviewFilterRating(e.target.value)}
                        className="pro-select-styled w-full sm:w-auto sm:min-w-[160px]"
                      >
                        <option value="all">All Star Ratings</option>
                        <option value="5">5 Stars only</option>
                        <option value="4">4 Stars only</option>
                        <option value="3">3 Stars only</option>
                        <option value="2">2 Stars only</option>
                        <option value="1">1 Star only</option>
                      </select>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {filteredCustomerReviews.map(rev => {
                      const initials = (rev.customerName || 'Customer')
                        .split(' ')
                        .map(p => p[0])
                        .slice(0, 2)
                        .join('')
                        .toUpperCase();
                      const isDeleting = deletingReviewId === rev.id;

                      return (
                        <div
                          key={rev.id}
                          className="pro-card"
                          style={{
                            background: '#f8fafc',
                            border: '1px solid #e2e8f0',
                            padding: '1rem',
                            marginBottom: '0.75rem'
                          }}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem', marginBottom: '0.65rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div
                                style={{
                                  width: '36px',
                                  height: '36px',
                                  borderRadius: '9999px',
                                  background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                                  color: '#fff',
                                  fontWeight: 800,
                                  fontSize: '0.75rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  justifyContent: 'center',
                                  flexShrink: 0
                                }}
                              >
                                {initials}
                              </div>
                              <div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                                  <strong style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a' }}>{rev.customerName || 'Verified Buyer'}</strong>
                                  {rev.verifiedBuyer && (
                                    <span className="pro-pill-badge green">
                                      ✓ Verified Buyer
                                    </span>
                                  )}
                                  {rev.orderId && (
                                    <span className="pro-pill-badge blue">
                                      Order #{rev.orderId}
                                    </span>
                                  )}
                                </div>
                                <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                                  {rev.date || 'Recent'} • {rev.location || 'Bakani, Rajasthan'}
                                </div>
                              </div>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                              <div style={{ color: '#f59e0b', fontWeight: 800, fontSize: '0.9rem', letterSpacing: '0.05em' }}>
                                {'★'.repeat(Math.max(1, Math.min(5, Number(rev.rating) || 5)))}
                                <span style={{ color: '#cbd5e1' }}>
                                  {'★'.repeat(5 - Math.max(1, Math.min(5, Number(rev.rating) || 5)))}
                                </span>
                              </div>
                              <button
                                type="button"
                                onClick={() => handleDeleteReview(rev.id)}
                                disabled={isDeleting}
                                className="pro-btn pro-btn-danger pro-btn-sm"
                              >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                              </button>
                            </div>
                          </div>

                          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', padding: '0.25rem 0.65rem', borderRadius: '0.375rem', background: '#ffffff', border: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 700, color: '#334155', marginBottom: '0.65rem' }}>
                            📦 Product: {rev.productName || 'Stationery Item'}
                          </div>

                          <div style={{ fontSize: '0.875rem', color: '#1e293b', padding: '0.75rem 1rem', background: '#ffffff', borderRadius: '0.5rem', borderLeft: '4px solid #f97316', fontStyle: 'italic', lineHeight: 1.5 }}>
                            "{rev.comment}"
                          </div>
                        </div>
                      );
                    })}

                    {filteredCustomerReviews.length === 0 && (
                      <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>
                        💬 Koi customer reviews nahi mile. Search filter check karein.
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* 5. Products Performance Table */}
              {reviewSubTab === 'products' && (
                <div className="pro-table-card">
                  <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                    Product Review & Rating Performance
                  </div>
                  <div className="pro-table-inner">
                    <table className="pro-data-table">
                      <thead>
                        <tr>
                          <th>Product</th>
                          <th>Category</th>
                          <th>Rating</th>
                          <th>Review Count</th>
                          <th style={{ textAlign: 'right' }}>Action</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...products]
                          .sort((a, b) => (Number(b.reviews) || 0) - (Number(a.reviews) || 0))
                          .map(product => (
                            <tr key={product.id}>
                              <td style={{ fontWeight: 700, color: '#0f172a' }}>{product.name}</td>
                              <td style={{ textTransform: 'capitalize', color: '#64748b' }}>{product.category}</td>
                              <td style={{ fontWeight: 800, color: '#f59e0b' }}>★ {product.rating}</td>
                              <td style={{ color: '#334155' }}>
                                {Number(product.reviews || 0).toLocaleString('en-IN')} reviews
                              </td>
                              <td style={{ textAlign: 'right' }}>
                                <button
                                  type="button"
                                  onClick={() => {
                                    setReviewSearch(product.name);
                                    setReviewSubTab('feed');
                                  }}
                                  className="pro-btn pro-btn-secondary pro-btn-sm"
                                >
                                  View reviews →
                                </button>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          );
        })()}

        {/* ── OFFERS (Enterprise Pro Edition) ── */}
        {tab === 'offers' && (
          <div className="space-y-6">
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Promotional Offers & Deals</h1>
                  <span className="pro-pill-badge orange">
                    🔥 {offerProducts.length} Active Deals
                  </span>
                </div>
                <p className="pro-page-sub">
                  Live sale products, festival percentage discounts aur storefront promotion badges.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={() => setTab('products')}
                  className="pro-btn pro-btn-primary"
                >
                  <span>+</span> Add Offer to Product
                </button>
              </div>
            </div>

            <div className="pro-grid-4">
              {offerProducts.map(product => {
                const discount = product.mrp > product.price ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
                return (
                  <div
                    key={product.id}
                    className="pro-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      padding: '1.15rem'
                    }}
                  >
                    <div>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                        <div style={{ width: '48px', height: '48px', borderRadius: '0.5rem', background: '#f8fafc', border: '1px solid #e2e8f0', padding: '4px', flexShrink: 0 }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={product.image}
                            alt={product.name}
                            style={{ width: '100%', height: '100%', objectFit: 'contain' }}
                            onError={e => { e.currentTarget.style.display = 'none'; }}
                          />
                        </div>
                        {discount > 0 ? (
                          <span className="pro-pill-badge red">
                            {discount}% OFF
                          </span>
                        ) : product.badge ? (
                          <span className="pro-pill-badge orange">
                            {product.badge}
                          </span>
                        ) : null}
                      </div>

                      <h3 style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0f172a', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={product.name}>
                        {product.name}
                      </h3>
                      <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize', marginTop: '0.15rem' }}>{product.category}</div>

                      <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem', marginTop: '0.65rem' }}>
                        <strong style={{ fontSize: '1.1rem', fontWeight: 900, color: '#047857' }}>{formatCurrency(product.price)}</strong>
                        {product.mrp > product.price && (
                          <span style={{ fontSize: '0.75rem', color: '#94a3b8', textDecoration: 'line-through' }}>{formatCurrency(product.mrp)}</span>
                        )}
                      </div>
                    </div>

                    <div style={{ paddingTop: '0.75rem', marginTop: '0.75rem', borderTop: '1px solid #f1f5f9' }}>
                      <button
                        type="button"
                        onClick={() => {
                          setOfferProd({ ...product });
                          setTab('products');
                        }}
                        className="pro-btn pro-btn-secondary pro-btn-sm"
                        style={{ width: '100%' }}
                      >
                        ✏️ Edit Deal
                      </button>
                    </div>
                  </div>
                );
              })}
              {offerProducts.length === 0 && (
                <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', background: '#ffffff', borderRadius: '1rem', border: '1px solid #e2e8f0', color: '#64748b', fontSize: '0.875rem' }}>
                  Koi active offers nahi hain. Products tab me jakar kisi bhi product par "Offer" click karein.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── NOTIFICATIONS (Enterprise Pro Edition) ── */}
        {tab === 'notifications' && (
          <div className="space-y-6">
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Notifications & Activity</h1>
                  <span className="pro-pill-badge blue">
                    🔔 {notificationRows.length} Recent Alerts
                  </span>
                </div>
                <p className="pro-page-sub">
                  Live order tracking updates, packaging alerts aur customer dispatch events.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>Refresh Activity</span>
                </button>
              </div>
            </div>

            <div className="pro-card">
              <h3 className="pro-card-title" style={{ paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                Recent Order Status Activity Feed
              </h3>

              {notificationRows.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {notificationRows.map(order => {
                    const isDelivered = order.status === 'delivered';
                    const isTransit = order.status === 'out_for_delivery';
                    return (
                      <div
                        key={order.orderId}
                        style={{
                          padding: '0.85rem 1rem',
                          borderRadius: '0.75rem',
                          border: '1px solid #e2e8f0',
                          background: '#f8fafc',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          gap: '1rem',
                          flexWrap: 'wrap'
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          <div
                            style={{
                              width: '36px',
                              height: '36px',
                              borderRadius: '0.5rem',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              fontWeight: 800,
                              background: isDelivered ? '#ecfdf5' : isTransit ? '#eff6ff' : '#fff7ed',
                              color: isDelivered ? '#047857' : isTransit ? '#1d4ed8' : '#ea580c'
                            }}
                          >
                            <AppIcon name={isDelivered ? 'check' : isTransit ? 'truck' : 'package'} size={17} />
                          </div>
                          <div>
                            <div style={{ fontWeight: 800, color: '#0f172a', fontSize: '0.875rem' }}>
                              Order #{order.orderId} • <span style={{ textTransform: 'capitalize' }}>{ORDER_STATUSES.find(s => s.key === order.status)?.label || order.status}</span>
                            </div>
                            <div style={{ fontSize: '0.75rem', color: '#64748b', marginTop: '0.15rem' }}>
                              {order.address?.name || 'Customer'} • {formatDate(order.updatedAt || order.createdAt)}
                            </div>
                          </div>
                        </div>

                        <span className="pro-pill-badge green">
                          Automated Status Logged
                        </span>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '3rem 1rem', color: '#64748b', fontSize: '0.875rem' }}>
                  <div style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>🔔</div>
                  Abhi customer notifications nahi hain.
                </div>
              )}
            </div>
          </div>
        )}

        {tab === 'settings' && (() => {
          const isNextMatch = Boolean(adminPasswordForm.next && adminPasswordForm.confirm && adminPasswordForm.next === adminPasswordForm.confirm);
          const isNextMismatch = Boolean(adminPasswordForm.next && adminPasswordForm.confirm && adminPasswordForm.next !== adminPasswordForm.confirm);
          const isNextLengthValid = Boolean(adminPasswordForm.next.length >= 10);

          return (
            <div className="space-y-6">
              {/* Executive Header */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Settings & Store Controls</h1>
                    <span className="pro-pill-badge green">
                      <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981', display: 'inline-block' }} />
                      <span>Store Active • Bakani</span>
                    </span>
                  </div>
                  <p className="pro-page-sub">
                    Store profile, delivery operations, owner credentials, 2-step verification aur system maintenance ko ek jagah manage karein.
                  </p>
                </div>

                <div className="pro-page-actions">
                  <button
                    type="button"
                    onClick={() => {
                      refresh();
                      showToast('Store settings & active session verified');
                    }}
                    disabled={refreshing}
                    className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                    title="Verify & sync settings"
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Verifying...' : 'Sync System'}</span>
                  </button>
                </div>
              </div>

              {/* High-End Shopify/Stripe Style Owner Profile Hero Card */}
              <div
                style={{
                  background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
                  borderRadius: '20px',
                  border: '1px solid rgba(249, 115, 22, 0.28)',
                  padding: '1.75rem 2rem',
                  color: '#ffffff',
                  boxShadow: '0 12px 36px rgba(15, 23, 42, 0.16)',
                  marginBottom: '2rem',
                  position: 'relative',
                  overflow: 'hidden',
                }}
              >
                {/* Background ambient decorative orb */}
                <div style={{ position: 'absolute', top: '-40px', right: 0, width: 140, height: 140, borderRadius: '50%', background: 'radial-gradient(circle, rgba(249, 115, 22, 0.25) 0%, transparent 70%)', pointerEvents: 'none', maxWidth: '100%' }} />

                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem', position: 'relative', zIndex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                    <div
                      style={{
                        width: 64,
                        height: 64,
                        borderRadius: '18px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        fontWeight: 900,
                        fontSize: '1.4rem',
                        fontFamily: 'var(--font-display)',
                        boxShadow: '0 6px 20px rgba(249, 115, 22, 0.45)',
                        border: '2px solid rgba(255, 255, 255, 0.2)',
                        flexShrink: 0,
                      }}
                    >
                      MS
                    </div>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                        <h2 style={{ fontSize: '1.4rem', fontWeight: 900, margin: 0, fontFamily: 'var(--font-display)', letterSpacing: '-0.02em', color: '#ffffff' }}>
                          M.S. Gupta
                        </h2>
                        <span style={{ fontSize: '0.7rem', fontWeight: 800, padding: '0.2rem 0.6rem', borderRadius: '999px', background: 'rgba(249, 115, 22, 0.2)', color: '#fed7aa', border: '1px solid rgba(249, 115, 22, 0.4)' }}>
                          Verified Store Owner
                        </span>
                      </div>
                      <div style={{ color: 'rgba(226, 232, 240, 0.85)', fontSize: '0.86rem', marginTop: '0.25rem', fontWeight: 600 }}>
                        Gupta General Store • Head Administrator
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.45rem', flexWrap: 'wrap', fontSize: '0.78rem', color: 'rgba(203, 213, 225, 0.75)' }}>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AppIcon name="mapPin" size={13} style={{ color: 'var(--orange)' }} />
                          Main Market, Near Clock Tower, Bakani (PIN 326022)
                        </span>
                        <span style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                          <AppIcon name="phone" size={13} style={{ color: 'var(--orange)' }} />
                          +91 81076 15285
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Quick Direct Actions on Owner Card */}
                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
                    <a
                      href="https://wa.me/918107615285"
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        background: '#25d366',
                        color: '#ffffff',
                        textDecoration: 'none',
                        boxShadow: '0 4px 12px rgba(37, 211, 102, 0.3)',
                      }}
                      title="Direct Owner WhatsApp"
                    >
                      <AppIcon name="whatsapp" size={14} strokeWidth={2.4} />
                      <span>WhatsApp</span>
                    </a>
                    <a
                      href="tel:8107615285"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textDecoration: 'none',
                      }}
                      title="Direct Phone Call"
                    >
                      <AppIcon name="phone" size={13} strokeWidth={2.2} />
                      <span>Call Store</span>
                    </a>
                    <Link
                      href="/"
                      target="_blank"
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.55rem 0.95rem',
                        borderRadius: '10px',
                        fontSize: '0.8rem',
                        fontWeight: 700,
                        background: 'rgba(255, 255, 255, 0.12)',
                        color: '#ffffff',
                        border: '1px solid rgba(255, 255, 255, 0.2)',
                        textDecoration: 'none',
                      }}
                      title="Customer Storefront"
                    >
                      <AppIcon name="shop" size={14} />
                      <span>Storefront ↗</span>
                    </Link>
                  </div>
                </div>
              </div>

              {/* 3-Column Operational Info Cards */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(310px, 1fr))',
                  gap: '1.25rem',
                  marginBottom: '2rem',
                }}
              >
                {/* 1. Store Business Profile */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '18px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="shop" size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Store Identity & Contact</h3>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>Registered commercial profile</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Store Name</span>
                      <strong style={{ color: 'var(--text-primary)' }}>{SHOP.name}</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Support Helpline</span>
                      <strong style={{ color: 'var(--text-primary)' }}>+91 81076 15285</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Registered Email</span>
                      <strong style={{ color: 'var(--text-primary)', wordBreak: 'break-all', textAlign: 'right' }}>guptageneralstore1990@gmail.com</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Physical Store</span>
                      <strong style={{ color: 'var(--text-primary)', textAlign: 'right' }}>Main Market, Bakani</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Business Category</span>
                      <strong style={{ color: 'var(--orange-dark)', textAlign: 'right' }}>Stationery, Books & Office</strong>
                    </div>
                  </div>
                </div>

                {/* 2. Delivery & Fulfillment Rules */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '18px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="truck" size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Delivery & Orders</h3>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>Fulfillment guidelines & fees</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Delivery Area</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Bakani & 10km Nearby</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Free Delivery Rule</span>
                      <strong style={{ color: '#16a34a', background: 'rgba(22, 163, 74, 0.1)', padding: '0.1rem 0.5rem', borderRadius: '6px', border: '1px solid rgba(22, 163, 74, 0.2)' }}>
                        Orders ₹100+ FREE
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Below ₹100 Delivery</span>
                      <strong style={{ color: 'var(--text-primary)' }}>₹25 Flat Fee</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Store Hours</span>
                      <strong style={{ color: 'var(--text-primary)' }}>8:00 AM – 9:30 PM (Daily)</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Payment Accepted</span>
                      <strong style={{ color: 'var(--text-primary)' }}>COD & UPI on Delivery</strong>
                    </div>
                  </div>
                </div>

                {/* 3. Enterprise Security & 2FA Status */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '18px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginBottom: '1.1rem', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(16, 185, 129, 0.1)', color: '#059669', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="shield" size={18} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: '0.96rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>Security & Auth</h3>
                      <p style={{ margin: 0, fontSize: '0.74rem', color: 'var(--text-muted)' }}>Bank-grade owner protections</p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', fontSize: '0.82rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>2-Step Verification</span>
                      <strong style={{ color: '#059669', display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#10b981' }} />
                        Active (Email OTP)
                      </strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Session Encryption</span>
                      <strong style={{ color: 'var(--text-primary)' }}>JWT Signed Tokens</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Emergency PIN</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Master PIN Enabled</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem', paddingBottom: '0.55rem', borderBottom: '1px solid var(--border-light)' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Current Session</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Authorized Browser</strong>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: '0.5rem' }}>
                      <span style={{ color: 'var(--text-muted)' }}>Credential Storage</span>
                      <strong style={{ color: 'var(--text-primary)' }}>Salted Hash Protection</strong>
                    </div>
                  </div>
                </div>
              </div>

              {/* 2-Column Lower Grid: Change Password Card + System Maintenance Card */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))',
                  gap: '1.5rem',
                  marginBottom: '2rem',
                }}
              >
                {/* 4. Change Admin Password Form (Shopify/Stripe Form Design) */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1.5px solid var(--border)',
                    padding: '1.75rem',
                    boxShadow: '0 4px 18px rgba(0,0,0,0.03)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                    <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(249, 115, 22, 0.1)', color: 'var(--orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="key" size={20} strokeWidth={2.2} />
                    </div>
                    <div>
                      <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                        Change Admin Password
                      </h2>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Store security credentials ko update karein. Current password verification compulsory hai.
                      </p>
                    </div>
                  </div>

                  <form onSubmit={changeAdminPassword} style={{ marginTop: '1.25rem' }}>
                    {/* Current Password Field */}
                    <div style={{ marginBottom: '1.1rem' }}>
                      <label style={{ display: 'block', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        Current Password *
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showSettingsPwd.current ? 'text' : 'password'}
                          value={adminPasswordForm.current}
                          onChange={e => setAdminPasswordForm(f => ({ ...f, current: e.target.value }))}
                          placeholder="Current admin password daalein..."
                          autoComplete="current-password"
                          required
                          style={{
                            width: '100%',
                            padding: '0.65rem 2.8rem 0.65rem 0.95rem',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border)',
                            fontSize: '0.88rem',
                            background: 'var(--bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPwd(p => ({ ...p, current: !p.current }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showSettingsPwd.current ? 'Hide password' : 'Show password'}
                        >
                          <AppIcon name={showSettingsPwd.current ? 'eyeOff' : 'eye'} size={16} />
                        </button>
                      </div>
                    </div>

                    {/* New Password Field */}
                    <div style={{ marginBottom: '1.1rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>New Password *</span>
                        <span style={{ fontSize: '0.7rem', color: isNextLengthValid ? '#16a34a' : 'var(--text-muted)', fontWeight: 700, textTransform: 'none' }}>
                          {isNextLengthValid ? '✓ Length OK (10+)' : 'Min 10 characters'}
                        </span>
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showSettingsPwd.next ? 'text' : 'password'}
                          value={adminPasswordForm.next}
                          onChange={e => setAdminPasswordForm(f => ({ ...f, next: e.target.value }))}
                          placeholder="Naya strong password (min 10 chars)..."
                          autoComplete="new-password"
                          required
                          style={{
                            width: '100%',
                            padding: '0.65rem 2.8rem 0.65rem 0.95rem',
                            borderRadius: '10px',
                            border: '1.5px solid var(--border)',
                            fontSize: '0.88rem',
                            background: 'var(--bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPwd(p => ({ ...p, next: !p.next }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showSettingsPwd.next ? 'Hide password' : 'Show password'}
                        >
                          <AppIcon name={showSettingsPwd.next ? 'eyeOff' : 'eye'} size={16} />
                        </button>
                      </div>
                    </div>

                    {/* Confirm New Password Field */}
                    <div style={{ marginBottom: '1.35rem' }}>
                      <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.4rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Confirm New Password *</span>
                        {adminPasswordForm.confirm && (
                          <span style={{ fontSize: '0.7rem', color: isNextMatch ? '#16a34a' : '#ef4444', fontWeight: 700, textTransform: 'none' }}>
                            {isNextMatch ? '✓ Passwords Match' : '⚠ Passwords mismatch'}
                          </span>
                        )}
                      </label>
                      <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                        <input
                          type={showSettingsPwd.confirm ? 'text' : 'password'}
                          value={adminPasswordForm.confirm}
                          onChange={e => setAdminPasswordForm(f => ({ ...f, confirm: e.target.value }))}
                          placeholder="Naya password dobara confirm karein..."
                          autoComplete="new-password"
                          required
                          style={{
                            width: '100%',
                            padding: '0.65rem 2.8rem 0.65rem 0.95rem',
                            borderRadius: '10px',
                            border: isNextMismatch ? '1.5px solid #ef4444' : '1.5px solid var(--border)',
                            fontSize: '0.88rem',
                            background: 'var(--bg)',
                            color: 'var(--text-primary)',
                            outline: 'none',
                          }}
                        />
                        <button
                          type="button"
                          onClick={() => setShowSettingsPwd(p => ({ ...p, confirm: !p.confirm }))}
                          style={{
                            position: 'absolute',
                            right: '0.75rem',
                            background: 'none',
                            border: 'none',
                            cursor: 'pointer',
                            color: 'var(--text-muted)',
                            display: 'flex',
                            alignItems: 'center',
                          }}
                          title={showSettingsPwd.confirm ? 'Hide password' : 'Show password'}
                        >
                          <AppIcon name={showSettingsPwd.confirm ? 'eyeOff' : 'eye'} size={16} />
                        </button>
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={passwordChanging || !isNextLengthValid || Boolean(adminPasswordForm.confirm && !isNextMatch)}
                      style={{
                        width: '100%',
                        padding: '0.75rem 1.25rem',
                        borderRadius: '12px',
                        background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                        color: '#ffffff',
                        border: 'none',
                        fontSize: '0.92rem',
                        fontWeight: 800,
                        cursor: passwordChanging ? 'not-allowed' : 'pointer',
                        opacity: passwordChanging ? 0.75 : 1,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.5rem',
                        boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <AppIcon name={passwordChanging ? 'refresh' : 'shield'} size={16} strokeWidth={2.4} />
                      <span>{passwordChanging ? 'Verifying & Updating Passkey...' : 'Update Admin Password'}</span>
                    </button>
                  </form>
                </div>

                {/* 5. System Maintenance, Cache & Backup Utilities */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '1.75rem',
                    boxShadow: '0 2px 12px rgba(0,0,0,0.02)',
                    display: 'flex',
                    flexDirection: 'column',
                    justifyContent: 'space-between',
                  }}
                >
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
                      <div style={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(59, 130, 246, 0.1)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <AppIcon name="settings" size={20} strokeWidth={2.2} />
                      </div>
                      <div>
                        <h2 style={{ fontSize: '1.15rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', fontFamily: 'var(--font-display)' }}>
                          System & Data Utilities
                        </h2>
                        <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                          Fast maintenance actions, export data & session controls
                        </p>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.9rem', marginTop: '1.25rem' }}>
                      {/* Tool 1: Export Orders CSV */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-primary)' }}>Export Orders Backup (CSV)</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Complete customer orders & transaction history</span>
                        </div>
                        <button
                          onClick={exportOrdersCSV}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Download CSV"
                        >
                          <AppIcon name="download" size={13} strokeWidth={2.2} />
                          <span>Export CSV</span>
                        </button>
                      </div>

                      {/* Tool 2: Clear Local Catalog Cache */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-primary)' }}>Catalog Cache Clean</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>Purge local cached products & reload fresh SKUs</span>
                        </div>
                        <button
                          onClick={() => {
                            try {
                              localStorage.removeItem('ggsCachedServerProducts');
                              sessionStorage.removeItem('ggsCachedServerProducts');
                            } catch {}
                            refresh();
                            showToast('Catalog cache cleared & refreshed from database');
                          }}
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'var(--bg-secondary)',
                            border: '1px solid var(--border)',
                            fontSize: '0.78rem',
                            fontWeight: 700,
                            color: 'var(--text-primary)',
                            cursor: 'pointer',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Purge cache"
                        >
                          <AppIcon name="refresh" size={13} strokeWidth={2.2} />
                          <span>Purge Cache</span>
                        </button>
                      </div>

                      {/* Tool 3: Customer Storefront */}
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.85rem 1rem', background: 'var(--bg)', borderRadius: '12px', border: '1px solid var(--border-light)' }}>
                        <div>
                          <strong style={{ display: 'block', fontSize: '0.84rem', color: 'var(--text-primary)' }}>Live Storefront</strong>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>View public website as a Bakani customer</span>
                        </div>
                        <Link
                          href="/"
                          target="_blank"
                          style={{
                            padding: '0.45rem 0.85rem',
                            borderRadius: '8px',
                            background: 'rgba(249, 115, 22, 0.1)',
                            border: '1px solid rgba(249, 115, 22, 0.25)',
                            fontSize: '0.78rem',
                            fontWeight: 800,
                            color: 'var(--orange-dark)',
                            textDecoration: 'none',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '5px',
                          }}
                          title="Open Storefront"
                        >
                          <span>Open Store</span>
                          <AppIcon name="externalLink" size={12} strokeWidth={2.4} />
                        </Link>
                      </div>
                    </div>
                  </div>

                  {/* Secure Log Out Strip */}
                  <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid var(--border-light)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '0.76rem', color: 'var(--text-muted)' }}>
                      End owner session across this browser
                    </div>
                    <button
                      onClick={handleLogout}
                      style={{
                        padding: '0.45rem 0.95rem',
                        borderRadius: '8px',
                        background: 'rgba(239, 68, 68, 0.08)',
                        border: '1px solid rgba(239, 68, 68, 0.25)',
                        color: '#ef4444',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '6px',
                        transition: 'all 0.15s ease',
                      }}
                      title="Sign out of Admin Panel"
                    >
                      <AppIcon name="logout" size={13} strokeWidth={2.4} />
                      <span>Log Out Session</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          );
        })()}

        {/* ── INVENTORY (Enterprise Pro Edition) ── */}
        {tab === 'inventory' && (
          <div className="space-y-6">
            {/* 1. Header & Actions Bar */}
            <div className="pro-page-header">
              <div>
                <div className="pro-page-title-row">
                  <h1 className="pro-page-title">Inventory Control</h1>
                  <span className="pro-pill-badge purple">
                    📦 {products.length} Products
                  </span>
                  {products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length > 0 && (
                    <span className="pro-pill-badge orange">
                      ⚠️ {products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length} Low Stock
                    </span>
                  )}
                  {products.filter(p => Number(p.stock) <= 0).length > 0 && (
                    <span className="pro-pill-badge red">
                      ❌ {products.filter(p => Number(p.stock) <= 0).length} Out of Stock
                    </span>
                  )}
                </div>
                <p className="pro-page-sub">
                  Har product ka stock, category aur demand ek nazar me samjhein aur fast restock karein.
                </p>
              </div>
              <div className="pro-page-actions">
                <button
                  type="button"
                  onClick={refresh}
                  disabled={refreshing}
                  title="Refresh inventory"
                  className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                >
                  <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                  <span>{refreshing ? 'Refreshing...' : 'Refresh Inventory'}</span>
                </button>
              </div>
            </div>

            {/* 2. 4-Column KPI Metric Cards with Interactive Filters */}
            <div className="pro-kpi-grid">
              <div
                onClick={() => setInventoryFilter('all')}
                style={{ cursor: 'pointer', border: inventoryFilter === 'all' ? '2px solid #ea580c' : undefined }}
                className="pro-kpi-card"
              >
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Total SKUs</span>
                  <div className="pro-kpi-icon blue">
                    <AppIcon name="clipboard" size={16} />
                  </div>
                </div>
                <div className="pro-kpi-value">{products.length}</div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill blue">All items</span>
                  <span className="pro-kpi-note">Full catalog</span>
                </div>
              </div>

              <div
                onClick={() => setInventoryFilter('low')}
                style={{ cursor: 'pointer', border: inventoryFilter === 'low' ? '2px solid #ea580c' : undefined }}
                className="pro-kpi-card"
              >
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Low Stock</span>
                  <div className="pro-kpi-icon orange">
                    ⚠️
                  </div>
                </div>
                <div className="pro-kpi-value text-amber-600">
                  {products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill warning">≤ 5 left</span>
                  <span className="pro-kpi-note">Restock soon</span>
                </div>
              </div>

              <div
                onClick={() => setInventoryFilter('out')}
                style={{ cursor: 'pointer', border: inventoryFilter === 'out' ? '2px solid #ea580c' : undefined }}
                className="pro-kpi-card"
              >
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Out of Stock</span>
                  <div className="pro-kpi-icon orange">
                    ❌
                  </div>
                </div>
                <div className="pro-kpi-value text-red-600">
                  {products.filter(p => Number(p.stock) <= 0).length}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill orange">0 units</span>
                  <span className="pro-kpi-note">Urgent action</span>
                </div>
              </div>

              <div
                onClick={() => setInventoryFilter('all')}
                className="pro-kpi-card"
              >
                <div className="pro-kpi-header">
                  <span className="pro-kpi-label">Healthy Stock</span>
                  <div className="pro-kpi-icon green">
                    ✓
                  </div>
                </div>
                <div className="pro-kpi-value text-emerald-600">
                  {products.filter(p => Number(p.stock) > 5).length}
                </div>
                <div className="pro-kpi-meta">
                  <span className="pro-badge-pill green">&gt; 5 units</span>
                  <span className="pro-kpi-note">Well stocked</span>
                </div>
              </div>
            </div>

            {/* 3. Search & Filter Bar */}
            <div className="pro-filter-box">
              <div className="pro-search-row">
                <div className="pro-search-input-wrap">
                  <span className="icon">
                    <AppIcon name="search" size={16} />
                  </span>
                  <input
                    type="text"
                    placeholder="Search product by name, SKU or ID..."
                    value={inventorySearch}
                    onChange={e => setInventorySearch(e.target.value)}
                    className="pro-search-input"
                  />
                  {inventorySearch && (
                    <button
                      type="button"
                      onClick={() => setInventorySearch('')}
                      style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8' }}
                    >
                      ✕
                    </button>
                  )}
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 mt-2.5">
                <button
                  type="button"
                  onClick={() => setInventoryFilter('all')}
                  className={`pro-chip-btn ${inventoryFilter === 'all' ? 'active' : ''}`}
                >
                  All Products ({products.length})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryFilter('low')}
                  className={`pro-chip-btn ${inventoryFilter === 'low' ? 'active' : ''}`}
                >
                  ⚠️ Low Stock ({products.filter(p => Number(p.stock) > 0 && Number(p.stock) <= 5).length})
                </button>
                <button
                  type="button"
                  onClick={() => setInventoryFilter('out')}
                  className={`pro-chip-btn ${inventoryFilter === 'out' ? 'active' : ''}`}
                >
                  ❌ Out of Stock ({products.filter(p => Number(p.stock) <= 0).length})
                </button>
              </div>
            </div>

            {/* 4. Enterprise Inventory Cards Grid */}
            <div className="pro-grid-3">
              {inventoryProducts.map(p => {
                const low = p.stock > 0 && p.stock <= 5;
                const zero = p.stock === 0;
                return (
                  <div
                    key={p.id}
                    className="pro-card"
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      border: zero ? '1px solid #fecaca' : low ? '1px solid #fde68a' : '1px solid #e2e8f0',
                      background: zero ? '#fff5f5' : low ? '#fffdf5' : '#ffffff'
                    }}
                  >
                    <div>
                      {/* Head */}
                      <div className="flex items-start gap-3 mb-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={p.image}
                          alt={p.name}
                          className="w-12 h-12 object-contain rounded-lg border border-gray-200 bg-white p-1 flex-shrink-0"
                          onError={e => { e.currentTarget.style.display = 'none'; }}
                        />
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold text-gray-900 text-sm truncate" title={p.name}>
                            {p.name}
                          </h3>
                          <div className="text-xs text-gray-500 capitalize">{p.category} • ID #{p.id}</div>
                        </div>
                        {zero ? (
                          <span className="pro-pill-badge red">
                            Out
                          </span>
                        ) : low ? (
                          <span className="pro-pill-badge orange">
                            Low
                          </span>
                        ) : (
                          <span className="pro-pill-badge green">
                            Healthy
                          </span>
                        )}
                      </div>

                      {/* Metrics 4-Box Grid */}
                      <div className="grid grid-cols-2 gap-2 p-2.5 bg-gray-50 rounded-lg text-xs border border-gray-100 mb-3">
                        <div>
                          <span className="text-[11px] text-gray-500 block">Available</span>
                          <strong className="text-gray-900 font-bold">{p.stock} units</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 block">Wishlist</span>
                          <strong className="text-rose-600 font-bold">{wishlistCounts[p.id] || wishlistCounts[String(p.id)] || 0} saves</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 block">Sold</span>
                          <strong className="text-blue-600 font-bold">{productSalesMap[String(p.id)] || productSalesMap[String(p.name || '').trim().toLowerCase()] || 0} units</strong>
                        </div>
                        <div>
                          <span className="text-[11px] text-gray-500 block">Price</span>
                          <strong className="text-emerald-700 font-bold">{formatCurrency(p.price)}</strong>
                        </div>
                      </div>
                    </div>

                    {/* Action Row: Restock & Edit */}
                    <div className="flex items-center justify-between pt-3 border-t border-gray-100 gap-2">
                      <div className="flex items-center gap-1.5">
                        <label className="flex items-center gap-1 text-xs font-semibold text-gray-600">
                          <span>Qty:</span>
                          <input
                            type="number"
                            min={0}
                            defaultValue={p.stock}
                            className="w-14 px-1.5 py-1 text-center font-bold border border-gray-300 rounded-lg text-xs focus:ring-2 focus:ring-orange-500 outline-none"
                            onBlur={e => handleStockUpdate(p.id, e.target.value)}
                          />
                        </label>
                        <button
                          type="button"
                          title="Add +5 units immediately"
                          onClick={() => handleStockUpdate(p.id, Number(p.stock || 0) + 5)}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                        >
                          +5
                        </button>
                        <button
                          type="button"
                          title="Add +10 units immediately"
                          onClick={() => handleStockUpdate(p.id, Number(p.stock || 0) + 10)}
                          className="px-2 py-1 text-xs font-bold rounded-lg bg-orange-50 text-orange-700 border border-orange-200 hover:bg-orange-100 transition-colors"
                        >
                          +10
                        </button>
                      </div>
                      <button
                        type="button"
                        onClick={() => { setProdSearch(String(p.id)); setProdCatFilter('all'); setTab('products'); }}
                        className="pro-btn pro-btn-secondary pro-btn-sm"
                      >
                        Edit
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
            {inventoryProducts.length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl border border-gray-200 text-gray-500 text-sm">
                🔍 No products found. Search ya stock filter change karke dekhein.
              </div>
            )}
          </div>
        )}

        {/* ── REPORTS & ANALYTICS (Tailwind Enterprise Edition) ── */}
        {tab === 'analytics' && (() => {
          const activeAnalytics = analytics || getAnalyticsForOrders(orders);
          return (
            <div className="space-y-6">
              {/* 1. Header & Actions Bar */}
              <div className="pro-page-header">
                <div>
                  <div className="pro-page-title-row">
                    <h1 className="pro-page-title">Reports & Business Analytics</h1>
                    <span className="pro-pill-badge green">
                      📊 Live Performance
                    </span>
                  </div>
                  <p className="pro-page-sub">
                    Store revenue trends, order fulfillment stats aur customer growth metrics.
                  </p>
                </div>
                <div className="pro-page-actions">
                  <button
                    type="button"
                    onClick={refresh}
                    disabled={refreshing}
                    title="Refresh analytics"
                    className={`pro-btn pro-btn-secondary ${refreshing ? 'opacity-60 cursor-not-allowed' : ''}`}
                  >
                    <AppIcon name="refresh" size={14} className={refreshing ? 'animate-spin' : ''} />
                    <span>{refreshing ? 'Refreshing...' : 'Refresh Reports'}</span>
                  </button>
                </div>
              </div>

              {/* 2. 4-Column Executive KPI Cards */}
              <div className="pro-kpi-grid">
                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Total Revenue</span>
                    <div className="pro-kpi-icon green">
                      <AppIcon name="credit" size={16} />
                    </div>
                  </div>
                  <div className="pro-kpi-value text-emerald-600">
                    {formatCurrency(activeAnalytics.totalRevenue || 0)}
                  </div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill green">Gross</span>
                    <span className="pro-kpi-note">Realized revenue</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Total Orders</span>
                    <div className="pro-kpi-icon blue">
                      <AppIcon name="package" size={16} />
                    </div>
                  </div>
                  <div className="pro-kpi-value">
                    {activeAnalytics.totalOrders || orders.length}
                  </div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill blue">All checkouts</span>
                    <span className="pro-kpi-note">Order count</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Delivered Orders</span>
                    <div className="pro-kpi-icon orange">
                      <AppIcon name="check" size={16} />
                    </div>
                  </div>
                  <div className="pro-kpi-value text-orange-600">
                    {activeAnalytics.deliveredOrders || orders.filter(o => o.status === 'delivered').length}
                  </div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill orange">Fulfilled</span>
                    <span className="pro-kpi-note">Complete orders</span>
                  </div>
                </div>

                <div className="pro-kpi-card">
                  <div className="pro-kpi-header">
                    <span className="pro-kpi-label">Unique Buyers</span>
                    <div className="pro-kpi-icon purple">
                      <AppIcon name="user" size={16} />
                    </div>
                  </div>
                  <div className="pro-kpi-value text-purple-600">
                    {activeAnalytics.uniqueCustomers || customerDirectory.length}
                  </div>
                  <div className="pro-kpi-meta">
                    <span className="pro-badge-pill purple">Active</span>
                    <span className="pro-kpi-note">Customer base</span>
                  </div>
                </div>
              </div>

              {/* 3. Revenue Trend Chart - Last 7 Days */}
              <div className="pro-card">
                <div style={{ marginBottom: '1.25rem' }}>
                  <h3 className="pro-card-title">Revenue Trend (Last 7 Days)</h3>
                  <p className="pro-card-sub" style={{ marginTop: '0.25rem' }}>Daily sales distribution across the storefront</p>
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: '0.75rem', paddingTop: '1.5rem', paddingBottom: '0.5rem', height: '180px', overflowX: 'auto', borderBottom: '1px solid #f1f5f9' }}>
                  {(activeAnalytics.last7 || []).map((d, i) => {
                    const maxRev = Math.max(...(activeAnalytics.last7 || []).map(x => x.revenue), 1);
                    const h = Math.max((d.revenue / maxRev) * 110, d.revenue > 0 ? 16 : 6);
                    return (
                      <div key={i} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.5rem', minWidth: '42px' }}>
                        <div style={{ fontSize: '0.7rem', fontWeight: 800, color: '#475569', minHeight: '16px' }}>
                          {d.revenue > 0 ? formatCurrency(d.revenue) : ''}
                        </div>
                        <div
                          style={{
                            height: `${h}px`,
                            width: '100%',
                            maxWidth: '40px',
                            borderTopLeftRadius: '0.5rem',
                            borderTopRightRadius: '0.5rem',
                            background: d.revenue > 0 ? 'linear-gradient(to top, #f97316, #fb923c)' : '#f1f5f9',
                            boxShadow: d.revenue > 0 ? '0 2px 6px rgba(249, 115, 22, 0.25)' : 'none',
                            transition: 'all 0.2s ease'
                          }}
                          title={`${d.label}: ${formatCurrency(d.revenue)} (${d.count || 0} orders)`}
                        />
                        <div style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748b', marginTop: '0.25rem' }}>{d.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* 4. Two-Column Grid: Category Breakdown + Top Selling Products */}
              <div className="pro-grid-2">
                {/* Category breakdown */}
                {activeAnalytics.catSales && Object.keys(activeAnalytics.catSales).length > 0 && (
                  <div className="pro-table-card">
                    <div style={{ padding: '1rem', borderBottom: '1px solid #e2e8f0', fontWeight: 800, fontSize: '0.92rem', color: '#0f172a' }}>
                      📂 Revenue by Category
                    </div>
                    <div className="pro-table-inner">
                      <table className="pro-data-table pro-table-fit" style={{ minWidth: '100%', width: '100%' }}>
                        <thead>
                          <tr>
                            <th>Category</th>
                            <th style={{ textAlign: 'right' }}>Revenue</th>
                          </tr>
                        </thead>
                        <tbody>
                          {Object.entries(activeAnalytics.catSales)
                            .sort((a, b) => b[1] - a[1])
                            .map(([cat, rev]) => (
                              <tr key={cat}>
                                <td style={{ fontWeight: 700, color: '#0f172a', textTransform: 'capitalize' }}>{cat}</td>
                                <td style={{ textAlign: 'right', fontWeight: 800, color: '#047857' }}>{formatCurrency(rev)}</td>
                              </tr>
                            ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}

                {/* Top selling products */}
                {activeAnalytics.topProducts && activeAnalytics.topProducts.length > 0 && (
                  <div className="pro-card">
                    <div className="pro-card-title" style={{ paddingBottom: '0.75rem', marginBottom: '1rem', borderBottom: '1px solid #f1f5f9' }}>
                      Top Selling Products
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                      {activeAnalytics.topProducts.map((p, i) => {
                        const maxRev = activeAnalytics.topProducts[0]?.revenue || 1;
                        const w = Math.round((p.revenue / maxRev) * 100);
                        return (
                          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 700, color: '#0f172a' }}>
                              <span>{i + 1}. {p.name}</span>
                              <span style={{ color: '#047857', fontWeight: 800 }}>{formatCurrency(p.revenue)}</span>
                            </div>
                            <div style={{ width: '100%', background: '#f1f5f9', borderRadius: '9999px', height: '8px', overflow: 'hidden' }}>
                              <div
                                style={{ width: `${w}%`, background: 'linear-gradient(to right, #f97316, #fb923c)', height: '100%', borderRadius: '9999px', transition: 'all 0.5s ease' }}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>
          );
        })()}
      </div>
    </div>

    {/* ── GLOBAL ADD PRODUCT MODAL (Rendered OUTSIDE admin-layout at root viewport level) ── */}
    {newProductOpen && (
      <div
        className="admin-modal-overlay"
        style={{
          position: 'fixed',
          inset: 0,
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          width: '100vw',
          height: '100vh',
          background: 'rgba(15, 23, 42, 0.75)',
          backdropFilter: 'blur(10px)',
          WebkitBackdropFilter: 'blur(10px)',
          zIndex: 999999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '1.25rem',
          overflowY: 'auto',
        }}
        onClick={e => {
          if (e.target === e.currentTarget) setNewProductOpen(false);
        }}
      >
        <div
          className="admin-modal-card"
          style={{
            background: 'var(--bg-card, #ffffff)',
            border: '1.5px solid var(--border, #e2e8f0)',
            borderRadius: '22px',
            maxWidth: '640px',
            width: '100%',
            maxHeight: '90vh',
            overflowY: 'auto',
            padding: '1.85rem 2rem',
            boxShadow: '0 25px 70px rgba(0, 0, 0, 0.45)',
            position: 'relative',
            color: 'var(--text-primary)',
          }}
        >
          <div
            className="admin-modal-header"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              marginBottom: '1.25rem',
              paddingBottom: '1rem',
              borderBottom: '1px solid var(--border, #e2e8f0)',
            }}
          >
            <div className="admin-modal-title-group" style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
              <div
                className="admin-modal-icon-badge"
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: 12,
                  background: 'rgba(249, 115, 22, 0.12)',
                  color: '#ea580c',
                  display: 'grid',
                  placeItems: 'center',
                  flexShrink: 0,
                  border: '1px solid rgba(249, 115, 22, 0.25)',
                }}
              >
                <AppIcon name="plus" size={20} />
              </div>
              <div>
                <h3 style={{ margin: 0, fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800 }}>Add New Store Product</h3>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.76rem', color: 'var(--text-muted)' }}>Gupta Store catalog me naya item add karein. Save karte hi store par live display ho jayega.</p>
              </div>
            </div>
            <button
              type="button"
              className="admin-modal-close"
              onClick={() => setNewProductOpen(false)}
              title="Close modal (Esc)"
              style={{
                width: 34,
                height: 34,
                borderRadius: '50%',
                border: '1px solid var(--border, #e2e8f0)',
                background: 'var(--bg-secondary, #f8fafc)',
                color: 'var(--text-secondary, #475569)',
                display: 'grid',
                placeItems: 'center',
                cursor: 'pointer',
                fontSize: '1rem',
                fontWeight: 800,
                flexShrink: 0,
              }}
            >
              ✕
            </button>
          </div>

          {/* Image Preview Banner */}
          {newProduct.image && (
            <div style={{ marginBottom: '1.25rem', padding: '0.85rem 1rem', background: 'var(--bg-secondary, #f8fafc)', borderRadius: '12px', border: '1px solid var(--border, #e2e8f0)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <img
                src={newProduct.image}
                alt="Product preview"
                style={{ width: 64, height: 64, objectFit: 'contain', borderRadius: 8, background: '#fff', border: '1px solid var(--border)' }}
                onError={e => { e.currentTarget.style.display = 'none'; }}
              />
              <div style={{ flex: 1, minWidth: 0 }}>
                <strong style={{ display: 'block', fontSize: '0.88rem', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {newProduct.name || 'New Product Preview'}
                </strong>
                <span style={{ fontSize: '0.78rem', color: 'var(--orange-dark, #ea580c)', fontWeight: 800 }}>
                  ₹{newProduct.price || 0} {newProduct.mrp > newProduct.price && <del style={{ color: 'var(--text-muted)', marginLeft: '0.35rem', fontWeight: 500 }}>₹{newProduct.mrp}</del>}
                </span>
                <small style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.68rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {newProduct.image}
                </small>
              </div>
            </div>
          )}

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1.4fr 1fr', gap: '0.85rem', marginBottom: '0.9rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Product Name *</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                placeholder="e.g. Doms Geometric Ruler Set"
                value={newProduct.name}
                onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Category</label>
              <select
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem', textTransform: 'capitalize' }}
                value={newProduct.category}
                onChange={e => setNewProduct(p => ({ ...p, category: e.target.value }))}
              >
                {CATEGORIES.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.85rem', marginBottom: '0.9rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Selling Price (₹) *</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                type="number"
                min="1"
                placeholder="₹ Price"
                value={newProduct.price}
                onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                required
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>MRP (₹)</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                type="number"
                min="0"
                placeholder="₹ MRP"
                value={newProduct.mrp}
                onChange={e => setNewProduct(p => ({ ...p, mrp: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Stock Units</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                type="number"
                min="0"
                placeholder="Qty"
                value={newProduct.stock}
                onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-row" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.85rem', marginBottom: '0.9rem' }}>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Promotional Badge</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                placeholder="e.g. New, Best Seller, 20% OFF"
                value={newProduct.badge}
                onChange={e => setNewProduct(p => ({ ...p, badge: e.target.value }))}
              />
            </div>
            <div className="form-group" style={{ margin: 0 }}>
              <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Initial Rating (0-5)</label>
              <input
                className="form-input"
                style={{ width: '100%', height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                type="number"
                step="0.1"
                min="1"
                max="5"
                value={newProduct.rating}
                onChange={e => setNewProduct(p => ({ ...p, rating: e.target.value }))}
              />
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1rem' }}>
            <label className="form-label" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontWeight: 700, fontSize: '0.78rem', marginBottom: '0.35rem' }}>
              <span>Product Image (URL ya Direct Upload)</span>
              {imageUploading && <span style={{ color: 'var(--orange)', fontSize: '0.72rem' }}>⏳ Uploading to Cloud...</span>}
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <input
                className="form-input"
                style={{ flex: 1, height: 38, padding: '0 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem' }}
                placeholder="https://... ya bagal se photo upload karein"
                value={newProduct.image}
                onChange={e => setNewProduct(p => ({ ...p, image: e.target.value }))}
              />
              <label style={{ background: 'linear-gradient(135deg, #f97316, #ea580c)', color: '#fff', height: 38, padding: '0 0.95rem', borderRadius: '8px', fontSize: '0.8rem', fontWeight: 700, cursor: imageUploading ? 'not-allowed' : 'pointer', whiteSpace: 'nowrap', display: 'inline-flex', alignItems: 'center', gap: '0.35rem', boxShadow: '0 2px 6px rgba(249,115,22,0.25)' }}>
                <AppIcon name="camera" size={14} />
                <span>{imageUploading ? 'Uploading...' : 'Upload File'}</span>
                <input
                  type="file"
                  accept="image/*"
                  disabled={imageUploading}
                  style={{ display: 'none' }}
                  onChange={e => handleUploadImageFile(e, null, 'new')}
                />
              </label>
            </div>
          </div>

          <div className="form-group" style={{ marginBottom: '1.4rem' }}>
            <label className="form-label" style={{ fontWeight: 700, fontSize: '0.78rem', display: 'block', marginBottom: '0.35rem' }}>Description (Details, Features)</label>
            <textarea
              className="form-input"
              rows={3}
              placeholder="Product ke bare me description likhein (e.g. High quality ball pen with smooth ink flow...)"
              value={newProduct.desc}
              onChange={e => setNewProduct(p => ({ ...p, desc: e.target.value }))}
              style={{ width: '100%', padding: '0.65rem 0.85rem', borderRadius: 8, border: '1.5px solid var(--border, #cbd5e1)', background: 'var(--bg, #fff)', fontSize: '0.84rem', resize: 'vertical' }}
            />
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', borderTop: '1px solid var(--border, #e2e8f0)', paddingTop: '1.1rem' }}>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => setNewProductOpen(false)}
              style={{ padding: '0.6rem 1.25rem', borderRadius: 8 }}
            >
              Cancel
            </button>
            <button
              type="button"
              className="btn btn-orange"
              onClick={handleCreateProduct}
              style={{ padding: '0.6rem 1.6rem', fontWeight: 800, borderRadius: 8, boxShadow: '0 4px 12px rgba(249,115,22,0.3)' }}
            >
              ✨ Save & Publish Product
            </button>
          </div>
        </div>
      </div>
    )}
  </>
);
}

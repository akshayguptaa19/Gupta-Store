'use client';
import { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuthStore, useUIStore, useCartStore } from '@/lib/store';
import { formatCurrency, formatDate } from '@/lib/utils';
import { SHOP, ORDER_STATUSES } from '@/lib/config';
import AppIcon from '@/components/AppIcon';
import FeedbackModal from '@/components/FeedbackModal';
import ProductModal from '@/components/ProductModal';
import { getProductFallbackImage, getMergedProducts } from '@/lib/products';

function resolveOrderItem(item) {
  if (!item) return item;
  try {
    const allProds = getMergedProducts() || [];
    const matched = allProds.find(p =>
      (p.id !== undefined && item.id !== undefined && String(p.id) === String(item.id)) ||
      (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
    );
    const fallback = getProductFallbackImage(item.name, item.category || matched?.category);
    if (matched) {
      const isBadImg = !item.image || item.image.includes('placehold.co') || item.image.includes('51Mh8tX8VPL');
      const img = isBadImg ? (matched.image || fallback) : item.image;
      return {
        ...matched,
        ...item,
        image: img,
        mrp: item.mrp || matched.mrp || matched.price || item.price,
        rating: matched.rating || 4.5,
        reviews: matched.reviews || 120,
        desc: matched.desc || item.desc || `${item.name} - Available at Gupta Store Bakani.`,
        features: matched.features || item.features || [],
      };
    }
    return {
      ...item,
      id: item.id || Date.now(),
      image: (!item.image || item.image.includes('placehold.co') || item.image.includes('51Mh8tX8VPL')) ? fallback : item.image,
      rating: item.rating || 4.5,
      reviews: item.reviews || 120,
      mrp: item.mrp || item.price,
      desc: item.desc || `${item.name} - Available at Gupta Store Bakani.`,
    };
  } catch {}
  return item;
}

export default function OrdersPage() {
  const user = useAuthStore(s => s.user);
  const hydrated = useAuthStore(s => s.hydrated);
  const showToast = useUIStore(s => s.showToast);
  const addToCart = useCartStore(s => s.addItem);
  const router = useRouter();

  const [mounted, setMounted] = useState(false);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setMounted(true);
  }, []);
  const [activeTab, setActiveTab] = useState('all'); // 'all' | 'active' | 'delivered' | 'cancelled'
  const [searchQuery, setSearchQuery] = useState('');
  const [cancellingId, setCancellingId] = useState('');
  const [copiedId, setCopiedId] = useState('');
  const [receiptOrder, setReceiptOrder] = useState(null);
  const [feedbackOrder, setFeedbackOrder] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [phoneInput, setPhoneInput] = useState('');
  const [searchingPhone, setSearchingPhone] = useState(false);
  const [quickTrackId, setQuickTrackId] = useState('');
  const receiptRef = useRef(null);

  function fetchOrders(customPhone) {
    if (!user && !customPhone) {
      setOrders([]);
      setLoading(false);
      return;
    }

    const params = new URLSearchParams();
    if (customPhone) {
      params.set('phone', customPhone);
    } else if (user?.phone) {
      params.set('phone', user.phone);
    }
    if (user?.email && !customPhone) {
      params.set('email', user.email);
    }

    if (!params.toString()) {
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch(`/api/orders?${params.toString()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.ok) {
          setOrders(data.orders || []);
          if (typeof window !== 'undefined' && user) {
            try {
              const cacheKey = `ggs_cached_orders_${user.id || user.phone || 'me'}`;
              localStorage.setItem(cacheKey, JSON.stringify(data.orders || []));
            } catch {}
          }
        } else if (customPhone) {
          showToast(data.message || 'Is mobile number ke koi orders nahi mile.', 'warning');
        }
      })
      .catch(() => showToast('Orders load nahi ho sake. Kripya dobara try karein.', 'error'))
      .finally(() => {
        setLoading(false);
        setSearchingPhone(false);
      });
  }

  useEffect(() => {
    if (!hydrated) return;

    if (!user) {
      // Jab user login nahi hai, koi orders show nahi honge
      setOrders([]);
      setLoading(false);
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('ggs_cached_orders');
          localStorage.removeItem('ggs_last_phone');
          localStorage.removeItem('ggs_saved_orders');
        } catch {}
      }
      return;
    }

    // Agar user logged in hai toh pehle user-specific cache check karein
    if (typeof window !== 'undefined') {
      try {
        const cacheKey = `ggs_cached_orders_${user.id || user.phone || 'me'}`;
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) {
            setOrders(parsed);
            setLoading(false);
          }
        }
      } catch {}
    }

    fetchOrders();

    function onOrderPlaced() {
      fetchOrders();
    }
    window.addEventListener('ggsOrderPlaced', onOrderPlaced);
    return () => window.removeEventListener('ggsOrderPlaced', onOrderPlaced);
  }, [user, hydrated]);

  function handlePhoneLookup(e) {
    if (e) e.preventDefault();
    const clean = phoneInput.replace(/\D/g, '').slice(-10);
    if (clean.length < 10) {
      showToast('Kripya valid 10-digit mobile number daalein.', 'warning');
      return;
    }
    setSearchingPhone(true);
    fetchOrders(clean);
  }

  function getStatusInfo(status) {
    return ORDER_STATUSES.find(s => s.key === status) || ORDER_STATUSES[0];
  }

  // Metrics
  const stats = useMemo(() => {
    const total = orders.length;
    const delivered = orders.filter(o => o.status === 'delivered').length;
    const active = orders.filter(o => !['delivered', 'cancelled'].includes(o.status)).length;
    const cancelled = orders.filter(o => o.status === 'cancelled').length;
    return { total, delivered, active, cancelled };
  }, [orders]);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    return orders.filter(order => {
      if (activeTab === 'active' && ['delivered', 'cancelled'].includes(order.status)) return false;
      if (activeTab === 'delivered' && order.status !== 'delivered') return false;
      if (activeTab === 'cancelled' && order.status !== 'cancelled') return false;

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const idMatch = String(order.orderId || '').toLowerCase().includes(q);
        const itemMatch = order.items?.some(i => String(i.name || '').toLowerCase().includes(q));
        const addrMatch = String(order.address?.name || '').toLowerCase().includes(q) || String(order.address?.area || '').toLowerCase().includes(q);
        if (!idMatch && !itemMatch && !addrMatch) return false;
      }
      return true;
    });
  }, [orders, activeTab, searchQuery]);

  async function cancelOrder(order) {
    if (!confirm(`Kya aap sach mein Order #${order.orderId} cancel karna chahte hain?`)) return;
    setCancellingId(order.orderId);
    try {
      const res = await fetch(`/api/orders/${order.orderId}/cancel`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ phone: user?.phone || order.address?.phone, email: user?.email || order.customerEmail }),
      });
      const data = await res.json();
      if (data.ok) {
        showToast('✅ Order successfully cancel ho gaya.', 'success');
        fetchOrders();
      } else {
        showToast(data.message || 'Order cancel nahi ho saka.', 'error');
      }
    } catch {
      showToast('Network issue. Kripya dobara try karein.', 'error');
    } finally {
      setCancellingId('');
    }
  }

  function handleReorder(order) {
    if (!order.items || order.items.length === 0) return;
    order.items.forEach(i => {
      addToCart({
        id: i.id || Date.now(),
        name: i.name,
        price: Number(i.price),
        mrp: Number(i.mrp || i.price),
        image: i.image || getProductFallbackImage(i.name, i.category),
        category: i.category || 'extra',
        qty: Number(i.qty || 1),
      });
    });
    showToast(`🛍️ ${order.items.length} items cart me add ho gaye!`, 'success');
    router.push('/cart');
  }

  function copyOrderId(id) {
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(id);
      setCopiedId(id);
      showToast(`Order ID #${id} copied!`, 'info');
      setTimeout(() => setCopiedId(''), 2000);
    }
  }

  function printReceipt() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  function handleQuickTrackSubmit(e) {
    if (e) e.preventDefault();
    const clean = quickTrackId.trim().toUpperCase();
    if (!clean) return;
    router.push(`/track?orderId=${encodeURIComponent(clean)}`);
  }

  if (!mounted || !hydrated) {
    return (
      <div className="orders-page-wrapper" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--orange)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Orders Load Ho Rahe Hain...</p>
        </div>
      </div>
    );
  }

  // Jab user login nahi hai toh strictly Login Required screen dikhayenge
  if (!user) {
    return (
      <div className="orders-page-wrapper" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 24px))' }}>
        <div className="orders-container" style={{ maxWidth: 520, margin: '0 auto', padding: '1.5rem 1rem' }}>
          {/* Breadcrumb */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Orders</span>
          </div>

          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '24px',
              padding: '2.5rem 1.5rem',
              textAlign: 'center',
              boxShadow: '0 8px 30px rgba(0,0,0,0.06)',
            }}
          >
            <div
              style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(249, 115, 22, 0.12)',
                color: 'var(--orange)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 1.25rem',
              }}
            >
              <AppIcon name="box" size={34} />
            </div>

            <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
              Apne Orders Dekhne Ke Liye Login Karein
            </h1>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', margin: '0 auto 1.75rem', lineHeight: 1.5, maxWidth: 380 }}>
              Aapke sabhi orders aapke registered account se linked hote hain. Apne orders ki history aur live tracking dekhne ke liye login karein.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 360, margin: '0 auto' }}>
              <button
                type="button"
                onClick={() => {
                  try {
                    localStorage.setItem('ggsLoginRedirect', '/orders');
                  } catch {}
                  router.push('/auth');
                }}
                className="order-primary-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.85rem 1.5rem',
                  fontSize: '0.95rem',
                  fontWeight: 700,
                  borderRadius: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  cursor: 'pointer',
                }}
              >
                <AppIcon name="user" size={18} />
                <span>Login / Register Karein</span>
              </button>

              <Link
                href="/"
                className="order-secondary-btn"
                style={{
                  width: '100%',
                  justifyContent: 'center',
                  padding: '0.75rem 1.5rem',
                  fontSize: '0.88rem',
                  fontWeight: 600,
                  borderRadius: '14px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                }}
              >
                <AppIcon name="cart" size={16} />
                <span>Shop More / Products Dekhein</span>
              </Link>
            </div>

            {/* Quick Track Single Order Box */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px dashed var(--border)',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginBottom: '0.5rem' }}>
                <AppIcon name="truck" size={16} style={{ color: 'var(--orange)' }} />
                <span style={{ fontSize: '0.86rem', fontWeight: 700, color: 'var(--text-primary)' }}>
                  Bina Login Order Track Karna Hai?
                </span>
              </div>
              <p style={{ fontSize: '0.78rem', color: 'var(--text-muted)', margin: '0 0 0.85rem' }}>
                Agar aapke paas Order ID hai, toh aap bina login kiye bhi track kar sakte hain:
              </p>
              <form onSubmit={handleQuickTrackSubmit} style={{ display: 'flex', gap: '0.5rem' }}>
                <input
                  type="text"
                  placeholder="e.g. GGS-8492"
                  value={quickTrackId}
                  onChange={(e) => setQuickTrackId(e.target.value)}
                  style={{
                    flex: 1,
                    padding: '0.6rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    fontSize: '0.84rem',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    fontWeight: 600,
                    outline: 'none',
                  }}
                />
                <button
                  type="submit"
                  className="btn btn-primary"
                  style={{
                    padding: '0.6rem 1rem',
                    borderRadius: '10px',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                  }}
                >
                  Track
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="orders-page-wrapper" style={{ paddingBottom: 'calc(110px + env(safe-area-inset-bottom, 24px))' }}>
      <div className="orders-container">

        {/* Top Header */}
        <div className="orders-top-header">
          <div className="orders-title-group">
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', fontSize: '0.82rem', color: 'var(--text-muted)', marginBottom: '0.2rem' }}>
              <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
              <span>/</span>
              <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Orders</span>
            </div>
            <h1>
              <span>My Orders</span>
              {orders.length > 0 && (
                <span className="orders-count-badge">
                  {orders.length}
                </span>
              )}
            </h1>
          </div>

          <div className="orders-top-actions">
            <Link
              href="/"
              className="order-primary-btn"
              style={{ fontSize: '0.84rem', padding: '0.55rem 1.15rem', display: 'inline-flex', alignItems: 'center', gap: '0.45rem' }}
            >
              <AppIcon name="cart" size={15} />
              <span>Shop More</span>
            </Link>
          </div>
        </div>

        {/* If NO orders loaded yet AND not loading: Phone Lookup & Track Box */}
        {!loading && orders.length === 0 && (
          <div
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: '20px',
              padding: '2rem 1.25rem',
              boxShadow: 'var(--shadow-sm)',
              marginBottom: '1.5rem',
              textAlign: 'center',
            }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                background: 'rgba(249, 115, 22, 0.12)',
                color: 'var(--orange)',
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1rem',
              }}
            >
              <AppIcon name="package" size={30} />
            </div>

            <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
              Apne Orders Dekhein
            </h2>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.88rem', maxWidth: 440, margin: '0 auto 1.5rem', lineHeight: 1.5 }}>
              Apna 10-digit mobile number daalein aur Gupta Store par kiye gaye saare orders turant payein:
            </p>

            {/* Mobile Number Fast Lookup Form */}
            <form onSubmit={handlePhoneLookup} style={{ maxWidth: 420, margin: '0 auto 1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="tel"
                  maxLength={10}
                  placeholder="10-digit Mobile Number"
                  value={phoneInput}
                  onChange={e => setPhoneInput(e.target.value.replace(/\D/g, ''))}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.94rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    fontWeight: 700,
                    letterSpacing: '0.04em',
                  }}
                />
                <button
                  type="submit"
                  disabled={searchingPhone || phoneInput.length < 10}
                  className="btn btn-orange"
                  style={{ borderRadius: '12px', padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  {searchingPhone ? 'Dhoondh rahe hain...' : 'Orders Dekhein'}
                </button>
              </div>
            </form>

            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
              <span style={{ height: '1px', background: 'var(--border)', flex: 1, maxWidth: 100 }} />
              <span>YA PHIR</span>
              <span style={{ height: '1px', background: 'var(--border)', flex: 1, maxWidth: 100 }} />
            </div>

            {/* Quick Track with Order ID Form */}
            <form onSubmit={handleQuickTrackSubmit} style={{ maxWidth: 420, margin: '0 auto 1.5rem' }}>
              <div style={{ display: 'flex', gap: '0.45rem' }}>
                <input
                  type="text"
                  placeholder="Order ID (Jaise: GGS-MVTJTM9Z)"
                  value={quickTrackId}
                  onChange={e => setQuickTrackId(e.target.value.toUpperCase())}
                  style={{
                    flex: 1,
                    padding: '0.75rem 1rem',
                    fontSize: '0.88rem',
                    borderRadius: '12px',
                    border: '1px solid var(--border)',
                    background: 'var(--bg-secondary)',
                    color: 'var(--text-primary)',
                    outline: 'none',
                    textTransform: 'uppercase',
                    fontWeight: 700,
                  }}
                />
                <button
                  type="submit"
                  disabled={!quickTrackId.trim()}
                  className="btn btn-secondary"
                  style={{ borderRadius: '12px', padding: '0.75rem 1.25rem', fontWeight: 700, fontSize: '0.88rem' }}
                >
                  Track ID →
                </button>
              </div>
            </form>

            {/* Login Link */}
            <div style={{ paddingTop: '0.85rem', borderTop: '1px solid var(--border-light)' }}>
              <button
                type="button"
                onClick={() => {
                  localStorage.setItem('ggsLoginRedirect', '/orders');
                  router.push('/auth');
                }}
                style={{ background: 'none', border: 'none', color: 'var(--orange)', fontSize: '0.88rem', fontWeight: 700, cursor: 'pointer' }}
              >
                🔐 Email / Password se Login karke puraane orders dekhein →
              </button>
            </div>
          </div>
        )}

        {/* When Orders Exist: Full Professional Commercial Feed */}
        {orders.length > 0 && (
          <>
            {/* Search & Filter Card */}
            <div className="orders-search-filter-card">
              <div className="orders-search-wrap">
                <input
                  type="text"
                  placeholder="Search by Order ID or item..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="orders-search-input"
                  aria-label="Search orders"
                />
                <span className="orders-search-icon">
                  <AppIcon name="search" size={16} />
                </span>
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    style={{ position: 'absolute', right: '0.85rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.9rem' }}
                    aria-label="Clear search"
                  >
                    ✕
                  </button>
                )}
              </div>

              {/* Status Filter Tabs */}
              <div className="orders-tabs-scroll">
                {[
                  { key: 'all', label: 'All Orders', count: stats.total },
                  { key: 'active', label: 'Active', count: stats.active },
                  { key: 'delivered', label: 'Delivered', count: stats.delivered },
                  { key: 'cancelled', label: 'Cancelled', count: stats.cancelled },
                ].map(tab => {
                  const isActive = activeTab === tab.key;
                  return (
                    <button
                      key={tab.key}
                      type="button"
                      onClick={() => setActiveTab(tab.key)}
                      className={`orders-tab-pill ${isActive ? 'active' : ''}`}
                    >
                      <span>{tab.label}</span>
                      <span className="orders-tab-badge">
                        {tab.count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Orders Feed */}
            {loading ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {[1, 2, 3].map(n => (
                  <div
                    key={n}
                    style={{
                      background: 'var(--bg-card)',
                      borderRadius: '18px',
                      border: '1px solid var(--border)',
                      padding: '1.25rem',
                      height: '150px',
                      display: 'flex',
                      flexDirection: 'column',
                      justifyContent: 'space-between',
                      opacity: 0.6,
                    }}
                  >
                    <div style={{ width: '45%', height: '20px', background: 'var(--border)', borderRadius: '6px' }} />
                    <div style={{ width: '80%', height: '36px', background: 'var(--border)', borderRadius: '6px' }} />
                    <div style={{ width: '35%', height: '28px', background: 'var(--border)', borderRadius: '6px' }} />
                  </div>
                ))}
              </div>
            ) : filteredOrders.length === 0 ? (
              <div
                style={{
                  background: 'var(--bg-card)',
                  borderRadius: '20px',
                  border: '1px solid var(--border)',
                  padding: '3rem 1.5rem',
                  textAlign: 'center',
                  boxShadow: 'var(--shadow-xs)',
                }}
              >
                <div
                  style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: 'rgba(249,115,22,0.1)',
                    color: 'var(--orange)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    marginBottom: '0.85rem',
                  }}
                >
                  <AppIcon name="package" size={28} />
                </div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.35rem' }}>
                  {searchQuery ? `"${searchQuery}" ke liye koi order nahi mila` : 'Is category me koi order nahi hai'}
                </h3>
                <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', maxWidth: 360, margin: '0 auto 1.5rem' }}>
                  {searchQuery ? 'Kripya Order ID ya item name dobara check karein.' : 'Gupta Store se apni pasand ke school items aur notebooks order karein.'}
                </p>
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => setSearchQuery('')}
                    className="btn btn-secondary"
                    style={{ borderRadius: '10px', padding: '0.65rem 1.4rem', fontWeight: 700, fontSize: '0.88rem' }}
                  >
                    Search Clear Karein
                  </button>
                ) : (
                  <Link
                    href="/"
                    className="btn btn-orange"
                    style={{ borderRadius: '10px', padding: '0.7rem 1.6rem', fontWeight: 700, fontSize: '0.9rem', textDecoration: 'none' }}
                  >
                    Shopping Start Karein →
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
                {filteredOrders.map(order => {
                  const sInfo = getStatusInfo(order.status);
                  const isPlaced = order.status === 'placed';
                  const isDelivered = order.status === 'delivered';
                  const isCancelled = order.status === 'cancelled';
                  const isActive = !isDelivered && !isCancelled;

                  const statusClass = isDelivered ? 'delivered' : isCancelled ? 'cancelled' : isPlaced ? 'placed' : 'active';

                  return (
                    <div key={order.orderId} className="order-pro-card">
                      {/* Card Top: Status & Order ID */}
                      <div className="order-pro-header">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                          <span className={`order-status-badge ${statusClass}`}>
                            <span className="order-status-dot" />
                            {sInfo.label}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {formatDate(order.createdAt)}
                          </span>
                        </div>

                        <div className="order-pro-id-group">
                          <span className="order-id-code">
                            #{order.orderId}
                          </span>
                          <button
                            type="button"
                            onClick={() => copyOrderId(order.orderId)}
                            title="Copy Order ID"
                            className="order-copy-btn"
                            aria-label={`Copy Order ID ${order.orderId}`}
                          >
                            <AppIcon name={copiedId === order.orderId ? 'check' : 'clipboard'} size={14} />
                          </button>
                        </div>
                      </div>

                      {/* Card Body: Items List */}
                      <div className="order-pro-body">
                        <div>
                          {(order.items || []).map((item, idx) => {
                            const resolved = resolveOrderItem(item);
                            return (
                              <div key={`${item.id || item.name}_${idx}`} className="order-item-row">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                  src={resolved.image}
                                  alt={item.name}
                                  onClick={() => setSelectedProduct(resolved)}
                                  className="order-item-img"
                                  onError={e => { e.target.src = getProductFallbackImage(item.name, item.category); }}
                                />
                                <div className="order-item-details">
                                  <div
                                    onClick={() => setSelectedProduct(resolved)}
                                    className="order-item-name"
                                    title={item.name}
                                  >
                                    {item.name}
                                  </div>
                                  <div className="order-item-meta">
                                    <span className="order-qty-pill">Qty: {item.qty || item.quantity || 1}</span>
                                    <span>•</span>
                                    <span>{formatCurrency(item.price)} each</span>
                                  </div>
                                </div>
                                <div className="order-item-total">
                                  {formatCurrency((item.price || 0) * (item.qty || item.quantity || 1))}
                                </div>
                              </div>
                            );
                          })}
                        </div>

                        {/* Order Sub-summary Bar */}
                        <div className="order-delivery-snippet">
                          <div className="address-text">
                            <AppIcon name="mapPin" size={13} style={{ color: 'var(--orange)' }} />
                            <span>Deliver to: <strong>{order.address?.name || 'Customer'}</strong> ({order.address?.area || 'Bakani'})</span>
                          </div>
                          <div className="amount-text">
                            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>Total:</span>
                            <span className="order-grand-total">
                              {formatCurrency(order.total)}
                            </span>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>({order.payment === 'cod' ? 'COD' : 'Paid'})</span>
                          </div>
                        </div>
                      </div>

                      {/* Card Actions Footer: Mobile-Optimized Grid */}
                      <div className="order-pro-actions">
                        <Link
                          href={`/track?orderId=${order.orderId}`}
                          className="order-primary-btn"
                        >
                          <AppIcon name="truck" size={15} />
                          <span>Track Live Status →</span>
                        </Link>

                        <div className="order-sub-actions-row">
                          <button
                            type="button"
                            onClick={() => setReceiptOrder(order)}
                            className="order-secondary-btn"
                          >
                            <AppIcon name="fileText" size={14} />
                            <span>Invoice</span>
                          </button>

                          <button
                            type="button"
                            onClick={() => handleReorder(order)}
                            className="order-secondary-btn"
                          >
                            <AppIcon name="refresh" size={14} />
                            <span>Reorder</span>
                          </button>

                          {isDelivered && (
                            <button
                              type="button"
                              onClick={() => setFeedbackOrder(order)}
                              className="order-secondary-btn"
                              style={{ color: '#16a34a', borderColor: 'rgba(34,197,94,0.3)', background: 'rgba(34,197,94,0.06)' }}
                            >
                              <AppIcon name="star" size={14} />
                              <span>Rate Item</span>
                            </button>
                          )}

                          {isPlaced && (
                            <button
                              type="button"
                              disabled={cancellingId === order.orderId}
                              onClick={() => cancelOrder(order)}
                              className="order-secondary-btn"
                              style={{ color: 'var(--red)', borderColor: 'rgba(239,68,68,0.3)', background: 'rgba(239,68,68,0.04)' }}
                            >
                              <span>{cancellingId === order.orderId ? 'Cancelling...' : 'Cancel Order'}</span>
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </>
        )}

      </div>

      {/* Tax Invoice & Printable Receipt Modal */}
      {receiptOrder && (
        <div
          onClick={() => setReceiptOrder(null)}
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(15, 23, 42, 0.7)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem',
            zIndex: 1100,
          }}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{
              background: 'var(--bg-card)',
              borderRadius: '22px',
              border: '1px solid var(--border)',
              width: '100%',
              maxWidth: 580,
              maxHeight: '90vh',
              overflowY: 'auto',
              boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
              padding: '1.75rem',
            }}
          >
            <div ref={receiptRef}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2.5px solid var(--orange)', paddingBottom: '0.85rem', marginBottom: '1.25rem' }}>
                <div>
                  <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.4rem', fontWeight: 900, color: 'var(--orange)', margin: 0 }}>
                    Gupta General Store
                  </h2>
                  <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '2px' }}>
                    Main Market, Bakani, Rajasthan - 326022 • Ph: +91 81076 15285
                  </div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-muted)' }}>DELIVERY INVOICE</div>
                  <div style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--text-primary)' }}>#{receiptOrder.orderId}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{formatDate(receiptOrder.createdAt)}</div>
                </div>
              </div>

              <div style={{ background: 'var(--bg-secondary)', borderRadius: '12px', padding: '0.85rem 1rem', marginBottom: '1.25rem', fontSize: '0.84rem' }}>
                <div style={{ fontWeight: 800, color: 'var(--text-primary)', marginBottom: '0.2rem' }}>
                  Customer Details: {receiptOrder.address?.name || 'Customer'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Phone: {receiptOrder.address?.phone || user?.phone || 'N/A'}
                </div>
                <div style={{ color: 'var(--text-secondary)' }}>
                  Address: {receiptOrder.address?.area || 'Bakani, Rajasthan'} - {receiptOrder.address?.pincode || '326022'}
                </div>
              </div>

              {/* Items Table */}
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.84rem', marginBottom: '1.25rem' }}>
                <thead>
                  <tr style={{ background: 'var(--bg-secondary)', borderBottom: '1px solid var(--border)' }}>
                    <th style={{ padding: '0.55rem', textAlign: 'left', fontWeight: 800, color: 'var(--text-muted)' }}>Item</th>
                    <th style={{ padding: '0.55rem', textAlign: 'center', fontWeight: 800, color: 'var(--text-muted)' }}>Qty</th>
                    <th style={{ padding: '0.55rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-muted)' }}>Price</th>
                    <th style={{ padding: '0.55rem', textAlign: 'right', fontWeight: 800, color: 'var(--text-muted)' }}>Total</th>
                  </tr>
                </thead>
                <tbody>
                  {(receiptOrder.items || []).map((it, idx) => (
                    <tr key={idx} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '0.65rem 0.55rem', fontWeight: 600, color: 'var(--text-primary)' }}>{it.name}</td>
                      <td style={{ padding: '0.65rem 0.55rem', textAlign: 'center', color: 'var(--text-secondary)' }}>{it.qty || it.quantity || 1}</td>
                      <td style={{ padding: '0.65rem 0.55rem', textAlign: 'right', color: 'var(--text-secondary)' }}>{formatCurrency(it.price)}</td>
                      <td style={{ padding: '0.65rem 0.55rem', textAlign: 'right', fontWeight: 700, color: 'var(--text-primary)' }}>{formatCurrency((it.price || 0) * (it.qty || it.quantity || 1))}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem', alignItems: 'flex-end', fontSize: '0.84rem', borderTop: '1px solid var(--border)', paddingTop: '0.75rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Subtotal:</span>
                  <span style={{ fontWeight: 700 }}>{formatCurrency(receiptOrder.sub || receiptOrder.total)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220 }}>
                  <span style={{ color: 'var(--text-muted)' }}>Delivery Charges:</span>
                  <span style={{ fontWeight: 700, color: receiptOrder.delivery === 0 ? 'var(--green)' : 'var(--text-primary)' }}>
                    {receiptOrder.delivery === 0 ? 'FREE' : formatCurrency(receiptOrder.delivery || 20)}
                  </span>
                </div>
                {receiptOrder.discount > 0 && (
                  <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, color: 'var(--red)' }}>
                    <span>Coupon Discount:</span>
                    <span style={{ fontWeight: 700 }}>-{formatCurrency(receiptOrder.discount)}</span>
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', width: 220, fontSize: '1rem', fontWeight: 900, color: 'var(--orange)', borderTop: '1px dashed var(--border)', paddingTop: '0.45rem', marginTop: '0.25rem' }}>
                  <span>Grand Total:</span>
                  <span>{formatCurrency(receiptOrder.total)}</span>
                </div>
              </div>

              <div style={{ marginTop: '1.25rem', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', textAlign: 'center', fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                Gupta General Store Bakani me shopping karne ke liye dhanyawaad! Guaranteed authentic stationery since 1990.
              </div>
            </div>

            <div style={{ display: 'flex', gap: '0.65rem', justifyContent: 'flex-end', marginTop: '1.5rem', borderTop: '1px solid var(--border-light)', paddingTop: '1rem' }}>
              <button
                type="button"
                onClick={printReceipt}
                className="btn btn-orange btn-sm"
                style={{ borderRadius: '10px', padding: '0.6rem 1.4rem', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}
              >
                <AppIcon name="download" size={14} />
                <span>Print Bill</span>
              </button>
              <button
                type="button"
                onClick={() => setReceiptOrder(null)}
                className="btn btn-ghost btn-sm"
                style={{ borderRadius: '10px', padding: '0.6rem 1.25rem', border: '1px solid var(--border)', color: 'var(--text-secondary)' }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Review Modal */}
      {feedbackOrder && (
        <FeedbackModal
          order={feedbackOrder}
          onClose={() => setFeedbackOrder(null)}
          onSubmitSuccess={() => {
            showToast('Feedback submit ho gaya! Dhanyawaad.', 'success');
            setFeedbackOrder(null);
          }}
        />
      )}

      {/* Product Details Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}

'use client';
import { Suspense, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { ORDER_STATUSES, SHOP } from '@/lib/config';
import { formatCurrency, formatDate, getDeliveryEstimate } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';
import ProductModal from '@/components/ProductModal';
import FeedbackModal from '@/components/FeedbackModal';
import { getMergedProducts, getProductFallbackImage } from '@/lib/products';
import { useAuthStore, useUIStore } from '@/lib/store';

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

function TrackContent() {
  const params = useSearchParams();
  const urlOrderId = params.get('orderId');
  const [orderId, setOrderId] = useState(urlOrderId || '');
  const [inputOrderId, setInputOrderId] = useState(urlOrderId || '');
  const [showSearchBox, setShowSearchBox] = useState(!urlOrderId);
  const [selectedProduct, setSelectedProduct] = useState(null);

  function openProductDetails(rawItem) {
    if (!rawItem) return;
    const resolved = resolveOrderItem(rawItem);
    setSelectedProduct(resolved);
  }

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [userOrders, setUserOrders] = useState([]);
  const [copiedId, setCopiedId] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const user = useAuthStore(s => s.user);
  const showToast = useUIStore(s => s.showToast);

  useEffect(() => {
    if (urlOrderId) {
      setOrderId(urlOrderId);
      setInputOrderId(urlOrderId);
      setShowSearchBox(false);
    }
  }, [urlOrderId]);

  useEffect(() => {
    if (!orderId) {
      setOrder(null);
      return;
    }
    setLoading(true);
    setErrorMsg('');
    fetch(`/api/orders/${encodeURIComponent(orderId)}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.order) {
          setOrder(data.order);
        } else {
          setOrder(null);
          setErrorMsg(data.message || 'Order ID nahi mili. Kripya check karke dobara daalein.');
        }
      })
      .catch(() => {
        setOrder(null);
        setErrorMsg('Network issue. Kripya internet connection check karein.');
      })
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if ((user?.email || user?.phone) && !urlOrderId) {
      const p = new URLSearchParams();
      if (user.email) p.set('email', user.email);
      if (user.phone) p.set('phone', user.phone);
      fetch(`/api/orders?${p.toString()}`, { cache: 'no-store' })
        .then(res => res.json())
        .then(data => { if (data.ok) setUserOrders(data.orders || []); })
        .catch(() => {});
    }
  }, [user?.email, user?.phone, urlOrderId]);

  function handleTrackSubmit(e) {
    if (e) e.preventDefault();
    const clean = inputOrderId.trim().toUpperCase();
    if (!clean) return;
    setOrderId(clean);
    setShowSearchBox(false);
  }

  function handleCopyOrderId() {
    if (order?.orderId && typeof navigator !== 'undefined' && navigator.clipboard) {
      navigator.clipboard.writeText(order.orderId);
      setCopiedId(true);
      showToast('Order ID copied to clipboard!', 'info');
      setTimeout(() => setCopiedId(false), 2000);
    }
  }

  function handleCopyTrackingLink() {
    if (typeof window !== 'undefined' && navigator?.clipboard) {
      const fullUrl = `${window.location.origin}/track?orderId=${order?.orderId || orderId}`;
      navigator.clipboard.writeText(fullUrl);
      setCopiedLink(true);
      showToast('Tracking link copied!', 'info');
      setTimeout(() => setCopiedLink(false), 2000);
    }
  }

  function handlePrintReceipt() {
    if (typeof window !== 'undefined') {
      window.print();
    }
  }

  const statusOrder = useMemo(() => [
    { key: 'placed',           label: 'Order Placed',      icon: 'placed' },
    { key: 'confirmed',        label: 'Confirmed',         icon: 'confirmed' },
    { key: 'packed',           label: 'Packed',            icon: 'packed' },
    { key: 'shipped',          label: 'Shipped',           icon: 'shipped' },
    { key: 'out_for_delivery', label: 'Out for Delivery',  icon: 'out_for_delivery' },
    { key: 'delivered',        label: 'Delivered',         icon: 'delivered' },
  ], []);

  const currentStatus = order?.status || 'placed';
  const currentIndex = statusOrder.findIndex(s => s.key === currentStatus);
  const isCancelled = currentStatus === 'cancelled';
  const deliveryEstimate = order?.expectedDelivery || getDeliveryEstimate();

  // Find latest timestamp or tracking events
  const trackingEvents = useMemo(() => {
    if (!order) return [];
    if (order.tracking && order.tracking.length > 0) {
      return order.tracking.slice().reverse();
    }
    return [
      {
        status: order.status || 'placed',
        note: 'Order successfully placed & recorded at Gupta Store Bakani.',
        time: order.createdAt,
      }
    ];
  }, [order]);

  return (
    <div className="track-page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '1.5rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 1060, margin: '0 auto' }}>
        
        {/* Navigation Bar & Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
            <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
            <span>/</span>
            <Link href="/orders" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Orders</Link>
            <span>/</span>
            <span style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Live Tracking</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <span style={{ display: 'inline-flex', alignItems: 'center', gap: '0.35rem', padding: '0.25rem 0.65rem', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '999px', fontSize: '0.74rem', fontWeight: 700 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#16a34a', display: 'inline-block', boxShadow: '0 0 6px #16a34a' }} />
              Bakani Local Express Fleet
            </span>
            {order && (
              <button
                type="button"
                onClick={() => setShowSearchBox(!showSearchBox)}
                className="btn-no-print"
                style={{
                  background: 'var(--bg-card)',
                  border: '1px solid var(--border)',
                  borderRadius: '8px',
                  padding: '0.3rem 0.75rem',
                  fontSize: '0.78rem',
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'var(--text-primary)',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.35rem',
                }}
              >
                <AppIcon name="search" size={13} />
                <span>{showSearchBox ? 'Hide Search' : 'Track Another Order'}</span>
              </button>
            )}
          </div>
        </div>

        {/* Collapsible Search & Recent Orders Card */}
        {(!order || showSearchBox) && (
          <div
            className="track-search-card"
            style={{
              background: 'var(--bg-card)',
              borderRadius: '18px',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
              padding: '1.5rem 1.75rem',
              marginBottom: '1.5rem',
              transition: 'all 0.25s ease',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1rem' }}>
              <div
                style={{
                  width: 42,
                  height: 42,
                  borderRadius: '12px',
                  background: 'rgba(249, 115, 22, 0.12)',
                  color: 'var(--orange)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                <AppIcon name="truck" size={22} strokeWidth={2.2} />
              </div>
              <div>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Live Order Tracking
                </h1>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.82rem', color: 'var(--text-muted)' }}>
                  Apna Order ID (jaise <code style={{ color: 'var(--orange)', fontWeight: 700 }}>#GGS-MVTJTM9Z</code>) daalein aur live dispatch status dekhein.
                </p>
              </div>
            </div>

            <form onSubmit={handleTrackSubmit} style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap' }}>
              <div style={{ flex: 1, minWidth: 240, position: 'relative' }}>
                <input
                  type="text"
                  className="form-input"
                  placeholder="e.g. GGS-MVTJTM9Z"
                  value={inputOrderId}
                  onChange={e => setInputOrderId(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '0.8rem 1rem 0.8rem 2.5rem',
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    background: 'var(--bg-card)',
                    color: 'var(--text-primary)',
                  }}
                />
                <span style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
                  <AppIcon name="search" size={17} />
                </span>
              </div>
              <button
                type="submit"
                className="btn btn-orange"
                disabled={loading}
                style={{
                  padding: '0.8rem 1.6rem',
                  fontSize: '0.92rem',
                  fontWeight: 800,
                  borderRadius: '12px',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  boxShadow: '0 4px 12px rgba(249, 115, 22, 0.3)',
                }}
              >
                {loading ? 'Tracking...' : 'Track Order →'}
              </button>
            </form>

            {errorMsg && (
              <div style={{ marginTop: '0.85rem', padding: '0.65rem 0.85rem', background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.25)', borderRadius: '10px', color: 'var(--red)', fontSize: '0.84rem' }}>
                ⚠️ {errorMsg}
              </div>
            )}

            {/* Quick chips of recent orders */}
            {!order && userOrders.length > 0 && (
              <div style={{ marginTop: '1.25rem', paddingTop: '1.15rem', borderTop: '1px solid var(--border-light)' }}>
                <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.6rem' }}>
                  Aapke Haaliya Orders (Tap to Track)
                </div>
                <div style={{ display: 'flex', gap: '0.6rem', flexWrap: 'wrap' }}>
                  {userOrders.slice(0, 5).map((o, idx) => (
                    <button
                      key={`${o.orderId}_${idx}`}
                      type="button"
                      onClick={() => { setInputOrderId(o.orderId); setOrderId(o.orderId); setShowSearchBox(false); }}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.45rem',
                        padding: '0.45rem 0.85rem',
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.82rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <span style={{ color: 'var(--orange)' }}>#{o.orderId}</span>
                      <span style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>({formatCurrency(o.total)})</span>
                      <span style={{ color: 'var(--orange)', fontSize: '0.78rem' }}>→</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Loaded Order Presentation */}
        {order && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            
            {/* Primary Order Tracking & Stepper Card */}
            <div
              className="track-card-printable"
              style={{
                background: 'var(--bg-card)',
                borderRadius: '20px',
                border: '1px solid var(--border)',
                boxShadow: '0 4px 22px -2px rgba(0,0,0,0.04)',
                padding: '1.75rem',
              }}
            >
              {/* Header Bar: ID, Date, Payment, and Status */}
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', paddingBottom: '1.25rem', borderBottom: '1px solid var(--border-light)' }}>
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <span style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      ORDER IDENTIFIER
                    </span>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                      COD Verified
                    </span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', marginTop: '0.25rem' }}>
                    <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 900, margin: 0, color: 'var(--text-primary)', letterSpacing: '-0.01em' }}>
                      #{order.orderId}
                    </h2>
                    <button
                      type="button"
                      onClick={handleCopyOrderId}
                      className="btn-no-print"
                      title="Copy Order ID"
                      style={{
                        background: 'var(--bg-secondary)',
                        border: '1px solid var(--border)',
                        borderRadius: '6px',
                        padding: '0.25rem 0.55rem',
                        fontSize: '0.74rem',
                        fontWeight: 700,
                        cursor: 'pointer',
                        color: copiedId ? 'var(--green)' : 'var(--text-muted)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.3rem',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <AppIcon name={copiedId ? 'check' : 'clipboard'} size={13} />
                      <span>{copiedId ? 'Copied!' : 'Copy'}</span>
                    </button>
                  </div>

                  <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '0.3rem', display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <span>Placed on: <strong>{formatDate(order.createdAt)}</strong></span>
                    <span>•</span>
                    <span>Payment: <strong style={{ color: 'var(--text-primary)' }}>Cash on Delivery</strong></span>
                  </div>
                </div>

                {/* Status Badge & Actions */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
                  <span
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.45rem',
                      padding: '0.5rem 1.15rem',
                      borderRadius: '999px',
                      fontSize: '0.88rem',
                      fontWeight: 800,
                      background: isCancelled
                        ? 'rgba(239,68,68,0.1)'
                        : currentStatus === 'delivered'
                        ? 'rgba(16,185,129,0.12)'
                        : 'rgba(249,115,22,0.12)',
                      color: isCancelled
                        ? 'var(--red)'
                        : currentStatus === 'delivered'
                        ? '#16a34a'
                        : '#ea580c',
                      border: `1.5px solid ${isCancelled ? 'rgba(239,68,68,0.3)' : currentStatus === 'delivered' ? 'rgba(16,185,129,0.3)' : 'rgba(249,115,22,0.3)'}`,
                    }}
                  >
                    <span
                      style={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        background: isCancelled ? 'var(--red)' : currentStatus === 'delivered' ? '#16a34a' : '#f97316',
                        boxShadow: `0 0 8px ${isCancelled ? 'var(--red)' : currentStatus === 'delivered' ? '#16a34a' : '#f97316'}`,
                      }}
                    />
                    {ORDER_STATUSES.find(s => s.key === currentStatus)?.label || currentStatus}
                  </span>

                  <button
                    type="button"
                    onClick={handleCopyTrackingLink}
                    className="btn-no-print"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    title="Share this tracking link"
                  >
                    <AppIcon name="share" size={14} />
                    <span>{copiedLink ? 'Link Copied!' : 'Share Link'}</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrintReceipt}
                    className="btn-no-print"
                    style={{
                      background: 'var(--bg-secondary)',
                      border: '1px solid var(--border)',
                      borderRadius: '8px',
                      padding: '0.5rem 0.85rem',
                      fontSize: '0.8rem',
                      fontWeight: 700,
                      color: 'var(--text-primary)',
                      cursor: 'pointer',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                    }}
                    title="Print or save order receipt"
                  >
                    <AppIcon name="download" size={14} />
                    <span>Print Receipt</span>
                  </button>

                  {currentStatus === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(true)}
                      className="btn-no-print"
                      style={{
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.5rem 0.95rem',
                        fontSize: '0.8rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                      }}
                      title="Rate products and submit review"
                    >
                      <AppIcon name="star" size={14} fill="#ffffff" />
                      <span>Rate & Review</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Delivery ETA & Logistics Banner */}
              <div className="track-eta-banner" style={{ margin: '1.25rem 0 1.5rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: '12px',
                      background: currentStatus === 'delivered'
                        ? 'linear-gradient(135deg, #16a34a 0%, #15803d 100%)'
                        : 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
                      color: '#ffffff',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      boxShadow: currentStatus === 'delivered'
                        ? '0 4px 14px rgba(22, 163, 74, 0.3)'
                        : '0 4px 14px rgba(249, 115, 22, 0.3)',
                      flexShrink: 0,
                    }}
                  >
                    <AppIcon name={currentStatus === 'delivered' ? 'check' : 'truck'} size={22} strokeWidth={2.5} />
                  </div>
                  <div>
                    <span style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block' }}>
                      {currentStatus === 'delivered' ? 'ORDER DELIVERED SUCCESSFULLY' : 'EXPECTED LOCAL DELIVERY'}
                    </span>
                    <strong style={{ fontSize: '1.05rem', color: currentStatus === 'delivered' ? '#16a34a' : 'var(--text-primary)' }}>
                      {currentStatus === 'delivered' ? 'Doorstep Handover Complete' : `${deliveryEstimate.weekday}, ${deliveryEstimate.dateLabel}`}
                    </strong>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '0.1rem' }}>
                      {currentStatus === 'delivered' ? `Delivered to ${order.address?.name || 'Customer'} in Bakani` : `${deliveryEstimate.promise} • Doorstep in Bakani`}
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', flexWrap: 'wrap' }}>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: '0.74rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      COURIER FLEET
                    </div>
                    <div style={{ fontSize: '0.86rem', fontWeight: 700, color: '#16a34a' }}>
                      ⚡ Gupta Store Direct Dispatch
                    </div>
                  </div>
                  {currentStatus === 'delivered' && (
                    <button
                      type="button"
                      onClick={() => setShowFeedbackModal(true)}
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        fontSize: '0.82rem',
                        fontWeight: 800,
                        color: '#ffffff',
                        background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 100%)',
                        border: 'none',
                        borderRadius: '8px',
                        padding: '0.55rem 1rem',
                        cursor: 'pointer',
                        boxShadow: '0 2px 8px rgba(245, 158, 11, 0.35)',
                      }}
                    >
                      <AppIcon name="star" size={14} fill="#ffffff" />
                      <span>Rate Order Items ⭐</span>
                    </button>
                  )}
                </div>
              </div>

              {/* Professional Connected 6-Stage Progress Tracker */}
              {!isCancelled ? (
                <div style={{ margin: '1.5rem 0 0.5rem' }}>
                  <div className="track-stepper-container">
                    {statusOrder.map((step, idx) => {
                      const isDone = currentStatus === 'delivered' ? true : idx < currentIndex;
                      const isActive = currentStatus === 'delivered' ? false : idx === currentIndex;
                      const isUpcoming = idx > currentIndex;

                      return (
                        <div key={step.key} className="track-step-node-col">
                          {/* Segment connector line */}
                          {idx > 0 && (
                            <div
                              className={`track-step-line ${
                                idx <= currentIndex ? (idx === currentIndex ? 'active' : 'done') : ''
                              }`}
                            />
                          )}

                          {/* Node Circle */}
                          <div
                            className={`track-step-circle ${
                              isDone ? 'done' : isActive ? 'active' : 'upcoming'
                            }`}
                          >
                            {isDone ? (
                              <AppIcon name="check" size={18} strokeWidth={3} />
                            ) : (
                              <AppIcon name={step.icon} size={18} strokeWidth={2.2} />
                            )}
                          </div>

                          {/* Label */}
                          <div
                            className="track-step-title"
                            style={{
                              color: isActive
                                ? '#ea580c'
                                : isDone
                                ? 'var(--text-primary)'
                                : 'var(--text-muted)',
                            }}
                          >
                            {step.label}
                          </div>

                          {/* Subtitle / Timestamp */}
                          <div
                            className="track-step-sub"
                            style={{
                              color: isActive
                                ? '#ea580c'
                                : isDone
                                ? '#16a34a'
                                : 'var(--text-muted)',
                            }}
                          >
                            {isActive ? (
                              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
                                <span style={{ width: 5, height: 5, borderRadius: '50%', background: '#ea580c', display: 'inline-block' }} />
                                Active
                              </span>
                            ) : isDone ? (
                              'Completed'
                            ) : (
                              'Upcoming'
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ) : (
                <div style={{ padding: '1.25rem', background: 'rgba(239,68,68,0.08)', borderRadius: '12px', color: 'var(--red)', fontSize: '0.92rem', border: '1px solid rgba(239,68,68,0.25)', display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <AppIcon name="close" size={20} />
                  <div>
                    <strong>Yeh order cancel ho chuka hai.</strong>
                    <div style={{ fontSize: '0.82rem', marginTop: '0.15rem' }}>Reason: {order.cancellationReason || 'Cancelled by store or customer'}</div>
                  </div>
                </div>
              )}
            </div>

            {/* 2-Column Split: Activity Log (Left) & Items / Address / Billing (Right) */}
            <div className="track-grid-layout" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 300px), 1fr))', gap: '1.5rem', alignItems: 'start' }}>
              
              {/* Left Column: Tracking Log & Support */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Timeline Status Updates Card */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <AppIcon name="clock" size={17} style={{ color: 'var(--orange)' }} />
                      <span>Live Tracking Activity</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'rgba(22, 163, 74, 0.1)', color: '#16a34a', borderRadius: '6px' }}>
                      Real-time Feed
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1.15rem' }}>
                    {trackingEvents.map((t, idx) => (
                      <div key={idx} style={{ display: 'flex', gap: '0.9rem' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                          <div
                            style={{
                              width: 14,
                              height: 14,
                              borderRadius: '50%',
                              background: idx === 0 ? '#ea580c' : '#16a34a',
                              marginTop: '0.2rem',
                              boxShadow: idx === 0 ? '0 0 0 3px rgba(249,115,22,0.22)' : 'none',
                              flexShrink: 0,
                            }}
                          />
                          {idx < trackingEvents.length - 1 && (
                            <div style={{ width: 2, flex: 1, background: 'var(--border)', minHeight: 28, margin: '4px 0' }} />
                          )}
                        </div>

                        <div style={{ flex: 1 }}>
                          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                            <div style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-primary)' }}>
                              {ORDER_STATUSES.find(s => s.key === t.status)?.label || t.status}
                            </div>
                            <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                              {formatDate(t.time || order.createdAt)}
                            </span>
                          </div>

                          <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', marginTop: '0.2rem', lineHeight: 1.45 }}>
                            {t.note || 'Status update logged in Bakani system.'}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Delivery Assistance & Support Card */}
                <div className="track-support-card">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                    <div style={{ width: 36, height: 36, borderRadius: '10px', background: 'rgba(37, 211, 102, 0.15)', color: '#16a34a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AppIcon name="phone" size={18} />
                    </div>
                    <div>
                      <h4 style={{ margin: 0, fontSize: '0.94rem', fontWeight: 800, color: 'var(--text-primary)' }}>
                        Delivery Assistance & Support
                      </h4>
                      <p style={{ margin: '0.1rem 0 0', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                        Gupta General Store, Main Market, Bakani (Jhalawar)
                      </p>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: '0.65rem', flexWrap: 'wrap', marginTop: '0.25rem' }}>
                    <button
                      type="button"
                      onClick={() => {
                        if (typeof window !== 'undefined') {
                          window.dispatchEvent(new CustomEvent('ggsOpenChatbot', { detail: { order } }));
                        }
                      }}
                      style={{
                        flex: 1,
                        minWidth: 160,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: 'linear-gradient(135deg, #ea580c 0%, #c2410c 100%)',
                        color: '#ffffff',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        border: 'none',
                        cursor: 'pointer',
                        boxShadow: '0 3px 10px rgba(234,88,12,0.25)',
                      }}
                      title="AI Support Assistant se Order Help lein"
                    >
                      <AppIcon name="message" size={16} />
                      <span>AI Order Assistant</span>
                    </button>

                    <a
                      href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store, mujhe mere Order #${order.orderId} ki live update chahiye.`)}`}
                      target="_blank"
                      rel="noreferrer"
                      style={{
                        flex: 1,
                        minWidth: 160,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: '#25d366',
                        color: '#ffffff',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        textDecoration: 'none',
                        boxShadow: '0 3px 10px rgba(37,211,102,0.25)',
                        transition: 'transform 0.15s ease',
                      }}
                    >
                      <AppIcon name="message" size={16} />
                      <span>WhatsApp Store</span>
                    </a>

                    <a
                      href={`tel:${SHOP.phone}`}
                      style={{
                        flex: 1,
                        minWidth: 140,
                        display: 'inline-flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '0.45rem',
                        background: 'var(--bg-card)',
                        color: 'var(--text-primary)',
                        border: '1px solid var(--border)',
                        padding: '0.65rem 1rem',
                        borderRadius: '10px',
                        fontWeight: 700,
                        fontSize: '0.84rem',
                        textDecoration: 'none',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      <AppIcon name="phone" size={15} />
                      <span>Call Store</span>
                    </a>
                  </div>
                </div>

              </div>

              {/* Right Column: Ordered Items, Bill Summary, Delivery Address */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                
                {/* Items Summary Card */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <AppIcon name="cart" size={17} style={{ color: 'var(--orange)' }} />
                      <span>Ordered Items ({order.items?.length || 0})</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>
                      Click item to view details
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                    {(order.items || []).map((rawItem, idx) => {
                      const item = resolveOrderItem(rawItem);
                      return (
                        <div
                          key={idx}
                          onClick={() => openProductDetails(item)}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            gap: '0.75rem',
                            padding: '0.65rem 0.85rem',
                            borderRadius: '12px',
                            background: 'var(--bg)',
                            border: '1px solid var(--border-light)',
                            cursor: 'pointer',
                            transition: 'all 0.2s ease',
                          }}
                          className="order-item-pro-card"
                          title={`Click to view ${item.name} details`}
                        >
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', minWidth: 0 }}>
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={item.image || getProductFallbackImage(item.name, item.category)}
                              alt={item.name}
                              referrerPolicy="no-referrer"
                              style={{ width: 46, height: 46, objectFit: 'contain', borderRadius: 8, background: '#ffffff', padding: 3, border: '1px solid var(--border)', flexShrink: 0 }}
                              onError={e => {
                                e.target.onerror = null;
                                e.target.src = getProductFallbackImage(item.name, item.category);
                              }}
                            />
                            <div style={{ minWidth: 0 }}>
                              <div className="order-item-title" style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                                {item.name}
                              </div>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem', marginTop: '0.15rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Qty: {item.qty} × ₹{item.price}</span>
                                <span style={{ fontSize: '0.68rem', fontWeight: 700, color: '#ea580c', background: '#ffedd5', padding: '0.05rem 0.4rem', borderRadius: '999px' }}>
                                  View Details ↗
                                </span>
                              </div>
                            </div>
                          </div>
                          <strong style={{ fontSize: '0.94rem', color: '#16a34a', flexShrink: 0 }}>
                            {formatCurrency(item.price * (item.qty || 1))}
                          </strong>
                        </div>
                      );
                    })}
                  </div>

                  {/* Bill Details Breakdown */}
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.84rem', borderTop: '1px solid var(--border-light)', paddingTop: '0.9rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Item Subtotal</span>
                      <span>{formatCurrency(order.sub || order.total)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--text-secondary)' }}>
                      <span>Delivery Fee</span>
                      <span>{order.delivery === 0 ? <strong style={{ color: '#16a34a' }}>FREE</strong> : formatCurrency(order.delivery || 0)}</span>
                    </div>
                    {order.discount > 0 && (
                      <div style={{ display: 'flex', justifyContent: 'space-between', color: '#16a34a', fontWeight: 700 }}>
                        <span>Discount ({order.coupon})</span>
                        <span>-{formatCurrency(order.discount)}</span>
                      </div>
                    )}
                    <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: '0.75rem', marginTop: '0.25rem', fontWeight: 900, fontSize: '1.1rem', color: 'var(--text-primary)' }}>
                      <span>Total Payable</span>
                      <span style={{ color: '#ea580c' }}>{formatCurrency(order.total)}</span>
                    </div>
                    <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)', textAlign: 'right' }}>
                      (Cash on Delivery: Delivery par pay karein)
                    </div>
                  </div>
                </div>

                {/* Delivery Address Card */}
                <div
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '20px',
                    border: '1px solid var(--border)',
                    padding: '1.5rem',
                    boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.85rem' }}>
                    <h3 style={{ fontFamily: 'var(--font-display)', fontSize: '1.05rem', fontWeight: 800, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-primary)' }}>
                      <AppIcon name="mapPin" size={17} style={{ color: 'var(--orange)' }} />
                      <span>Delivery Address</span>
                    </h3>
                    <span style={{ fontSize: '0.72rem', fontWeight: 700, padding: '0.15rem 0.5rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '6px', color: 'var(--text-secondary)' }}>
                      Bakani Destination
                    </span>
                  </div>

                  <div style={{ fontSize: '0.86rem', color: 'var(--text-primary)', lineHeight: 1.55 }}>
                    <strong style={{ display: 'block', fontSize: '0.94rem', color: 'var(--text-primary)' }}>
                      {order.address?.name || order.customerName || 'Customer'}
                    </strong>
                    <div style={{ color: 'var(--text-secondary)', marginTop: '0.2rem' }}>
                      {order.address?.area}
                      {order.address?.pincode && ` - ${order.address.pincode}`}
                    </div>
                    <div style={{ marginTop: '0.45rem', color: 'var(--text-muted)', fontSize: '0.82rem', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                      <span>📞</span>
                      <span>+91 {order.address?.phone || order.customerPhone || 'N/A'}</span>
                    </div>
                    {order.address?.note && (
                      <div style={{ marginTop: '0.5rem', padding: '0.45rem 0.65rem', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '8px', fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
                        <strong>Delivery Instructions:</strong> {order.address.note}
                      </div>
                    )}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}

      {/* Customer Feedback Modal for Delivered Order */}
      {showFeedbackModal && order && (
        <FeedbackModal
          order={order}
          onClose={() => setShowFeedbackModal(false)}
          onSubmitSuccess={() => setShowFeedbackModal(false)}
        />
      )}
    </div>
  );
}

export default function TrackPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⏳</div>}>
      <TrackContent />
    </Suspense>
  );
}

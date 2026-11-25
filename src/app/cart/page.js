'use client';
import { useState, useEffect, Fragment } from 'react';
import Link from 'next/link';
import { useCartStore, useUIStore, useAuthStore } from '@/lib/store';
import { calcTotals, formatCurrency, generateOrderId, getCouponOffer, getDeliveryEstimate, isValidPhone, normalizePhone, simpleHash } from '@/lib/utils';
import { deductStock } from '@/lib/orders';
import { SHOP, PAYMENT_METHODS } from '@/lib/config';
import { useRouter } from 'next/navigation';
import AppIcon from '@/components/AppIcon';
import ProductModal from '@/components/ProductModal';
import { getMergedProducts, getProductFallbackImage } from '@/lib/products';

export default function CartPage() {
  const items      = useCartStore(s => s.items);
  const addItem    = useCartStore(s => s.addItem);
  const updateQty  = useCartStore(s => s.updateQty);
  const removeItem = useCartStore(s => s.removeItem);
  const clearCart  = useCartStore(s => s.clearCart);
  const showToast  = useUIStore(s => s.showToast);
  const user       = useAuthStore(s => s.user);
  const router     = useRouter();

  const [mounted, setMounted] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  function openProductDetails(item) {
    if (!item) return;
    try {
      const allProds = getMergedProducts() || [];
      const full = allProds.find(p => 
        (p.id !== undefined && item.id !== undefined && String(p.id) === String(item.id)) || 
        (p.name && item.name && p.name.trim().toLowerCase() === item.name.trim().toLowerCase())
      );
      setSelectedProduct(full ? { ...full, ...item } : {
        ...item,
        id: item.id || Date.now(),
        rating: item.rating || 4.5,
        reviews: item.reviews || 120,
        mrp: item.mrp || item.price,
        desc: item.desc || `${item.name} - 100% genuine product directly from Gupta Store Bakani.`,
        features: item.features || ['Authentic Stationery', 'Best Quality', 'Ready in Bakani Store'],
      });
    } catch {
      setSelectedProduct({
        ...item,
        id: item.id || Date.now(),
        rating: item.rating || 4.5,
        reviews: item.reviews || 120,
        mrp: item.mrp || item.price,
      });
    }
  }

  const [isDirectCheckout, setIsDirectCheckout] = useState(false);
  const [directItem, setDirectItem] = useState(null);

  const [coupon, setCoupon]       = useState('');
  const [applied, setApplied]     = useState('');
  const [couponErr, setCouponErr] = useState('');
  const [couponCodes, setCouponCodes] = useState(SHOP.couponCodes);
  const [payment, setPayment]     = useState('cod');
  const [addr, setAddr]           = useState({ name: '', phone: '', area: '', pincode: '326022', note: '' });
  const [loading, setLoading]     = useState(false);
  const [step, setStep]           = useState(1); // 1=Cart, 2=Address, 3=Payment

  useEffect(() => {
    if (user) {
      setAddr(prev => ({
        ...prev,
        name: prev.name || user.name || user.address?.name || '',
        phone: prev.phone || user.phone || user.address?.phone || '',
        area: prev.area || user.address?.area || user.area || '',
        pincode: prev.pincode || user.address?.pincode || user.pincode || '326022',
        landmark: prev.landmark || user.address?.landmark || user.landmark || '',
      }));
    }
  }, [user]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        const direct = new URLSearchParams(window.location.search).get('direct') === '1';
        setIsDirectCheckout(direct);
      } catch {}
    }
  }, []);

  useEffect(() => {
    if (!isDirectCheckout) {
      setDirectItem(null);
      return;
    }
    try {
      const saved = JSON.parse(sessionStorage.getItem('ggsDirectCheckout') || 'null');
      setDirectItem(saved?.id ? saved : null);
    } catch {
      setDirectItem(null);
    }
  }, [isDirectCheckout]);

  useEffect(() => {
    fetch('/api/coupons')
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.coupons && typeof data.coupons === 'object') setCouponCodes(data.coupons);
      })
      .catch(() => {});
  }, []);

  const rawItems = isDirectCheckout ? (directItem ? [directItem] : []) : (Array.isArray(items) ? items : []);
  const checkoutItems = rawItems
    .filter(Boolean)
    .filter(i => i && (i.id !== undefined || i.name))
    .map(i => ({
      ...i,
      id: i.id ?? (i.name ? simpleHash(i.name) : Date.now()),
      name: i.name || 'Stationery Item',
      price: Math.max(0, Number(i.price) || 0),
      mrp: Math.max(Number(i.price) || 0, Number(i.mrp) || Number(i.price) || 0),
      qty: Math.max(1, Number(i.qty) || 1),
    }));

  const totals = calcTotals(checkoutItems, applied, couponCodes);
  const deliveryEstimate = getDeliveryEstimate();

  const mrpTotal = checkoutItems.reduce((acc, i) => acc + (Number(i?.mrp) || Number(i?.price) || 0) * (i?.qty || 1), 0);
  const mrpSavings = Math.max(0, mrpTotal - totals.sub);
  const totalOrderSavings = mrpSavings + (totals.discount || 0) + (totals.delivery === 0 ? (SHOP.deliveryCharge || 30) : 0);

  const allProds = getMergedProducts() || [];
  const existingIds = new Set(checkoutItems.map(i => String(i?.id)));
  const quickAddItems = allProds
    .filter(p => p && !existingIds.has(String(p?.id)) && Number(p?.price) <= 35)
    .slice(0, 5);

  const freeThreshold = SHOP.freeDeliveryAbove || 100;
  const isFreeDelivery = totals.sub >= freeThreshold;
  const amountNeededForFree = Math.max(0, freeThreshold - totals.sub);
  const freeProgress = Math.min(100, Math.round(((totals.sub || 0) / freeThreshold) * 100));

  function handleUpdateQty(itemId, newQty) {
    if (isDirectCheckout) {
      if (!directItem) return;
      if (newQty <= 0) {
        handleRemoveItem(itemId);
        return;
      }
      const rawStock = Number(directItem.stock);
      const maxStock = !isNaN(rawStock) && rawStock > 0 ? rawStock : 99;
      const targetQty = Math.min(newQty, maxStock);
      const updated = { ...directItem, qty: targetQty };
      setDirectItem(updated);
      try {
        sessionStorage.setItem('ggsDirectCheckout', JSON.stringify(updated));
      } catch {}
      if (newQty > maxStock) {
        showToast(`Stock limit: Maximum ${maxStock} items available.`, 'warning');
      }
    } else {
      if (newQty <= 0) {
        removeItem(itemId);
      } else {
        updateQty(itemId, newQty);
      }
    }
  }

  function handleRemoveItem(itemId) {
    if (isDirectCheckout) {
      setDirectItem(null);
      try {
        sessionStorage.removeItem('ggsDirectCheckout');
      } catch {}
      setIsDirectCheckout(false);
      router.replace('/cart');
      showToast('Buy Now item remove kar diya gaya.', 'info');
    } else {
      removeItem(itemId);
      showToast('Item cart se remove kar diya gaya.', 'info');
    }
  }

  function handleClearCart() {
    if (isDirectCheckout) {
      setDirectItem(null);
      try {
        sessionStorage.removeItem('ggsDirectCheckout');
      } catch {}
      setIsDirectCheckout(false);
      router.replace('/cart');
      showToast('Buy Now item clear kar diya gaya.', 'info');
    } else {
      clearCart();
    }
  }

  function handleApplyCoupon(codeToApply) {
    const code = (codeToApply || coupon).trim().toUpperCase();
    if (!code) return;
    const offer = getCouponOffer(code, couponCodes);
    if (offer.discount > 0 && totals.sub >= offer.minOrder) {
      setApplied(code);
      setCoupon(code);
      setCouponErr('');
      showToast(`🎉 Coupon ${code} applied! ₹${offer.discount} discount mil gaya!`, 'success');
    } else if (offer.discount > 0 && offer.minOrder > totals.sub) {
      setCouponErr(`Is coupon ke liye minimum cart ₹${offer.minOrder} honi chahiye.`);
      showToast(`₹${offer.minOrder - totals.sub} aur shopping karo, phir ${code} apply hoga.`, 'error');
    } else {
      setCouponErr('Invalid coupon code!');
      showToast('Invalid coupon code!', 'error');
    }
  }

  function removeCoupon() {
    setApplied('');
    setCoupon('');
    setCouponErr('');
    showToast('Coupon code remove kar diya gaya.', 'info');
  }

  function validateAddr() {
    const cleanPhone = normalizePhone(addr.phone);
    if (!addr.name.trim()) {
      showToast('Kripya apna Full Name daalein!', 'error');
      return false;
    }
    if (!isValidPhone(cleanPhone)) {
      showToast('Kripya valid 10-digit mobile number daalein!', 'error');
      return false;
    }
    if (!addr.area.trim()) {
      showToast('Kripya apna complete delivery address daalein!', 'error');
      return false;
    }
    return true;
  }

  function handleProceed(targetStep) {
    if (!user || !user?.email) {
      localStorage.setItem('ggsLoginRedirect', isDirectCheckout ? '/cart?direct=1' : '/cart');
      showToast('Order karne ke liye pehle apna Account Register / Login karein!', 'warning');
      router.push('/auth');
      return;
    }
    if (targetStep === 3 && !validateAddr()) {
      return;
    }
    setStep(targetStep);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function placeOrder() {
    if (loading) return; // Prevent double-tap submission
    if (!user || !user?.email) {
      localStorage.setItem('ggsLoginRedirect', isDirectCheckout ? '/cart?direct=1' : '/cart');
      showToast('Order karne ke liye pehle email se Register / Login karein!', 'warning');
      router.push('/auth');
      return;
    }
    if (!validateAddr()) return;

    setLoading(true);
    try {
      const cleanPhone = normalizePhone(addr.phone || user?.phone || '');

      const orderPayload = {
        orderId: generateOrderId(),
        items: checkoutItems,
        address: { ...addr, phone: cleanPhone },
        customerEmail: user.email,
        customerName: user.name || addr.name,
        payment: 'cod',
        paymentStatus: 'pending',
        coupon: applied,
        expectedDelivery: deliveryEstimate,
        ...totals,
      };

      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(orderPayload),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Order place nahi ho saka.');

      // Safely deduct local stock cache
      deductStock(checkoutItems);

      // Clear cart ONLY after verified database order creation
      if (isDirectCheckout) sessionStorage.removeItem('ggsDirectCheckout');
      else clearCart();

      // Dispatch real-time event to refresh notifications and orders
      if (typeof window !== 'undefined') {
        try {
          const finalId = data.order?.orderId || orderPayload.orderId;
          const savedOrders = JSON.parse(localStorage.getItem('ggs_saved_orders') || '[]');
          if (finalId && !savedOrders.includes(finalId)) {
            savedOrders.unshift(finalId);
            localStorage.setItem('ggs_saved_orders', JSON.stringify(savedOrders.slice(0, 25)));
          }
          if (cleanPhone) {
            localStorage.setItem('ggs_last_phone', cleanPhone);
          }
        } catch {}
        window.dispatchEvent(new CustomEvent('ggsOrderPlaced', { detail: data.order || orderPayload }));
      }

      showToast('✅ Order successfully place ho gaya! Cash on Delivery confirmed.', 'success');
      router.push(`/thankyou?orderId=${data.order?.orderId || orderPayload.orderId}`);
    } catch (e) {
      showToast(e.message || 'Order place nahi ho saka. Dobara try karo.', 'error');
    } finally {
      setLoading(false);
    }
  }

  // Mounting hydration safety
  if (!mounted) {
    return (
      <div className="cart-page-wrapper" style={{ minHeight: '65vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', color: 'var(--text-muted)' }}>
          <div style={{ width: 38, height: 38, borderRadius: '50%', border: '3px solid var(--border)', borderTopColor: 'var(--orange)', animation: 'spin 0.8s linear infinite', margin: '0 auto 1rem' }} />
          <p style={{ fontSize: '0.88rem', fontWeight: 700, color: 'var(--text-primary)', margin: 0 }}>Cart Load Ho Raha Hai...</p>
        </div>
      </div>
    );
  }

  // Empty cart view
  if (checkoutItems.length === 0) {
    return (
      <div className="cart-page-wrapper">
        <div className="cart-mobile-top-bar">
          <button
            type="button"
            onClick={() => router.push('/')}
            className="cart-mobile-back-icon-btn"
            aria-label="Go Back to Shop"
          >
            <AppIcon name="arrowLeft" size={20} />
          </button>
          <div className="cart-mobile-top-title-wrap">
            <h1 className="cart-mobile-top-title">Shopping Cart</h1>
            <span className="cart-mobile-top-sub">0 items</span>
          </div>
          <Link href="/" className="cart-mobile-top-badge" style={{ textDecoration: 'none' }}>
            <AppIcon name="shop" size={14} />
            <span>Shop</span>
          </Link>
        </div>
        <div className="breadcrumb cart-breadcrumb-container cart-desktop-only">
          <Link href="/">Home</Link>
          <span className="sep">/</span>
          <span className="current">Shopping Cart</span>
        </div>
        <div className="cart-empty-container">
          <div className="cart-empty-box">
            <div className="cart-empty-icon-wrap">
              <AppIcon name="cart" size={52} strokeWidth={1.5} />
            </div>
            <h2 className="cart-empty-title">Aapka Cart Khali Hai</h2>
            <p className="cart-empty-desc">
              Lagta hai abhi tak aapne cart me koi stationery product add nahi kiya hai. School supplies aur notebooks explore karein!
            </p>
            <Link href="/" className="btn btn-orange cart-empty-btn">
              <AppIcon name="shop" size={18} />
              Abhi Shopping Start Karein
            </Link>
          </div>
        </div>
      </div>
    );
  }

  const stepsList = [
    { id: 1, label: 'Items', desc: `${checkoutItems.length} ${checkoutItems.length === 1 ? 'item' : 'items'}`, icon: <AppIcon name="cart" size={14} /> },
    { id: 2, label: 'Address', desc: 'Doorstep in Bakani', icon: <AppIcon name="mapPin" size={14} /> },
    { id: 3, label: 'Payment', desc: 'Cash on Delivery', icon: <AppIcon name="shield" size={14} /> },
  ];

  const availableCouponKeys = Object.keys(couponCodes || {}).slice(0, 4);

  return (
    <div className="cart-page-wrapper">
      <div className="breadcrumb cart-breadcrumb-container cart-desktop-only">
        <Link href="/">Home</Link>
        <span className="sep">/</span>
        <span className="current">Shopping Cart</span>
      </div>

      <div className="cart-page">
        {/* Left Column: Flow */}
        <div className="cart-main-col">
          {/* Unauthenticated User Banner */}
          {(!user || !user?.email) && (
            <div className="cart-auth-alert">
              <div className="cart-auth-alert-left">
                <div className="cart-auth-icon-badge">
                  <AppIcon name="key" size={20} />
                </div>
                <div>
                  <div className="cart-auth-title">Checkout se pehle Login / Register karein</div>
                  <div className="cart-auth-desc">
                    Order confirmation receipt, live SMS updates aur tracking ke liye account zaroori hai.
                  </div>
                </div>
              </div>
              <button
                onClick={() => {
                  localStorage.setItem('ggsLoginRedirect', isDirectCheckout ? '/cart?direct=1' : '/cart');
                  router.push('/auth');
                }}
                className="btn btn-orange btn-sm cart-auth-btn"
              >
                Login / Register karein →
              </button>
            </div>
          )}

          {/* Stepper Bar */}
          <div className="cart-stepper-card">
            <div className="cart-stepper">
              {stepsList.map((s, idx) => {
                const isCompleted = step > s.id;
                const isActive = step === s.id;
                const canNavigate = step > s.id;
                return (
                  <Fragment key={s.id}>
                    <div
                      className={`cart-step-item ${isActive ? 'active' : ''} ${isCompleted ? 'completed' : ''} ${canNavigate ? 'clickable' : ''}`}
                      onClick={() => {
                        if (canNavigate) {
                          setStep(s.id);
                        } else if (s.id > 1 && (!user || !user?.email)) {
                          localStorage.setItem('ggsLoginRedirect', isDirectCheckout ? '/cart?direct=1' : '/cart');
                          showToast('Order karne ke pehle Register / Login karein!', 'warning');
                          router.push('/auth');
                        }
                      }}
                    >
                      <div className="cart-step-circle">
                        {isCompleted ? <AppIcon name="check" size={14} strokeWidth={2.8} /> : s.icon}
                      </div>
                      <div className="cart-step-text">
                        <span className="cart-step-label">{s.label}</span>
                      </div>
                    </div>
                    {idx < stepsList.length - 1 && (
                      <div className={`cart-step-connector ${step > idx + 1 ? 'filled' : ''}`} />
                    )}
                  </Fragment>
                );
              })}
            </div>
          </div>

          {/* STEP 1: CART ITEMS */}
          {step === 1 && (
            <>
            <div className="sec-card cart-modern-card">
              <div className="sec-head cart-card-header">
                <div className="sec-title cart-card-title">
                  <div className="cart-title-icon">
                    <AppIcon name={isDirectCheckout ? 'zap' : 'cart'} size={18} />
                  </div>
                  <span>{isDirectCheckout ? 'Buy Now Item' : `Your Items (${checkoutItems.length})`}</span>
                </div>
                {checkoutItems.length > 0 && (
                  <button
                    className="cart-clear-btn"
                    onClick={handleClearCart}
                    title={isDirectCheckout ? 'Buy Now item remove karein' : 'Cart saaf karein'}
                  >
                    <AppIcon name="trash" size={13} />
                    <span>{isDirectCheckout ? 'Remove' : 'Clear'}</span>
                  </button>
                )}
              </div>

              <div className="sec-body cart-card-body">
                {/* Free Delivery Bar inside cart */}
                <div className={`cart-free-shipping-card ${isFreeDelivery ? 'unlocked' : ''}`}>
                  <div className="cart-fs-info">
                    <div className="cart-fs-icon-wrap">
                      <AppIcon name={isFreeDelivery ? 'check' : 'truck'} size={18} />
                    </div>
                    <div>
                      <div className="cart-fs-title">
                        {isFreeDelivery ? (
                          <span>🎉 <strong>FREE Delivery Unlocked!</strong> Delivery charge ₹0 ho gaya hai.</span>
                        ) : (
                          <span>🚚 Cart me <strong>₹{amountNeededForFree}</strong> aur add karo — <strong>FREE Delivery</strong> paayein!</span>
                        )}
                      </div>
                      <div className="cart-fs-sub">
                        {isFreeDelivery
                          ? 'Aapka order ₹100 se upar hai, isliye Bakani me free delivery milegi.'
                          : `₹${freeThreshold} ki shopping par delivery bilkul FREE hai (abhi: ${formatCurrency(totals.sub)})`}
                      </div>
                    </div>
                  </div>
                  <div className="cart-fs-bar-track">
                    <div className="cart-fs-bar-fill" style={{ width: `${freeProgress}%` }} />
                  </div>
                </div>

                {/* Items List */}
                <div className="cart-items-stack">
                  {checkoutItems.map((item, idx) => (
                    <div key={`${item.id}_${idx}`} className="cart-item-row">
                      <div
                        className="cart-item-left"
                        onClick={(e) => {
                          e.stopPropagation();
                          openProductDetails(item);
                        }}
                        style={{ cursor: 'pointer' }}
                        title={`Click to view ${item.name} details`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                          src={item.image || getProductFallbackImage(item.name, item.category)}
                          alt={item.name}
                          referrerPolicy="no-referrer"
                          className="cart-item-thumb"
                          onError={e => {
                            e.target.onerror = null;
                            e.target.src = getProductFallbackImage(item.name, item.category);
                          }}
                        />
                        <div className="cart-item-details">
                          <h4 className="cart-item-title">{item.name}</h4>
                          <div className="cart-item-unit-row">
                            <span className="cart-item-unit-price">₹{item.price} each</span>
                            <span className="cart-stock-pill">
                              <span className="stock-dot" /> In Stock
                            </span>
                            <span className="cart-open-hint">
                              View details ↗
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="cart-item-right">
                        <div className="cart-item-counter-wrap">
                          <div className="cart-pill-counter">
                            <button
                              className="cart-pill-btn"
                              onClick={() => {
                                if (item.qty <= 1) {
                                  handleRemoveItem(item.id);
                                } else {
                                  handleUpdateQty(item.id, item.qty - 1);
                                }
                              }}
                              title={item.qty <= 1 ? 'Remove item' : 'Decrease quantity'}
                              aria-label="Decrease quantity"
                            >
                              -
                            </button>
                            <span className="cart-pill-qty">{item.qty}</span>
                            <button
                              className="cart-pill-btn"
                              onClick={() => handleUpdateQty(item.id, item.qty + 1)}
                              title="Increase quantity"
                              aria-label="Increase quantity"
                            >
                              +
                            </button>
                          </div>
                        </div>

                        <div className="cart-item-line-total">
                          {formatCurrency(item.price * item.qty)}
                        </div>

                        <button
                          onClick={() => handleRemoveItem(item.id)}
                          className="cart-item-delete-btn"
                          title="Item delete karein"
                          aria-label="Remove item"
                        >
                          <AppIcon name="trash" size={16} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Trust guarantee inside card */}
                <div className="cart-guarantee-strip">
                  <div className="cart-guarantee-item">
                    <AppIcon name="shield" size={15} />
                    <span>100% Genuine Stationery Directly from Bakani Store</span>
                  </div>
                  <div className="cart-guarantee-item">
                    <AppIcon name="truck" size={15} />
                    <span>Safe & Carefully Packed Items</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Quick Add Impulse Essentials (App-style Cart Rail) */}
            {quickAddItems.length > 0 && (
              <div className="cart-quick-add-wrap">
                <div className="cart-quick-add-head">
                  <div className="cart-quick-add-title-box">
                    <span className="cart-quick-add-icon">⚡</span>
                    <div>
                      <h4 className="cart-quick-add-title">Frequently Added Stationery</h4>
                      <span className="cart-quick-add-sub">Popular low-cost essentials in Bakani</span>
                    </div>
                  </div>
                  <span className="cart-quick-add-count-pill">{quickAddItems.length} items</span>
                </div>
                <div className="cart-quick-add-scroll">
                  {quickAddItems.map(p => (
                    <div key={p.id} className="cart-quick-add-card">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={p.image || getProductFallbackImage(p.name, p.category)}
                        alt={p.name}
                        className="cart-quick-add-img"
                        onError={e => {
                          e.target.onerror = null;
                          e.target.src = getProductFallbackImage(p.name, p.category);
                        }}
                      />
                      <div className="cart-quick-add-body">
                        <span className="cart-quick-add-pname">{p.name}</span>
                        <div className="cart-quick-add-price-row">
                          <span className="cart-quick-add-price">₹{p.price}</span>
                          {p.mrp > p.price && <del className="cart-quick-add-mrp">₹{p.mrp}</del>}
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          addItem(p, 1);
                          showToast(`✅ ${p.name} added to cart!`, 'success');
                        }}
                        className="cart-quick-add-btn"
                        title={`Add ${p.name}`}
                      >
                        + ADD
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </>
          )}

          {/* STEP 2: DELIVERY ADDRESS */}
          {step === 2 && (
            <div className="sec-card cart-modern-card">
              <div className="sec-head cart-card-header">
                <div className="sec-title cart-card-title">
                  <div className="cart-title-icon">
                    <AppIcon name="mapPin" size={18} />
                  </div>
                  <span>Delivery Address</span>
                </div>
                <span className="cart-step-badge">Bakani Area Verified</span>
              </div>

              <div className="sec-body cart-card-body">
                <p className="cart-form-intro">
                  Kripya apna address bharein jahan aapko delivery chahiye. Hamara delivery person isi address par order layega.
                </p>

                <div className="form-row cart-form-row">
                  <div className="form-group">
                    <label className="form-label cart-field-label">
                      <AppIcon name="user" size={14} /> Full Name *
                    </label>
                    <input
                      className="form-input cart-field-input"
                      placeholder="e.g. Rahul Gupta"
                      value={addr.name}
                      onChange={e => setAddr(a => ({ ...a, name: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label cart-field-label">
                      <AppIcon name="phone" size={14} /> 10-Digit Mobile Number *
                    </label>
                    <input
                      className="form-input cart-field-input"
                      type="tel"
                      inputMode="tel"
                      maxLength={10}
                      placeholder="e.g. 98290XXXXX"
                      value={addr.phone}
                      onChange={e => setAddr(a => ({ ...a, phone: e.target.value.replace(/\D/g, '').slice(0, 10) }))}
                    />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label cart-field-label">
                    <AppIcon name="mapPin" size={14} /> Delivery Address / Mohalla / Landmark *
                  </label>
                  <input
                    className="form-input cart-field-input"
                    placeholder="Ghar ka number, mohalla, landmark ya dukan ka address (Bakani)"
                    value={addr.area}
                    onChange={e => setAddr(a => ({ ...a, area: e.target.value }))}
                  />
                </div>

                <div className="form-row cart-form-row">
                  <div className="form-group">
                    <label className="form-label cart-field-label">Pincode</label>
                    <input
                      className="form-input cart-field-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="323802"
                      value={addr.pincode}
                      onChange={e => setAddr(a => ({ ...a, pincode: e.target.value.replace(/\D/g, '').slice(0, 6) }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label cart-field-label">Delivery Note (Optional)</label>
                    <input
                      className="form-input cart-field-input"
                      placeholder="e.g. Near Bus Stand / School ke samne"
                      value={addr.note}
                      onChange={e => setAddr(a => ({ ...a, note: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="cart-address-footer-box">
                  <AppIcon name="info" size={16} />
                  <span>
                    Bakani town aur paas ke areas me same-day ya next-day fast doorstep delivery ki jaati hai.
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* STEP 3: PAYMENT METHOD */}
          {step === 3 && (
            <div className="sec-card cart-modern-card">
              <div className="sec-head cart-card-header">
                <div className="sec-title cart-card-title">
                  <div className="cart-title-icon">
                    <AppIcon name="shield" size={18} />
                  </div>
                  <span>Select Payment Method</span>
                </div>
                <span className="cart-step-badge">100% Safe</span>
              </div>

              <div className="sec-body cart-card-body">
                <div className="payment-methods cart-pay-list">
                  {PAYMENT_METHODS.map(pm => {
                    const isCod = pm.id === 'cod';
                    const isSelected = payment === pm.id;
                    return (
                      <div
                        key={pm.id}
                        className={`cart-pay-card ${isSelected ? 'active' : ''} ${!isCod ? 'disabled' : ''}`}
                        onClick={() => isCod && setPayment('cod')}
                      >
                        <div className="cart-pay-radio">
                          <input
                            type="radio"
                            name="payment_choice"
                            checked={isSelected}
                            disabled={!isCod}
                            onChange={() => isCod && setPayment('cod')}
                          />
                        </div>
                        <div className="cart-pay-icon-box">
                          {pm.id === 'cod' ? (
                            <AppIcon name="cod" size={24} />
                          ) : (
                            <AppIcon name="card" size={24} />
                          )}
                        </div>
                        <div className="cart-pay-details">
                          <div className="cart-pay-head-row">
                            <span className="cart-pay-name">{pm.label}</span>
                            {isCod ? (
                              <span className="cart-badge-recommended">Available & Recommended</span>
                            ) : (
                              <span className="cart-badge-coming-soon">Coming Soon</span>
                            )}
                          </div>
                          <p className="cart-pay-explanation">
                            {isCod
                              ? 'Delivery ke waqt cash dein ya delivery partner ke QR par PhonePe/GPay se scan karke pay karein.'
                              : 'Online payment gateway jald hi live hoga. Tab tak COD use karein.'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="cart-cod-guarantee">
                  <div className="cart-cod-icon">
                    <AppIcon name="shield" size={20} />
                  </div>
                  <div>
                    <h5 className="cart-cod-title">Cash on Delivery Guaranteed</h5>
                    <p className="cart-cod-text">
                      Pehle apne stationery items check karein, uske baad delivery person ko payment karein. Zero risk!
                    </p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Stepper Navigation Buttons */}
          <div className="cart-nav-buttons-row">
            {step > 1 && (
              <button
                type="button"
                className="btn btn-ghost cart-back-btn"
                onClick={() => setStep(step - 1)}
              >
                <AppIcon name="arrowLeft" size={16} />
                <span>{step === 2 ? 'Cart par wapas jayein' : 'Address par wapas jayein'}</span>
              </button>
            )}

            {step < 3 ? (
              <button
                type="button"
                className="btn btn-orange cart-continue-btn"
                onClick={() => handleProceed(step + 1)}
              >
                {!user || !user?.email ? (
                  <>
                    <AppIcon name="key" size={17} />
                    <span>Register / Login to Continue</span>
                  </>
                ) : step === 1 ? (
                  <>
                    <span>Proceed to Delivery Address</span>
                    <AppIcon name="arrowRight" size={17} />
                  </>
                ) : (
                  <>
                    <span>Proceed to Payment</span>
                    <AppIcon name="arrowRight" size={17} />
                  </>
                )}
              </button>
            ) : (
              <button
                type="button"
                className="btn btn-orange cart-place-order-btn"
                onClick={placeOrder}
                disabled={loading}
              >
                {loading ? (
                  <span>⏳ Order Place Ho Raha Hai...</span>
                ) : (
                  <>
                    <AppIcon name="check" size={18} strokeWidth={2.5} />
                    <span>Confirm & Place Order ({formatCurrency(totals.total)})</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Right Column: Order Summary Sidebar */}
        <div className="cart-sidebar-col">
          <div id="cart-bill-summary-card" className="sec-card cart-modern-card cart-summary-card">
            <div className="sec-head cart-card-header">
              <div className="sec-title cart-card-title">
                <div className="cart-title-icon">
                  <AppIcon name="clipboard" size={17} />
                </div>
                <span>Bill Summary</span>
              </div>
              <span className="cart-summary-items-pill">
                {checkoutItems.reduce((acc, i) => acc + i.qty, 0)} items
              </span>
            </div>

            <div className="sec-body cart-card-body">
              {/* Delivery Estimation Pill Box */}
              <div className="cart-delivery-eta-card">
                <div className="cart-eta-top">
                  <div className="cart-eta-icon">
                    <AppIcon name="truck" size={16} />
                  </div>
                  <div>
                    <span className="cart-eta-label">Expected Delivery</span>
                    <strong className="cart-eta-date">{deliveryEstimate.dateLabel}</strong>
                  </div>
                </div>
                <div className="cart-eta-bottom">
                  <span>{deliveryEstimate.weekday} • {deliveryEstimate.promise}</span>
                  <small>Fast delivery in Bakani. Real-time updates delivered.</small>
                </div>
              </div>

              {/* Free delivery small meter */}
              {!isFreeDelivery && (
                <div className="cart-sidebar-fs-alert">
                  <div className="cart-sfs-text">
                    <span>Add <strong>₹{amountNeededForFree}</strong> more for <strong>FREE Delivery</strong></span>
                    <span className="cart-sfs-badge">Save ₹{SHOP.deliveryCharge}</span>
                  </div>
                  <div className="cart-fs-bar-track small">
                    <div className="cart-fs-bar-fill" style={{ width: `${freeProgress}%` }} />
                  </div>
                </div>
              )}

              {/* Coupon Box */}
              <div className="cart-coupon-section">
                <label className="cart-coupon-label">Apply Discount Coupon</label>
                {!applied ? (
                  <>
                    <div className="cart-coupon-input-group">
                      <input
                        className="form-input cart-coupon-input"
                        placeholder="e.g. SAVE10 / WELCOME"
                        value={coupon}
                        onChange={e => setCoupon(e.target.value)}
                        onKeyDown={e => e.key === 'Enter' && handleApplyCoupon()}
                      />
                      <button
                        type="button"
                        className="btn btn-orange btn-sm cart-coupon-apply-btn"
                        onClick={() => handleApplyCoupon()}
                      >
                        Apply
                      </button>
                    </div>

                    {/* Quick 1-click coupon chips */}
                    {availableCouponKeys.length > 0 && (
                      <div className="cart-coupon-chips">
                        {availableCouponKeys.map(c => (
                          <button
                            key={c}
                            type="button"
                            className="cart-coupon-chip"
                            onClick={() => handleApplyCoupon(c)}
                          >
                            <AppIcon name="tag" size={11} /> {c}
                          </button>
                        ))}
                      </div>
                    )}
                  </>
                ) : (
                  <div className="cart-applied-badge">
                    <div className="cart-applied-left">
                      <div className="cart-applied-icon">
                        <AppIcon name="check" size={14} />
                      </div>
                      <div>
                        <strong>{applied}</strong>
                        <span>-₹{totals.discount} OFF saved!</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={removeCoupon}
                      className="cart-applied-remove"
                      title="Remove coupon"
                    >
                      Remove
                    </button>
                  </div>
                )}
                {couponErr && <p className="cart-coupon-err">{couponErr}</p>}
              </div>

              {/* Pricing breakdown table */}
              <div className="cart-bill-details">
                {mrpSavings > 0 && (
                  <div className="cart-bill-row">
                    <span className="cart-bill-label">MRP Total</span>
                    <span className="cart-bill-val strike-text" style={{ textDecoration: 'line-through', opacity: 0.7 }}>
                      {formatCurrency(mrpTotal)}
                    </span>
                  </div>
                )}

                <div className="cart-bill-row">
                  <span className="cart-bill-label">
                    Item Total ({checkoutItems.reduce((acc, i) => acc + i.qty, 0)} items)
                  </span>
                  <span className="cart-bill-val">{formatCurrency(totals.sub)}</span>
                </div>

                {mrpSavings > 0 && (
                  <div className="cart-bill-row">
                    <span className="cart-bill-label">Product Savings</span>
                    <span className="cart-bill-val green-text">-{formatCurrency(mrpSavings)}</span>
                  </div>
                )}

                <div className="cart-bill-row">
                  <span className="cart-bill-label">Delivery Fee</span>
                  <span className="cart-bill-val">
                    {totals.delivery === 0 ? (
                      <span className="cart-free-tag">FREE (Saved ₹{SHOP.deliveryCharge})</span>
                    ) : (
                      <span>{formatCurrency(totals.delivery)}</span>
                    )}
                  </span>
                </div>

                {totals.discount > 0 && (
                  <div className="cart-bill-row cart-bill-discount-row">
                    <span className="cart-bill-label">Coupon Discount ({applied})</span>
                    <span className="cart-bill-val green-text">-{formatCurrency(totals.discount)}</span>
                  </div>
                )}

                <div className="cart-bill-divider" />

                <div className="cart-bill-total-row">
                  <div>
                    <span className="cart-total-title">Total Amount</span>
                    <span className="cart-total-subtext">Inclusive of all taxes</span>
                  </div>
                  <span className="cart-total-price">{formatCurrency(totals.total)}</span>
                </div>

                {totalOrderSavings > 0 && (
                  <div className="cart-savings-highlight-banner">
                    <span className="cart-savings-emoji">🎉</span>
                    <span>Aap is order par <strong>₹{totalOrderSavings}</strong> bacha rahe hain!</span>
                  </div>
                )}
              </div>

              {/* Trust Badges */}
              <div className="cart-trust-badges">
                <div className="cart-trust-item">
                  <AppIcon name="truck" size={15} />
                  <span>Doorstep delivery in Bakani</span>
                </div>
                <div className="cart-trust-item">
                  <AppIcon name="cod" size={15} />
                  <span>Cash on Delivery accepted</span>
                </div>
                <div className="cart-trust-item">
                  <AppIcon name="shield" size={15} />
                  <span>100% Genuine stationery guaranteed</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Sticky Bar */}
      <div className="cart-mobile-sticky-bar">
        <div
          className="cart-sticky-info"
          onClick={() => {
            const billEl = document.getElementById('cart-bill-summary-card');
            if (billEl) billEl.scrollIntoView({ behavior: 'smooth' });
          }}
          style={{ cursor: 'pointer' }}
          title="Click to view bill breakdown"
        >
          <div className="cart-sticky-total-row">
            <span className="cart-sticky-total">{formatCurrency(totals.total)}</span>
            <span className="cart-sticky-view-bill">View Bill ∧</span>
          </div>
          <span className="cart-sticky-items">
            {checkoutItems.reduce((acc, i) => acc + i.qty, 0)} items {totals.delivery === 0 ? '• Free Delivery' : `• +₹${totals.delivery} Delivery`}
          </span>
        </div>
        <button
          className="cart-sticky-btn"
          onClick={step === 3 ? placeOrder : () => handleProceed(step + 1)}
          disabled={loading}
        >
          {loading ? (
            'Placing Order...'
          ) : !user || !user?.email ? (
            '🔐 Login to Order →'
          ) : step === 1 ? (
            <>
              <span>Address Details</span>
              <AppIcon name="arrowRight" size={15} />
            </>
          ) : step === 2 ? (
            <>
              <span>Payment Method</span>
              <AppIcon name="arrowRight" size={15} />
            </>
          ) : (
            <>
              <AppIcon name="check" size={15} strokeWidth={2.5} />
              <span>Place Order (COD)</span>
            </>
          )}
        </button>
      </div>
          {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={() => setSelectedProduct(null)}
        />
      )}
    </div>
  );
}
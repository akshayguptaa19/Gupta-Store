'use client';
import { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { useCartStore, useWishlistStore, useUIStore, useRecentStore, useAuthStore } from '@/lib/store';
import { discountPct, formatCurrency, getDeliveryEstimate, startDirectCheckout } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';

const DEFAULT_FALLBACK_REVIEWS = [
  { name: 'Rahul Sharma', rating: 5, comment: 'Bahut acha stationery product! Quality top-notch hai.', date: 'Bakani Store' },
  { name: 'Priya Meena', rating: 4, comment: 'Good value for money. Delivery fast thi.', date: 'Bakani Store' },
  { name: 'Amit Kumar', rating: 5, comment: 'Recommend karta hoon. Bilkul waise hi mila jaise photo mein tha.', date: 'Bakani Store' },
];

export default function ProductModal({ product, onClose }) {
  const router    = useRouter();
  const addItem   = useCartStore(s => s.addItem);
  const toggle    = useWishlistStore(s => s.toggle);
  const isWished  = useWishlistStore(s => s.isWished);
  const showToast = useUIStore(s => s.showToast);
  const addRecent = useRecentStore(s => s.add);
  const user      = useAuthStore(s => s.user);

  const [qty, setQty]         = useState(1);
  const [added, setAdded]     = useState(false);
  const [showRevs, setShowRevs] = useState(true);
  const [reviewsList, setReviewsList] = useState([]);
  const [loadingRevs, setLoadingRevs] = useState(false);
  const [writeRevOpen, setWriteRevOpen] = useState(false);
  const [newRevRating, setNewRevRating] = useState(5);
  const [newRevComment, setNewRevComment] = useState('');
  const [newRevName, setNewRevName] = useState(user?.name || '');
  const [submittingRev, setSubmittingRev] = useState(false);
  const [deliveredOrder, setDeliveredOrder] = useState(null);
  const [checkingDelivered, setCheckingDelivered] = useState(false);

  const wished = product?.id ? isWished(product.id) : false;
  const productPrice = Number(product?.price) || 0;
  const productMrp = Number(product?.mrp) || productPrice;
  const disc   = discountPct(productPrice, productMrp);
  const maxQty = Number(product?.stock) > 0 ? Number(product.stock) : 99;
  const deliveryEstimate = getDeliveryEstimate();

  // Fetch real reviews for this product
  useEffect(() => {
    if (!product) return;
    setLoadingRevs(true);
    const pId = product.id !== undefined ? String(product.id) : '';
    const pName = product.name ? encodeURIComponent(product.name) : '';
    fetch(`/api/reviews?productId=${pId}&productName=${pName}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.reviews)) {
          setReviewsList(data.reviews);
        }
      })
      .catch(() => {})
      .finally(() => setLoadingRevs(false));

    function handleReviewAdded(e) {
      if (!e?.detail) return;
      const r = e.detail;
      if (String(r.productId) === String(product.id) || (r.productName && r.productName.toLowerCase() === product.name?.toLowerCase())) {
        setReviewsList(prev => [r, ...prev]);
      }
    }

    window.addEventListener('ggsReviewAdded', handleReviewAdded);
    return () => window.removeEventListener('ggsReviewAdded', handleReviewAdded);
  }, [product]);

  // Reset review write state whenever product changes
  useEffect(() => {
    setWriteRevOpen(false);
    setNewRevComment('');
    setDeliveredOrder(null);
  }, [product?.id]);

  // Check if current user has a delivered order for this specific product
  useEffect(() => {
    if (!user || (!user.phone && !user.email) || !product) {
      setDeliveredOrder(null);
      setCheckingDelivered(false);
      return;
    }
    setCheckingDelivered(true);
    const params = new URLSearchParams();
    if (user.phone) params.set('phone', user.phone);
    if (user.email) params.set('email', user.email);

    fetch(`/api/orders?${params.toString()}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => {
        if (data.ok && Array.isArray(data.orders)) {
          const match = data.orders.find(ord => {
            if (ord.status !== 'delivered') return false;
            return (ord.items || []).some(it =>
              (product.id !== undefined && it.id !== undefined && String(it.id) === String(product.id)) ||
              (product.name && it.name && it.name.trim().toLowerCase() === product.name.trim().toLowerCase())
            );
          });
          setDeliveredOrder(match || null);
        } else {
          setDeliveredOrder(null);
        }
      })
      .catch(() => {
        setDeliveredOrder(null);
      })
      .finally(() => setCheckingDelivered(false));
  }, [user, product?.id, product?.name]);

  const hasAlreadyReviewed = Boolean(
    deliveredOrder && (reviewsList || []).some(r =>
      (r.orderId && r.orderId === deliveredOrder.orderId) ||
      (user?.email && r.customerEmail && r.customerEmail.toLowerCase() === user.email.toLowerCase()) ||
      (user?.phone && r.customerPhone && r.customerPhone.slice(-10) === user.phone.slice(-10))
    )
  );

  async function handleInlineReviewSubmit(e) {
    if (e) e.preventDefault();
    if (!deliveredOrder || deliveredOrder.status !== 'delivered') {
      showToast('Strict Access: Review sirf wahi likh sakte hain jinka ye order DELIVERED ho chuka ho.', 'error');
      return;
    }
    if (hasAlreadyReviewed) {
      showToast('Aap is delivered product ke liye pehle hi review submit kar chuke hain.', 'info');
      return;
    }
    if (!newRevComment.trim()) {
      showToast('Kripya apna review comment likhein.', 'warning');
      return;
    }
    setSubmittingRev(true);
    try {
      const verifiedCustomerName = deliveredOrder.address?.name || deliveredOrder.customerName || user?.name || 'Verified Buyer';
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: product.id || '1',
          productName: product.name,
          rating: newRevRating,
          comment: newRevComment.trim(),
          customerName: verifiedCustomerName,
          orderId: deliveredOrder.orderId,
          customerPhone: user?.phone || deliveredOrder.address?.phone,
          customerEmail: user?.email || deliveredOrder.customerEmail,
        }),
      });
      const data = await res.json();
      if (!res.ok || !data.ok) throw new Error(data.message || 'Review submit nahi ho saka.');
      showToast('🎉 Aapka verified review successfully jud gaya!', 'success');
      setReviewsList(prev => [data.review, ...prev]);
      setNewRevComment('');
      setWriteRevOpen(false);
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      setSubmittingRev(false);
    }
  }

  const allDisplayReviews = reviewsList.length > 0 ? reviewsList : DEFAULT_FALLBACK_REVIEWS;
  const totalReviewsCount = reviewsList.length > 0 ? reviewsList.length : (product?.reviews || 120);
  const avgRatingNum = reviewsList.length > 0
    ? (reviewsList.reduce((acc, r) => acc + (Number(r.rating) || 5), 0) / reviewsList.length).toFixed(1)
    : (product?.rating || 4.5);

  useEffect(() => {
    if (product?.id) addRecent(product.id);
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = ''; };
  }, [product?.id, addRecent]);

  // Close on Escape
  useEffect(() => {
    const handler = e => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  function handleAddToCart() {
    if (product.stock === 0) return;
    addItem(product, qty);
    showToast(`${product.name} cart mein add ho gaya! 🛒`, 'success');
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  function handleBuyNow() {
    if (product.stock === 0) return;
    startDirectCheckout(product, qty, router);
  }

  function handleWish() {
    const added = toggle(product);
    showToast(added ? `${product.name} wishlist mein add hua ❤️` : `Wishlist se remove ho gaya`, added ? 'success' : 'info');
  }

  const ratingVal = Number(avgRatingNum) > 0 ? Number(avgRatingNum) : (Number(product?.rating) > 0 ? Number(product.rating) : 4.5);
  const stars = '★'.repeat(Math.floor(ratingVal)) + (ratingVal % 1 >= 0.5 ? '½' : '') + '☆'.repeat(Math.max(0, 5 - Math.ceil(ratingVal)));

  if (!product) return null;

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-box">
        <button className="modal-close" onClick={onClose} aria-label="Close">✕</button>
        <button
          onClick={handleWish}
          style={{position:'absolute',top:'1rem',left:'1rem',zIndex:10,width:36,height:36,borderRadius:'50%',
            background: wished ? '#fff0f0':'rgba(255,255,255,0.9)',border:'none',cursor:'pointer',fontSize:'1.1rem',
            display:'flex',alignItems:'center',justifyContent:'center',boxShadow:'var(--shadow-sm)',transition:'var(--spring)'}}
        ><AppIcon name="heart" size={18} fill={wished ? 'currentColor' : 'none'} /></button>

        {/* Left - Image */}
        <div className="modal-left">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={product.image} alt={product.name} className="modal-img"
            loading="eager"
            decoding="async"
            onError={e => e.target.src = 'https://placehold.co/200x200/f1f5f9/94a3b8?text=IMG'}
          />
          <div style={{display:'flex',gap:'0.4rem',flexWrap:'wrap',justifyContent:'center',marginTop:'0.8rem'}}>
            {product.badge && (
              <span style={{background:'linear-gradient(135deg,var(--orange),var(--orange-dark))',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'0.22rem 0.6rem',borderRadius:'999px'}}>{product.badge}</span>
            )}
            {product.stock === 0 && (
              <span style={{background:'var(--red)',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'0.22rem 0.6rem',borderRadius:'999px'}}>Out of Stock</span>
            )}
            {disc > 0 && (
              <span style={{background:'var(--green)',color:'#fff',fontSize:'0.65rem',fontWeight:700,padding:'0.22rem 0.6rem',borderRadius:'999px'}}>{disc}% OFF</span>
            )}
          </div>
        </div>

        {/* Right - Details */}
        <div className="modal-right">
          <div className="modal-cat">{product.category}</div>
          <div className="modal-name">{product.name}</div>

          <div style={{display:'flex',alignItems:'center',gap:'0.5rem'}}>
            <span style={{color:'var(--yellow)',fontSize:'0.9rem',letterSpacing:1}}>{stars}</span>
            <span style={{fontWeight:700,fontSize:'0.9rem'}}>{avgRatingNum}</span>
            <a href="#reviews" onClick={e=>{e.preventDefault();setShowRevs(true)}}
              style={{fontSize:'0.78rem',color:'var(--orange)',textDecoration:'none',cursor:'pointer'}}>
              ({totalReviewsCount} reviews)
            </a>
          </div>

          <div className="modal-price-block">
            <div className="modal-price">{formatCurrency(product.price)}</div>
            {product.mrp > product.price && (
              <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginTop:'0.15rem'}}>
                <span style={{fontSize:'0.78rem',color:'var(--text-muted)',textDecoration:'line-through'}}>MRP {formatCurrency(product.mrp)}</span>
                {disc > 0 && <span style={{background:'var(--orange)',color:'#fff',fontSize:'0.68rem',fontWeight:700,padding:'0.08rem 0.5rem',borderRadius:'999px'}}>{disc}% off</span>}
              </div>
            )}
          </div>

          {/* Stock */}
          <div>
            {product.stock === 0 ? (
              <span className="sttag" style={{background:'var(--red-light)',color:'var(--red)',fontSize:'0.72rem',fontWeight:700,padding:'0.26rem 0.72rem',borderRadius:'999px',display:'inline-block'}}>❌ Out of Stock</span>
            ) : product.stock <= 5 ? (
              <span style={{background:'var(--yellow-light)',color:'#92400e',fontSize:'0.72rem',fontWeight:700,padding:'0.26rem 0.72rem',borderRadius:'999px',display:'inline-block'}}>⚠️ Only {product.stock} left!</span>
            ) : (
              <span style={{background:'var(--green-light)',color:'var(--green-dark)',fontSize:'0.72rem',fontWeight:700,padding:'0.26rem 0.72rem',borderRadius:'999px',display:'inline-block'}}>✅ In Stock</span>
            )}
          </div>

          {/* Description */}
          {product.desc && <p style={{fontSize:'0.84rem',color:'var(--text-secondary)',lineHeight:1.7}}>{product.desc}</p>}

          {/* Features */}
          {product.features?.length > 0 && (
            <div style={{display:'flex',flexDirection:'column',gap:'0.15rem'}}>
              {product.features.map((f, i) => (
                <div key={i} style={{display:'flex',alignItems:'center',gap:'0.4rem',fontSize:'0.8rem',color:'var(--text-secondary)'}}>
                  <span style={{color:'var(--green)',fontWeight:700}}>✓</span> {f}
                </div>
              ))}
            </div>
          )}

          {/* Qty */}
          <div style={{display:'flex',alignItems:'center',gap:'0.75rem'}}>
            <span style={{fontWeight:600,fontSize:'0.84rem'}}>Quantity:</span>
            <div className="qty-ctrl">
              <button className="qty-btn" onClick={() => setQty(q => Math.max(1, q-1))}>−</button>
              <span className="qty-val">{qty}</span>
              <button className="qty-btn" onClick={() => setQty(q => Math.min(maxQty, q+1))}>+</button>
            </div>
            {product.stock > 0 && product.stock <= 10 && (
              <span style={{fontSize:'0.71rem',color:'var(--text-muted)'}}>(Max {product.stock})</span>
            )}
          </div>

          {/* Buttons */}
          <div className="modal-btns">
            <button
              className={`btn-atc ${added ? 'added' : ''}`}
              onClick={handleAddToCart}
              disabled={product.stock === 0}
            >
              {product.stock === 0 ? '❌ Out of Stock' : added ? '✅ Added!' : '🛒 Add to Cart'}
            </button>
            <button className="btn-buy" onClick={handleBuyNow} disabled={product.stock === 0}>
              ⚡ Buy Now
            </button>
          </div>

          {/* Delivery info */}
          <div className="delivery-estimate-card">
            <div className="delivery-estimate-icon"><AppIcon name="truck" size={18} /></div>
            <div><strong>Expected delivery</strong><span>{deliveryEstimate.weekday}, {deliveryEstimate.dateLabel} • {deliveryEstimate.promise}</span><small>{deliveryEstimate.speedLabel} in Bakani • ₹100+ par free delivery</small></div>
          </div>
        </div>

        {/* Reviews - full width */}
        {showRevs && (
          <div style={{gridColumn:'1/-1',borderTop:'1px solid var(--border)',padding:'1.5rem'}}>
            <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:'1rem',flexWrap:'wrap',gap:'0.5rem'}}>
              <div style={{display:'flex',alignItems:'center',gap:'0.65rem'}}>
                <h3 style={{fontFamily:'var(--font-display)',fontWeight:800,fontSize:'1.05rem',color:'var(--text-primary)',margin:0}}>⭐ Customer Reviews</h3>
                <span style={{fontSize:'0.75rem',fontWeight:700,background:'rgba(249,115,22,0.12)',color:'var(--orange)',padding:'0.2rem 0.6rem',borderRadius:'999px'}}>
                  {avgRatingNum} / 5 ({totalReviewsCount} reviews)
                </span>
              </div>
              <div style={{display:'flex',alignItems:'center',gap:'0.6rem',flexWrap:'wrap'}}>
                {checkingDelivered ? (
                  <span style={{fontSize:'0.72rem',color:'var(--text-muted)'}}>Checking verified buyer status...</span>
                ) : (deliveredOrder && deliveredOrder.status === 'delivered') ? (
                  hasAlreadyReviewed ? (
                    <span
                      style={{
                        fontSize: '0.72rem',
                        fontWeight: 800,
                        background: 'rgba(22, 163, 74, 0.12)',
                        color: '#15803d',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '8px',
                        border: '1px solid rgba(22, 163, 74, 0.25)',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      ✓ Review Submitted
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setWriteRevOpen(o => !o)}
                      className="btn btn-orange btn-sm"
                      style={{
                        padding: '0.42rem 0.95rem',
                        borderRadius: '999px',
                        fontSize: '0.78rem',
                        fontWeight: 800,
                        cursor: 'pointer',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                        boxShadow: '0 2px 8px rgba(249, 115, 22, 0.3)',
                      }}
                    >
                      {writeRevOpen ? '✕ Cancel' : '✍️ Write Review'}
                    </button>
                  )
                ) : (
                  <button
                    type="button"
                    onClick={() => {
                      if (!user) {
                        showToast('Review sirf wahi likh sakte hain jinka ye order deliver ho chuka ho. Pehle apna account login karein.', 'warning');
                      } else {
                        showToast('Review access sirf un customers ke liye hai jinhone ye product khareeda ho aur jinka order DELIVERED ho chuka ho.', 'warning');
                      }
                    }}
                    style={{
                      fontSize: '0.74rem',
                      fontWeight: 700,
                      background: 'rgba(245, 158, 11, 0.08)',
                      color: '#b45309',
                      border: '1px dashed rgba(245, 158, 11, 0.4)',
                      padding: '0.38rem 0.85rem',
                      borderRadius: '999px',
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      cursor: 'pointer',
                      transition: 'all 0.15s ease',
                    }}
                    title="Review sirf un verified customers ke liye available hai jinka ye order deliver ho chuka ho."
                  >
                    <span>🔒</span>
                    <span>Delivered Buyers Only</span>
                  </button>
                )}
                <button onClick={() => setShowRevs(false)} style={{background:'none',border:'none',cursor:'pointer',fontSize:'0.8rem',color:'var(--text-muted)'}}>Hide ▲</button>
              </div>
            </div>

            {/* Write a review form - Strictly restricted to verified delivered order buyers */}
            {Boolean(deliveredOrder && deliveredOrder.status === 'delivered') && !hasAlreadyReviewed && writeRevOpen && (
              <form onSubmit={handleInlineReviewSubmit} style={{background:'var(--bg)',border:'1px solid var(--border-light)',borderRadius:'12px',padding:'1.1rem',marginBottom:'1.25rem'}}>
                <div style={{fontWeight:700,fontSize:'0.88rem',marginBottom:'0.75rem',color:'var(--text-primary)'}}>✍️ Apna Feedback Ya Review Likhein</div>

                {/* Verified Order Badge */}
                <div style={{display:'flex',alignItems:'center',gap:'0.5rem',marginBottom:'0.85rem',padding:'0.5rem 0.75rem',background:'rgba(22, 163, 74, 0.08)',border:'1px solid rgba(22, 163, 74, 0.25)',borderRadius:'8px',fontSize:'0.76rem',color:'#15803d',fontWeight:700,flexWrap:'wrap'}}>
                  <span>✓ Verified Delivered Order: #{deliveredOrder.orderId}</span>
                  <span>•</span>
                  <span>Customer: {deliveredOrder.address?.name || deliveredOrder.customerName || user?.name || 'Verified Buyer'}</span>
                </div>

                <div style={{marginBottom:'0.85rem'}}>
                  <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',marginBottom:'0.3rem'}}>Star Rating</label>
                  <div style={{display:'flex',alignItems:'center',gap:'0.35rem'}}>
                    {[1, 2, 3, 4, 5].map(st => (
                      <button
                        key={st}
                        type="button"
                        onClick={() => setNewRevRating(st)}
                        style={{
                          background:'none',border:'none',cursor:'pointer',fontSize:'1.35rem',
                          color: st <= newRevRating ? '#f59e0b' : '#cbd5e1',padding:'0.1rem',
                          transform: st <= newRevRating ? 'scale(1.08)' : 'scale(1)',
                          transition:'transform 0.15s ease',
                        }}
                      >
                        ★
                      </button>
                    ))}
                    <span style={{fontSize:'0.8rem',fontWeight:700,color:'var(--text-muted)',marginLeft:'0.4rem'}}>{newRevRating} / 5</span>
                  </div>
                </div>

                <div style={{marginBottom:'0.75rem'}}>
                  <label style={{display:'block',fontSize:'0.75rem',fontWeight:700,color:'var(--text-secondary)',marginBottom:'0.3rem'}}>Review Comment</label>
                  <textarea
                    rows={3}
                    placeholder="Product ki quality, packing, aur experience ke baare mein likhein..."
                    value={newRevComment}
                    onChange={e => setNewRevComment(e.target.value)}
                    style={{width:'100%',padding:'0.6rem 0.75rem',border:'1px solid var(--border)',borderRadius:'8px',fontSize:'0.82rem',background:'var(--bg-card)',color:'var(--text-primary)',resize:'vertical'}}
                  />
                </div>

                <div style={{display:'flex',justifyContent:'flex-end',gap:'0.5rem'}}>
                  <button
                    type="button"
                    onClick={() => setWriteRevOpen(false)}
                    style={{background:'var(--bg-secondary)',color:'var(--text-secondary)',border:'1px solid var(--border)',borderRadius:'8px',padding:'0.55rem 1rem',fontSize:'0.82rem',fontWeight:700,cursor:'pointer'}}
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submittingRev}
                    style={{
                      background: 'linear-gradient(135deg, var(--green-dark, #16a34a) 0%, #15803d 100%)',
                      color: '#ffffff',
                      border: 'none',
                      borderRadius: '8px',
                      padding: '0.55rem 1.25rem',
                      fontSize: '0.82rem',
                      fontWeight: 800,
                      cursor: submittingRev ? 'not-allowed' : 'pointer',
                      opacity: submittingRev ? 0.7 : 1,
                    }}
                  >
                    {submittingRev ? 'Submitting...' : '🚀 Submit Verified Review'}
                  </button>
                </div>
              </form>
            )}

            {/* List of reviews */}
            <div style={{display:'flex',flexDirection:'column',gap:'0.75rem'}}>
              {allDisplayReviews.map((r, i) => {
                const rRating = Number(r.rating) || 5;
                const rStars = '★'.repeat(rRating) + '☆'.repeat(Math.max(0, 5 - rRating));
                return (
                  <div key={r.id || i} className="review-card" style={{border:'1px solid var(--border-light)',borderRadius:'12px',padding:'0.95rem 1.1rem',background:'var(--bg-card)'}}>
                    <div className="review-header" style={{display:'flex',alignItems:'center',justifyContent:'space-between',flexWrap:'wrap',gap:'0.4rem',marginBottom:'0.4rem'}}>
                      <div style={{display:'flex',alignItems:'center',gap:'0.5rem',flexWrap:'wrap'}}>
                        <span className="reviewer-name" style={{fontWeight:800,fontSize:'0.88rem',color:'var(--text-primary)'}}>{r.name || r.customerName || 'Bakani Customer'}</span>
                        {r.verifiedBuyer && (
                          <span style={{fontSize:'0.68rem',background:'rgba(22, 163, 74, 0.12)',color:'#15803d',fontWeight:800,padding:'0.15rem 0.55rem',borderRadius:'999px',border:'1px solid rgba(22, 163, 74, 0.25)'}}>
                            ✓ Verified Buyer {r.orderId ? `(#${r.orderId.slice(-6)})` : ''}
                          </span>
                        )}
                      </div>
                      <span className="review-stars" style={{color:'#f59e0b',fontSize:'0.92rem',letterSpacing:'1.5px'}}>{rStars}</span>
                    </div>
                    <p className="review-text" style={{fontSize:'0.82rem',color:'var(--text-secondary)',lineHeight:1.6,margin:'0.35rem 0'}}>{r.comment || r.text}</p>
                    <div style={{fontSize:'0.72rem',color:'var(--text-muted)',display:'flex',justifyContent:'space-between',alignItems:'center',marginTop:'0.4rem'}}>
                      <span>{r.date || 'Bakani Store Order'}</span>
                      {r.location && <span>📍 {r.location}</span>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
        {!showRevs && (
          <div style={{gridColumn:'1/-1',padding:'0.5rem 1.5rem 1rem'}}>
            <button
              onClick={() => setShowRevs(true)}
              style={{background:'none',border:'1.5px solid var(--border)',borderRadius:'var(--radius-sm)',padding:'0.55rem 1.2rem',fontSize:'0.82rem',fontWeight:700,cursor:'pointer',color:'var(--text-secondary)',transition:'var(--transition)',width:'100%'}}
            >⭐ Customer Reviews dekho ({totalReviewsCount}) ▼</button>
          </div>
        )}
      </div>
    </div>
  );
}

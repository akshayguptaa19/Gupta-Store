'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useWishlistStore, useCartStore, useUIStore } from '@/lib/store';
import { getMergedProducts, syncProductsFromServer } from '@/lib/products';
import { formatCurrency } from '@/lib/utils';
import ProductModal from '@/components/ProductModal';
import AppIcon from '@/components/AppIcon';

export default function WishlistPage() {
  const wishIds = useWishlistStore(s => s.ids);
  const toggleWish = useWishlistStore(s => s.toggle);
  const clearWishlist = useWishlistStore(s => s.clear);
  const addToCart = useCartStore(s => s.addItem);
  const showToast = useUIStore(s => s.showToast);

  const [allProducts, setAllProducts] = useState([]);
  const [modalProduct, setModalProduct] = useState(null);

  useEffect(() => {
    setAllProducts(getMergedProducts());
    syncProductsFromServer().then(fresh => {
      if (fresh) setAllProducts(fresh);
    });

    function onUpdated(e) {
      if (Array.isArray(e.detail)) setAllProducts(e.detail);
    }
    window.addEventListener('ggsProductsUpdated', onUpdated);
    return () => window.removeEventListener('ggsProductsUpdated', onUpdated);
  }, []);

  const wishProducts = allProducts.filter(p => wishIds.includes(p.id));

  function handleMoveToCart(product) {
    addToCart(product, 1);
    toggleWish(product);
    showToast(`🛒 "${product.name}" Cart mein move ho gaya!`, 'success');
  }

  function handleAddAllToCart() {
    if (wishProducts.length === 0) return;
    wishProducts.forEach(p => {
      addToCart(p, 1);
    });
    clearWishlist();
    showToast(`🎉 Saare ${wishProducts.length} items Cart mein add ho gaye!`, 'success');
  }

  function handleRemove(product) {
    toggleWish(product);
    showToast(`Item Wishlist se hata diya gaya`, 'info');
  }

  return (
    <div className="wishlist-page-wrapper" style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '1.5rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 1180, margin: '0 auto' }}>
        
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.84rem', color: 'var(--text-muted)', marginBottom: '1.25rem' }}>
          <Link href="/" style={{ color: 'var(--text-muted)', textDecoration: 'none' }}>Home</Link>
          <span>/</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 600 }}>My Wishlist</span>
        </div>

        {/* Header Hero Banner */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '20px',
            border: '1px solid var(--border)',
            boxShadow: '0 4px 20px -2px rgba(0,0,0,0.04)',
            padding: '1.5rem 1.75rem',
            marginBottom: '1.75rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <div
              style={{
                width: 50,
                height: 50,
                borderRadius: '14px',
                background: 'rgba(239, 68, 68, 0.12)',
                color: 'var(--red, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="heart" size={26} strokeWidth={2.4} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.45rem', fontWeight: 800, margin: 0, color: 'var(--text-primary)' }}>
                  Meri Wishlist
                </h1>
                {wishProducts.length > 0 && (
                  <span
                    style={{
                      fontSize: '0.75rem',
                      fontWeight: 800,
                      background: 'rgba(239, 68, 68, 0.1)',
                      color: 'var(--red, #ef4444)',
                      padding: '0.2rem 0.65rem',
                      borderRadius: '999px',
                    }}
                  >
                    {wishProducts.length} {wishProducts.length === 1 ? 'item' : 'items'}
                  </span>
                )}
              </div>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.84rem', color: 'var(--text-muted)' }}>
                Aapke pasandida stationery products yahan saved hain. Kabhi bhi cart me move karein.
              </p>
            </div>
          </div>

          {wishProducts.length > 0 && (
            <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={handleAddAllToCart}
                className="btn btn-orange"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.45rem',
                  padding: '0.65rem 1.25rem',
                  fontSize: '0.88rem',
                  fontWeight: 700,
                  borderRadius: '12px',
                  boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
                }}
              >
                <AppIcon name="cart" size={16} /> Move All to Cart
              </button>
              <button
                onClick={() => {
                  if (confirm('Kya aap sach me saare items wishlist se hatana chahte hain?')) {
                    clearWishlist();
                    showToast('Wishlist clear kar di gayi.', 'info');
                  }
                }}
                style={{
                  background: 'transparent',
                  border: '1px solid var(--border)',
                  color: 'var(--text-muted)',
                  padding: '0.65rem 1rem',
                  borderRadius: '12px',
                  fontSize: '0.84rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  transition: 'all 0.2s',
                }}
              >
                <AppIcon name="trash" size={14} /> Clear All
              </button>
            </div>
          )}
        </div>

        {/* Empty State */}
        {wishProducts.length === 0 ? (
          <div
            style={{
              background: 'var(--bg-card)',
              borderRadius: '20px',
              padding: '4rem 1.5rem',
              textAlign: 'center',
              border: '1px solid var(--border)',
              boxShadow: '0 4px 20px -2px rgba(0,0,0,0.03)',
              margin: '1rem 0',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: '1.25rem',
            }}
          >
            <div
              style={{
                width: 88,
                height: 88,
                borderRadius: '50%',
                background: 'rgba(239, 68, 68, 0.08)',
                color: 'var(--red, #ef4444)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AppIcon name="heart" size={44} strokeWidth={1.4} />
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-display)', fontSize: '1.5rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
                Aapki Wishlist Khaali Hai
              </h2>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.92rem', maxWidth: 440, margin: '0 auto', lineHeight: 1.6 }}>
                Abhi tak aapne koi product save nahi kiya hai. School supplies, registers aur premium pens explore karein aur dil par click karke save karein.
              </p>
            </div>
            <Link
              href="/"
              className="btn btn-orange"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.85rem 1.85rem',
                fontSize: '0.96rem',
                fontWeight: 700,
                borderRadius: '999px',
                boxShadow: '0 4px 14px rgba(249,115,22,0.35)',
                textDecoration: 'none',
              }}
            >
              <AppIcon name="shop" size={18} />
              Shopping Start Karein
            </Link>
          </div>
        ) : (
          /* Products Grid */
          <div
            className="wishlist-products-grid"
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))',
              gap: '1.25rem',
            }}
          >
            {wishProducts.map((product, idx) => {
              const hasDiscount = product.mrp > product.price;
              const discountPercent = hasDiscount ? Math.round(((product.mrp - product.price) / product.mrp) * 100) : 0;
              const inStock = product.stock > 0;

              return (
                <div
                  key={`${product.id}_${idx}`}
                  style={{
                    background: 'var(--bg-card)',
                    borderRadius: '16px',
                    border: '1px solid var(--border)',
                    overflow: 'hidden',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 2px 10px rgba(0,0,0,0.03)',
                    transition: 'all 0.25s ease',
                    position: 'relative',
                  }}
                >
                  {/* Remove button */}
                  <button
                    onClick={() => handleRemove(product)}
                    title="Wishlist se hatayein"
                    aria-label="Remove item"
                    style={{
                      position: 'absolute',
                      top: 10,
                      right: 10,
                      width: 32,
                      height: 32,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.92)',
                      border: '1px solid var(--border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      cursor: 'pointer',
                      zIndex: 2,
                      color: 'var(--text-muted)',
                      boxShadow: '0 2px 6px rgba(0,0,0,0.08)',
                      transition: 'all 0.2s',
                    }}
                    onMouseEnter={e => { e.currentTarget.style.color = '#ef4444'; e.currentTarget.style.transform = 'scale(1.1)'; }}
                    onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; e.currentTarget.style.transform = 'scale(1)'; }}
                  >
                    <AppIcon name="trash" size={14} />
                  </button>

                  {/* Product Image Area */}
                  <div
                    onClick={() => setModalProduct(product)}
                    style={{
                      height: 190,
                      background: 'var(--gray-50)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      padding: '1.25rem',
                      cursor: 'pointer',
                      position: 'relative',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={product.image}
                      alt={product.name}
                      style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', transition: 'transform 0.25s' }}
                      onError={e => { e.target.src = 'https://placehold.co/200x200/f8fafc/94a3b8?text=Product'; }}
                    />
                    {hasDiscount && (
                      <span
                        style={{
                          position: 'absolute',
                          bottom: 10,
                          left: 10,
                          background: 'linear-gradient(135deg, #10b981, #059669)',
                          color: '#fff',
                          fontSize: '0.72rem',
                          fontWeight: 800,
                          padding: '0.2rem 0.55rem',
                          borderRadius: '6px',
                          boxShadow: '0 2px 6px rgba(16,185,129,0.3)',
                        }}
                      >
                        {discountPercent}% OFF
                      </span>
                    )}
                  </div>

                  {/* Details Area */}
                  <div style={{ padding: '1.15rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                    <div style={{ fontSize: '0.74rem', color: 'var(--orange)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.35rem' }}>
                      {product.category || 'Stationery'}
                    </div>

                    <h3
                      onClick={() => setModalProduct(product)}
                      style={{
                        fontSize: '0.96rem',
                        fontWeight: 700,
                        color: 'var(--text-primary)',
                        margin: '0 0 0.5rem',
                        cursor: 'pointer',
                        lineHeight: 1.35,
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                      title={product.name}
                    >
                      {product.name}
                    </h3>

                    {/* Rating & Stock */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem', fontSize: '0.78rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                        <span style={{ background: '#f59e0b', color: '#fff', padding: '0.12rem 0.45rem', borderRadius: 4, fontWeight: 700, fontSize: '0.72rem' }}>
                          ★ {product.rating || '4.5'}
                        </span>
                        <span style={{ color: 'var(--text-muted)' }}>({product.reviews || 18})</span>
                      </div>
                      <span
                        style={{
                          fontSize: '0.72rem',
                          fontWeight: 700,
                          color: inStock ? '#16a34a' : 'var(--red, #ef4444)',
                        }}
                      >
                        {inStock ? '✓ In Stock' : 'Out of Stock'}
                      </span>
                    </div>

                    {/* Price Row */}
                    <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.6rem', marginTop: 'auto', marginBottom: '1rem' }}>
                      <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--text-primary)' }}>
                        {formatCurrency(product.price)}
                      </span>
                      {hasDiscount && (
                        <span style={{ fontSize: '0.84rem', color: 'var(--text-muted)', textDecoration: 'line-through' }}>
                          {formatCurrency(product.mrp)}
                        </span>
                      )}
                    </div>

                    {/* Actions */}
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => handleMoveToCart(product)}
                        disabled={!inStock}
                        className="btn btn-orange"
                        style={{
                          flex: 1,
                          display: 'inline-flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '0.45rem',
                          padding: '0.65rem 0.75rem',
                          fontSize: '0.86rem',
                          fontWeight: 700,
                          borderRadius: '10px',
                          opacity: inStock ? 1 : 0.6,
                        }}
                      >
                        <AppIcon name="cart" size={15} /> Move to Cart
                      </button>
                      <button
                        onClick={() => setModalProduct(product)}
                        className="btn btn-ghost"
                        style={{
                          padding: '0.65rem 0.75rem',
                          borderRadius: '10px',
                          border: '1px solid var(--border)',
                          fontSize: '0.82rem',
                          fontWeight: 600,
                        }}
                        title="Quick View"
                      >
                        <AppIcon name="eye" size={15} />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Quick Modal */}
      {modalProduct && (
        <ProductModal product={modalProduct} onClose={() => setModalProduct(null)} />
      )}
    </div>
  );
}

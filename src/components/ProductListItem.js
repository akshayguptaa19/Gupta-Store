'use client';
import { useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useWishlistStore, useUIStore } from '@/lib/store';
import { discountPct, formatCurrency, getDeliveryEstimate, startDirectCheckout } from '@/lib/utils';

export default function ProductListItem({ product, onOpen, onWishlistToggle, searchQuery }) {
  const router = useRouter();
  const addItem = useCartStore(s => s.addItem);
  const removeItem = useCartStore(s => s.removeItem);
  const cartItems = useCartStore(s => s.items);
  const toggle = useWishlistStore(s => s.toggle);
  const isWished = useWishlistStore(s => s.isWished);
  const showToast = useUIStore(s => s.showToast);

  const wished = isWished(product.id);
  const inCart = cartItems.some(item => item.id === product.id);
  const disc = discountPct(product.price, product.mrp);
  const outOfStock = product.stock === 0;
  const savings = product.mrp > product.price ? product.mrp - product.price : 0;
  const deliveryEstimate = getDeliveryEstimate();

  function handleAddToCart(e) {
    e.stopPropagation();
    if (outOfStock) return;
    if (inCart) {
      removeItem(product.id);
      showToast(`${product.name} cart se remove ho gaya! 🗑️`, 'info');
      return;
    }
    addItem(product, 1);
    showToast(`${product.name} cart mein add ho gaya! 🛒`, 'success');
  }

  function handleWish(e) {
    e.stopPropagation();
    const added = toggle(product);
    if (added && onWishlistToggle) onWishlistToggle(true);
    showToast(added ? `❤️ Wishlist mein add hua!` : `💔 Wishlist se remove ho gaya`, added ? 'success' : 'info');
  }

  function handleBuyNow(e) {
    e.stopPropagation();
    if (!outOfStock) startDirectCheckout(product, 1, router);
  }

  // Highlight search query in product name
  function renderHighlightedName(name, query) {
    if (!query || !query.trim()) return name;
    const parts = name.split(new RegExp(`(${query.trim()})`, 'gi'));
    return parts.map((part, i) =>
      part.toLowerCase() === query.trim().toLowerCase() ? (
        <mark key={i} style={{ background: '#fef08a', color: '#854d0e', padding: '0 2px', borderRadius: 2 }}>
          {part}
        </mark>
      ) : (
        part
      )
    );
  }

  return (
    <div
      className="product-list-item"
      onClick={() => onOpen(product)}
      style={{
        display: 'flex',
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        padding: '1.25rem',
        marginBottom: '1rem',
        gap: '1.5rem',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-sm)',
        transition: 'transform 0.2s, box-shadow 0.2s, border-color 0.2s',
        position: 'relative',
        alignItems: 'center',
      }}
    >
      {/* 1. Left: Product Image */}
      <div
        style={{
          width: 140,
          height: 140,
          flexShrink: 0,
          background: 'var(--gray-50)',
          borderRadius: 'var(--radius-md)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          position: 'relative',
          padding: '0.75rem',
        }}
      >
        {product.badge && (
          <span
            style={{
              position: 'absolute',
              top: 6,
              left: 6,
              background: 'var(--orange)',
              color: '#fff',
              fontSize: '0.68rem',
              fontWeight: 800,
              padding: '0.2rem 0.5rem',
              borderRadius: 4,
              zIndex: 2,
            }}
          >
            {product.badge}
          </span>
        )}
        <button
          onClick={handleWish}
          style={{
            position: 'absolute',
            top: 6,
            right: 6,
            background: 'rgba(255,255,255,0.9)',
            border: '1px solid var(--border)',
            borderRadius: '50%',
            width: 30,
            height: 30,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            zIndex: 2,
            fontSize: '0.8rem',
          }}
          title={wished ? 'Remove from Wishlist' : 'Add to Wishlist'}
        >
          {wished ? '❤️' : '🤍'}
        </button>

        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={product.image}
          alt={product.name}
          loading="lazy"
          decoding="async"
          style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }}
          onError={e => (e.target.src = 'https://placehold.co/150x150/f1f5f9/94a3b8?text=Product')}
        />
      </div>

      {/* 2. Middle: Details & Features (Amazon/Flipkart Style) */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '0.75rem', color: 'var(--orange)', fontWeight: 700, textTransform: 'uppercase', marginBottom: '0.25rem' }}>
          {product.category}
        </div>

        <h3
          style={{
            fontFamily: 'var(--font-sans)',
            fontSize: '1.15rem',
            fontWeight: 700,
            color: 'var(--text-primary)',
            margin: '0 0 0.5rem 0',
            lineHeight: 1.35,
          }}
        >
          {renderHighlightedName(product.name, searchQuery)}
        </h3>

        {/* Ratings & Reviews */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.6rem' }}>
          <span style={{ background: '#15803d', color: '#fff', fontSize: '0.75rem', fontWeight: 800, padding: '0.15rem 0.5rem', borderRadius: 4, display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
            {product.rating} ★
          </span>
          <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 500 }}>
            ({product.reviews?.toLocaleString() || '120'} customer reviews)
          </span>
        </div>

        {/* Product Highlights / Features */}
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.6rem' }}>
          {product.features?.slice(0, 3).map((feat, idx) => (
            <span
              key={idx}
              style={{
                fontSize: '0.78rem',
                background: 'var(--gray-100)',
                color: 'var(--text-secondary)',
                padding: '0.2rem 0.55rem',
                borderRadius: 'var(--radius-xs)',
              }}
            >
              ✓ {feat}
            </span>
          )) || (
            <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>
              {product.desc?.slice(0, 90)}...
            </span>
          )}
        </div>

        {/* Delivery & Stock Info */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.8rem' }}>
          <span style={{ color: 'var(--green-dark)', fontWeight: 700 }}>
            🚚 {deliveryEstimate.speedLabel} • {deliveryEstimate.dateLabel}
          </span>
          <span style={{ color: outOfStock ? 'var(--red)' : 'var(--text-muted)', fontWeight: 600 }}>
            {outOfStock ? '● Out of Stock' : '● In Stock (Bakani Store)'}
          </span>
        </div>
      </div>

      {/* 3. Right: Price & CTA (Amazon/Flipkart Buy Box) */}
      <div
        className="product-list-right"
        style={{
          width: 200,
          flexShrink: 0,
          borderLeft: '1px solid var(--border)',
          paddingLeft: '1.5rem',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
        }}
      >
        <div style={{ marginBottom: '0.75rem' }}>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.5rem' }}>
            <span style={{ fontSize: '1.5rem', fontWeight: 900, color: 'var(--text-primary)' }}>
              {formatCurrency(product.price)}
            </span>
            {disc > 0 && (
              <span style={{ fontSize: '0.85rem', color: 'var(--green-dark)', fontWeight: 800 }}>
                {disc}% off
              </span>
            )}
          </div>
          {product.mrp > product.price && (
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              M.R.P: <span style={{ textDecoration: 'line-through' }}>{formatCurrency(product.mrp)}</span>
              <span style={{ display: 'block', color: 'var(--green-dark)', fontWeight: 600, fontSize: '0.75rem', marginTop: '0.15rem' }}>
                Save ₹{savings}
              </span>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={handleAddToCart}
          disabled={outOfStock}
          className="btn btn-orange"
          style={{
            width: '100%',
            padding: '0.7rem',
            fontSize: '0.9rem',
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '0.4rem',
            opacity: outOfStock ? 0.6 : 1,
            background: inCart ? 'var(--green-dark)' : undefined,
            borderColor: inCart ? 'var(--green-dark)' : undefined,
          }}
        >
          {inCart ? '✓ In Cart' : outOfStock ? 'Out of Stock' : '🛒 Add to Cart'}
        </button>
        {!outOfStock && <button type="button" onClick={handleBuyNow} className="btn btn-ghost direct-buy-btn">⚡ Buy Now</button>}
      </div>
    </div>
  );
}

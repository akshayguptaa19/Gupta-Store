'use client';
import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useCartStore, useWishlistStore, useUIStore } from '@/lib/store';
import { discountPct, formatCurrency, startDirectCheckout } from '@/lib/utils';
import AppIcon from '@/components/AppIcon';

export default function ProductCard({ product, onOpen, onWishlistToggle }) {
  const router    = useRouter();
  const addItem   = useCartStore(s => s.addItem);
  const removeItem = useCartStore(s => s.removeItem);
  const cartItems = useCartStore(s => s.items);
  const toggle    = useWishlistStore(s => s.toggle);
  const isWished  = useWishlistStore(s => s.isWished);
  const showToast = useUIStore(s => s.showToast);
  const [imageFailed, setImageFailed] = useState(false);

  const wished = isWished(product.id);
  const updateQty = useCartStore(s => s.updateQty);
  const cartItem  = cartItems.find(item => item.id === product.id);
  const inCart    = Boolean(cartItem);
  const currentQty = cartItem?.qty || 0;
  const disc      = discountPct(product.price, product.mrp);
  const outOfStock = product.stock === 0;

  const stars = useMemo(() => {
    const full = Math.floor(product.rating);
    const half = product.rating % 1 >= 0.5;
    return '★'.repeat(full) + (half ? '' : '') + '☆'.repeat(5 - full - (half ? 1 : 0));
  }, [product.rating]);

  function handleAddToCart(e) {
    e.stopPropagation();
    if (outOfStock) return;
    addItem(product, 1);
    showToast(`${product.name} cart mein add ho gaya! 🛒`, 'success');
  }

  function handleQtyMinus(e) {
    e.stopPropagation();
    if (!cartItem) return;
    if (currentQty <= 1) {
      removeItem(product.id);
      showToast(`${product.name} cart se remove ho gaya! 🗑️`, 'info');
    } else {
      updateQty(product.id, currentQty - 1);
    }
  }

  function handleQtyPlus(e) {
    e.stopPropagation();
    if (product.stock && currentQty >= product.stock) {
      showToast(`Sirf ${product.stock} items available hain!`, 'error');
      return;
    }
    updateQty(product.id, currentQty + 1);
  }

  function handleBuyNow(e) {
    e.stopPropagation();
    if (!outOfStock) startDirectCheckout(product, 1, router);
  }

  function handleWish(e) {
    e.stopPropagation();
    const added = toggle(product);
    if (added && onWishlistToggle) onWishlistToggle(true);
    showToast(added ? `❤️ Wishlist mein add hua!` : `💔 Wishlist se remove ho gaya`, added ? 'success' : 'info');
  }

  return (
    <div className="product-card" onClick={() => onOpen(product)}>
      {outOfStock && (
        <div className="oos-overlay">
          <span className="oos-badge">Out of Stock</span>
        </div>
      )}

      <div className="card-img-wrap">
        {product.badge && <span className="card-badge">{product.badge}</span>}
        <button
          className={`card-wish ${wished ? 'on' : ''}`}
          onClick={handleWish}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <AppIcon name="heart" size={17} fill={wished ? 'currentColor' : 'none'} />
        </button>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {imageFailed ? (
          <span className="image-fallback" role="img" aria-label={`${product.name} product image unavailable`}>
            <AppIcon name={product.emoji || 'package'} size={42} strokeWidth={1.6} />
          </span>
        ) : (
          <img
            src={product.image}
            alt={product.name}
            loading="lazy"
            decoding="async"
            onError={() => setImageFailed(true)}
            style={{width:'100%',height:'100%',objectFit:'contain'}}
          />
        )}
      </div>

      <div className="card-body">
        <div className="card-name">{product.name}</div>

        <div className="card-rating">
          <span className="card-stars" style={{color:'var(--yellow)',letterSpacing:'0.5px'}}>
            {'★'.repeat(Math.floor(product.rating))}{'☆'.repeat(5 - Math.floor(product.rating))}
          </span>
          <span style={{fontWeight:600}}>{product.rating}</span>
          <span style={{color:'var(--text-muted)',fontSize:'0.72rem'}}>({product.reviews?.toLocaleString()})</span>
        </div>

        <div className="card-price-row">
          <span className="card-price">{formatCurrency(product.price)}</span>
          {product.mrp > product.price && (
            <span className="card-mrp">{formatCurrency(product.mrp)}</span>
          )}
          {disc > 0 && <span className="card-disc">{disc}% off</span>}
        </div>

        <div className="card-cta-wrap">
          {inCart ? (
            <div className="card-qty-stepper" onClick={e => e.stopPropagation()}>
              <button
                type="button"
                className="qty-step-btn minus"
                onClick={handleQtyMinus}
                aria-label="Decrease quantity"
              >
                −
              </button>
              <span className="qty-step-val">{currentQty}</span>
              <button
                type="button"
                className="qty-step-btn plus"
                onClick={handleQtyPlus}
                aria-label="Increase quantity"
              >
                +
              </button>
            </div>
          ) : (
            <div className="card-cta-stack">
              <button
                type="button"
                className={`card-atc ${outOfStock ? 'oos' : ''}`}
                onClick={handleAddToCart}
                disabled={outOfStock}
              >
                {outOfStock ? '❌ Out of Stock' : '+ Add'}
              </button>
              {!outOfStock && <button type="button" className="card-buy-now" onClick={handleBuyNow}>⚡ Buy Now</button>}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

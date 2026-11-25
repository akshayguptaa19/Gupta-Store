'use client';
import { useState } from 'react';
import AppIcon from '@/components/AppIcon';
import { getProductFallbackImage } from '@/lib/products';
import { useAuthStore, useUIStore } from '@/lib/store';

const STAR_LABELS = {
  1: '1★ Poor (Bekar)',
  2: '2★ Fair (Theek-thaak)',
  3: '3★ Good (Acha)',
  4: '4★ Very Good (Bahut Acha)',
  5: '5★ Excellent (Shaandar!)',
};

export default function FeedbackModal({ order, onClose, onSubmitSuccess }) {
  const user = useAuthStore(s => s.user);
  const showToast = useUIStore(s => s.showToast);

  const items = order?.items || [];
  const [selectedIdx, setSelectedIdx] = useState(0);
  const selectedItem = items[selectedIdx] || items[0] || {};

  const [rating, setRating] = useState(5);
  const [hoverRating, setHoverRating] = useState(0);
  const [comment, setComment] = useState('');
  const [customerName, setCustomerName] = useState(order?.address?.name || user?.name || '');
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    if (e) e.preventDefault();
    if (order?.status !== 'delivered') {
      showToast('Feedback sirf order deliver hone ke baad hi submit kiya ja sakta hai.', 'warning');
      return;
    }
    if (!comment.trim()) {
      showToast('Kripya apna feedback ya review likhein.', 'warning');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productId: selectedItem.id || '1',
          productName: selectedItem.name || 'Stationery Item',
          rating,
          comment: comment.trim(),
          customerName: customerName.trim() || user?.name || 'Customer',
          orderId: order?.orderId,
          customerPhone: order?.address?.phone || user?.phone,
          customerEmail: order?.customerEmail || user?.email,
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.ok) {
        throw new Error(data.message || 'Feedback submit nahi ho saka.');
      }

      showToast('🎉 Aapka feedback submit ho gaya aur product details me jud gaya!', 'success');
      if (typeof window !== 'undefined') {
        window.dispatchEvent(new CustomEvent('ggsReviewAdded', { detail: data.review }));
      }
      if (onSubmitSuccess) onSubmitSuccess(data.review);
      onClose();
    } catch (err) {
      showToast(err.message || 'Error occurred while saving feedback.', 'error');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="modal-overlay"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        backgroundColor: 'rgba(0, 0, 0, 0.65)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        backdropFilter: 'blur(5px)',
      }}
      onClick={e => e.target === e.currentTarget && onClose()}
    >
      <div
        className="modal-box"
        style={{
          background: 'var(--bg-card)',
          color: 'var(--text-primary)',
          maxWidth: 540,
          width: '100%',
          borderRadius: '22px',
          padding: '1.75rem',
          boxShadow: '0 20px 45px rgba(0,0,0,0.25)',
          border: '1px solid var(--border)',
          position: 'relative',
          maxHeight: '90vh',
          overflowY: 'auto',
          display: 'block',
        }}
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '1.25rem',
            right: '1.25rem',
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: 'var(--bg-secondary)',
            border: '1px solid var(--border)',
            color: 'var(--text-secondary)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '0.9rem',
          }}
        >
          ✕
        </button>

        {/* Modal Header */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem' }}>
          <div
            style={{
              width: 44,
              height: 44,
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #f97316 0%, #ea580c 100%)',
              color: '#ffffff',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(249,115,22,0.3)',
              flexShrink: 0,
            }}
          >
            <AppIcon name="star" size={22} fill="currentColor" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, fontFamily: 'var(--font-display)', color: 'var(--text-primary)' }}>
              Rate & Review Order
            </h3>
            <p style={{ margin: '0.15rem 0 0', fontSize: '0.8rem', color: 'var(--text-muted)' }}>
              Order <strong style={{ color: 'var(--orange)' }}>#{order?.orderId}</strong> • Gupta Store Bakani
            </p>
          </div>
        </div>

        {/* Product Selector if multiple items */}
        {items.length > 1 && (
          <div style={{ marginBottom: '1.25rem' }}>
            <label style={{ fontSize: '0.78rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', display: 'block', marginBottom: '0.45rem' }}>
              Select Product to Review:
            </label>
            <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto', paddingBottom: '0.35rem' }}>
              {items.map((it, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setSelectedIdx(idx)}
                  style={{
                    padding: '0.45rem 0.75rem',
                    borderRadius: '10px',
                    border: selectedIdx === idx ? '1.5px solid #ea580c' : '1px solid var(--border)',
                    background: selectedIdx === idx ? 'rgba(249, 115, 22, 0.1)' : 'var(--bg-secondary)',
                    color: selectedIdx === idx ? '#ea580c' : 'var(--text-secondary)',
                    cursor: 'pointer',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                    whiteSpace: 'nowrap',
                    transition: 'all 0.15s ease',
                  }}
                >
                  {it.name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Selected Product Banner */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.85rem',
            padding: '0.75rem 0.95rem',
            background: 'var(--bg-secondary)',
            borderRadius: '14px',
            border: '1px solid var(--border)',
            marginBottom: '1.25rem',
          }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={selectedItem.image || getProductFallbackImage(selectedItem.name, selectedItem.category)}
            alt={selectedItem.name || 'Product'}
            referrerPolicy="no-referrer"
            style={{ width: 44, height: 44, objectFit: 'contain', borderRadius: 8, background: '#ffffff', padding: 2, border: '1px solid var(--border)', flexShrink: 0 }}
            onError={e => { e.target.onerror = null; e.target.src = getProductFallbackImage(selectedItem.name); }}
          />
          <div style={{ minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: '0.92rem', color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
              {selectedItem.name}
            </div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: '0.1rem' }}>
              Price: ₹{selectedItem.price} • Verified Purchase
            </div>
          </div>
        </div>

        {/* Interactive 5-Star Selector */}
        <div style={{ textAlign: 'center', margin: '1.25rem 0', padding: '1rem', background: 'var(--bg)', borderRadius: '16px', border: '1px solid var(--border-light)' }}>
          <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.5rem' }}>
            Aapka Rating Kya Hai?
          </div>
          <div style={{ display: 'inline-flex', gap: '0.45rem', fontSize: '2rem', cursor: 'pointer' }}>
            {[1, 2, 3, 4, 5].map(starNum => {
              const filled = (hoverRating || rating) >= starNum;
              return (
                <span
                  key={starNum}
                  onClick={() => setRating(starNum)}
                  onMouseEnter={() => setHoverRating(starNum)}
                  onMouseLeave={() => setHoverRating(0)}
                  style={{
                    color: filled ? '#f59e0b' : 'var(--gray-300)',
                    transition: 'transform 0.15s ease, color 0.15s ease',
                    transform: (hoverRating || rating) === starNum ? 'scale(1.2)' : 'scale(1)',
                    userSelect: 'none',
                  }}
                >
                  ★
                </span>
              );
            })}
          </div>
          <div style={{ fontSize: '0.84rem', fontWeight: 800, color: '#f59e0b', marginTop: '0.35rem' }}>
            {STAR_LABELS[hoverRating || rating]}
          </div>
        </div>

        {/* Review Form */}
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '0.95rem' }}>
          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Aapka Naam:
            </label>
            <input
              type="text"
              className="form-input"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              placeholder="e.g. Akshay Gupta"
              style={{
                width: '100%',
                padding: '0.65rem 0.95rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.88rem',
                fontWeight: 600,
              }}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: '0.82rem', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '0.35rem' }}>
              Aapka Feedback / Anubhav:
            </label>
            <textarea
              className="form-input"
              rows={4}
              value={comment}
              onChange={e => setComment(e.target.value)}
              placeholder="Is stationery product ki quality, writing, ink ya packaging ke baare mein likhein..."
              style={{
                width: '100%',
                padding: '0.75rem 0.95rem',
                borderRadius: '10px',
                border: '1.5px solid var(--border)',
                background: 'var(--bg-card)',
                color: 'var(--text-primary)',
                fontSize: '0.86rem',
                lineHeight: 1.5,
                resize: 'vertical',
              }}
            />
          </div>

          <div style={{ background: 'rgba(22, 163, 74, 0.08)', padding: '0.65rem 0.85rem', borderRadius: '10px', fontSize: '0.78rem', color: '#16a34a', display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
            <AppIcon name="check" size={15} strokeWidth={2.5} />
            <span>Yeh review website par sabhi customers ko is product details me dikhayi dega.</span>
          </div>

          <div style={{ display: 'flex', gap: '0.65rem', marginTop: '0.4rem' }}>
            <button
              type="button"
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1, padding: '0.75rem', borderRadius: '10px', fontWeight: 700, border: '1px solid var(--border)' }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="btn btn-orange"
              style={{
                flex: 2,
                padding: '0.75rem',
                borderRadius: '10px',
                fontWeight: 800,
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit Review ⭐'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}


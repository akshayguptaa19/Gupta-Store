'use client';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { SHOP } from '@/lib/config';
import { formatCurrency, getDeliveryEstimate } from '@/lib/utils';
import { useEffect, useState, Suspense } from 'react';
import AppIcon from '@/components/AppIcon';

function ThankYouContent() {
  const params  = useSearchParams();
  const orderId = params.get('orderId');
  const [order, setOrder] = useState(null);
  const [copied, setCopied] = useState(false);
  const deliveryEstimate = order?.expectedDelivery || getDeliveryEstimate();

  useEffect(() => {
    if (!orderId) return;
    fetch(`/api/orders/${orderId}`, { cache: 'no-store' })
      .then(res => res.json())
      .then(data => { if (data.ok) setOrder(data.order); })
      .catch(() => {});
  }, [orderId]);

  function copyOrderId() {
    if (orderId && navigator?.clipboard) {
      navigator.clipboard.writeText(orderId);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div style={{ background: 'var(--bg-secondary)', minHeight: '100vh', padding: '2.5rem 1.25rem 5rem' }}>
      <div style={{ maxWidth: 640, margin: '0 auto' }}>
        
        {/* Main Confirmation Card */}
        <div
          style={{
            background: 'var(--bg-card)',
            borderRadius: '24px',
            border: '1px solid var(--border)',
            boxShadow: '0 8px 30px -4px rgba(0,0,0,0.06)',
            padding: '2.5rem 2rem',
            textAlign: 'center',
          }}
        >
          {/* Animated Success Check Badge */}
          <div
            style={{
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 8px 24px rgba(16,185,129,0.35)',
              marginBottom: '1.25rem',
            }}
          >
            <AppIcon name="check" size={42} strokeWidth={3} />
          </div>

          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: '1.85rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
            Order Confirm Ho Gaya!
          </h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.94rem', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
            Shukriya! Aapka order Gupta General Store par receive ho gaya hai. Hamari team packing shuru kar rahi hai.
          </p>

          {/* Delivery Promise Box */}
          <div
            style={{
              background: 'linear-gradient(135deg, rgba(59,130,246,0.08), rgba(37,99,235,0.03))',
              border: '1px solid rgba(59,130,246,0.22)',
              borderRadius: '16px',
              padding: '1.15rem 1.35rem',
              marginBottom: '1.75rem',
              textAlign: 'left',
              display: 'flex',
              alignItems: 'center',
              gap: '1rem',
            }}
          >
            <div
              style={{
                width: 44,
                height: 44,
                borderRadius: '50%',
                background: 'rgba(59,130,246,0.15)',
                color: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <AppIcon name="truck" size={22} />
            </div>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'block' }}>Expected Delivery</span>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>
                {deliveryEstimate.weekday}, {deliveryEstimate.dateLabel}
              </strong>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginTop: '0.15rem' }}>
                {deliveryEstimate.promise} • Doorstep local delivery in Bakani
              </div>
            </div>
          </div>

          {/* Order Details Receipt Box */}
          {order && (
            <div
              style={{
                background: 'var(--bg-secondary)',
                borderRadius: '16px',
                border: '1px solid var(--border-light)',
                padding: '1.25rem 1.35rem',
                marginBottom: '1.75rem',
                textAlign: 'left',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingBottom: '0.75rem', borderBottom: '1px solid var(--border-light)', marginBottom: '0.75rem' }}>
                <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>ORDER ID</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <span style={{ fontSize: '0.95rem', fontWeight: 900, color: 'var(--orange)' }}>#{order.orderId}</span>
                  <button
                    onClick={copyOrderId}
                    style={{ background: 'none', border: 'none', color: copied ? 'var(--green)' : 'var(--text-muted)', cursor: 'pointer', padding: 2 }}
                    title="Copy Order ID"
                  >
                    <AppIcon name={copied ? 'check' : 'clipboard'} size={14} />
                  </button>
                </div>
              </div>

              {/* Itemized product list */}
              <div style={{ margin: '0.75rem 0', borderTop: '1px dashed var(--border-light)', borderBottom: '1px dashed var(--border-light)', padding: '0.75rem 0' }}>
                <div style={{ fontSize: '0.78rem', fontWeight: 800, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                  Ordered Products ({order.items?.length || 0})
                </div>
                {(order.items || []).map((it, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.65rem', padding: '0.35rem 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.55rem', minWidth: 0 }}>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={it.image || 'https://placehold.co/44x44/f1f5f9/94a3b8?text=ITEM'}
                        alt={it.name}
                        style={{ width: 38, height: 38, borderRadius: '8px', objectFit: 'cover', background: 'var(--bg)', flexShrink: 0, border: '1px solid var(--border-light)' }}
                        onError={e => { e.target.src = 'https://placehold.co/44x44/f1f5f9/94a3b8?text=ITEM'; }}
                      />
                      <div style={{ minWidth: 0 }}>
                        <div style={{ fontSize: '0.84rem', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                          {it.name}
                        </div>
                        <div style={{ fontSize: '0.74rem', color: 'var(--text-muted)' }}>
                          Qty: {it.qty || it.quantity || 1} • {formatCurrency(it.price)} each
                        </div>
                      </div>
                    </div>
                    <div style={{ fontSize: '0.88rem', fontWeight: 800, color: 'var(--text-primary)', flexShrink: 0 }}>
                      {formatCurrency((it.price || 0) * (it.qty || it.quantity || 1))}
                    </div>
                  </div>
                ))}
              </div>

              {/* Delivery address snippet */}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', marginBottom: '0.65rem', fontSize: '0.84rem' }}>
                <AppIcon name="mapPin" size={14} style={{ color: 'var(--orange)', marginTop: '2px', flexShrink: 0 }} />
                <div>
                  <span style={{ color: 'var(--text-muted)', fontSize: '0.74rem', display: 'block' }}>Delivery Address:</span>
                  <strong style={{ color: 'var(--text-primary)' }}>{order.address?.name || 'Customer'}</strong>
                  <span style={{ color: 'var(--text-secondary)', display: 'block', fontSize: '0.78rem' }}>
                    {order.address?.area || 'Bakani'}, {order.address?.pincode || '326022'}
                  </span>
                </div>
              </div>

              {/* Payment Method */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.6rem', fontSize: '0.86rem' }}>
                <span style={{ color: 'var(--text-secondary)' }}>Payment Mode</span>
                <span style={{ fontWeight: 700, color: 'var(--text-primary)', display: 'inline-flex', alignItems: 'center', gap: '0.35rem' }}>
                  <AppIcon name="cod" size={14} /> Cash on Delivery (COD)
                </span>
              </div>

              {/* Total */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: '0.75rem', borderTop: '1px solid var(--border-light)', marginTop: '0.75rem' }}>
                <span style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-primary)' }}>Total Amount</span>
                <span style={{ fontFamily: 'var(--font-display)', fontSize: '1.25rem', fontWeight: 900, color: 'var(--orange)' }}>
                  {formatCurrency(order.total)}
                </span>
              </div>
            </div>
          )}

          {/* Action CTAs */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <Link
              href={orderId ? `/track?orderId=${orderId}` : '/track'}
              className="btn btn-orange"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                padding: '0.9rem',
                fontSize: '0.96rem',
                fontWeight: 800,
                borderRadius: '12px',
                textDecoration: 'none',
                boxShadow: '0 4px 14px rgba(249,115,22,0.3)',
              }}
            >
              <AppIcon name="truck" size={18} />
              Live Order Status Track Karein →
            </Link>

            <a
              href={`https://wa.me/${SHOP.whatsapp}?text=${encodeURIComponent(`Namaste Gupta Store! Mera Order #${orderId || ''} place ho gaya hai. Status update share kar dijiye.`)}`}
              target="_blank"
              rel="noreferrer"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                background: '#25d366',
                color: '#fff',
                padding: '0.85rem',
                borderRadius: '12px',
                fontWeight: 700,
                textDecoration: 'none',
                fontSize: '0.92rem',
                boxShadow: '0 4px 12px rgba(37,211,102,0.25)',
              }}
            >
              <AppIcon name="message" size={17} /> WhatsApp pe Confirm Karein
            </a>

            <Link
              href="/orders"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.85rem',
                fontSize: '0.92rem',
                fontWeight: 700,
                borderRadius: '12px',
                border: '1.5px solid var(--orange)',
                background: 'rgba(249, 115, 22, 0.08)',
                textDecoration: 'none',
                color: 'var(--orange-dark)',
              }}
            >
              <AppIcon name="package" size={17} />
              <span>Aapke Saare Orders Dekhein →</span>
            </Link>

            <Link
              href="/"
              className="btn btn-ghost"
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.45rem',
                padding: '0.75rem',
                fontSize: '0.88rem',
                fontWeight: 600,
                borderRadius: '12px',
                border: '1px solid var(--border)',
                textDecoration: 'none',
                color: 'var(--text-secondary)',
              }}
            >
              <AppIcon name="home" size={16} /> Home Par Wapas Jayein
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '2rem' }}>⏳</div>}>
      <ThankYouContent />
    </Suspense>
  );
}

'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/AppIcon';

export default function CartError({ error, reset }) {
  useEffect(() => {
    console.error('Cart page caught error:', error);
    // Automatic transparent self-recovery
    const timer = setTimeout(() => {
      try { reset(); } catch { window.location.reload(); }
    }, 1200);
    return () => clearTimeout(timer);
  }, [error, reset]);

  return (
    <div style={{
      minHeight: '70vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem calc(100px + env(safe-area-inset-bottom, 20px))',
      background: 'var(--bg-secondary)',
    }}>
      <div style={{
        maxWidth: 440,
        width: '100%',
        background: 'var(--bg-card)',
        borderRadius: '24px',
        border: '1px solid var(--border)',
        padding: '2.5rem 1.75rem',
        textAlign: 'center',
        boxShadow: 'var(--shadow-md)',
      }}>
        <div style={{
          width: 64,
          height: 64,
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.12)',
          color: 'var(--orange)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1.25rem',
        }}>
          <AppIcon name="cart" size={32} />
        </div>
        <h2 style={{ fontSize: '1.3rem', fontWeight: 900, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Cart Load Ho Raha Hai...
        </h2>
        <p style={{ fontSize: '0.88rem', color: 'var(--text-muted)', margin: '0 0 1.75rem', lineHeight: 1.5 }}>
          Cart items load karne me thodi samasya aayi. Dobara refresh karke try karein.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-orange"
            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 800, justifyContent: 'center' }}
          >
            🔄 Dobara Try Karein
          </button>
          <Link
            href="/"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.85rem', borderRadius: '12px', fontWeight: 700, justifyContent: 'center', textDecoration: 'none' }}
          >
            🏠 Home Par Wapas Jayein
          </Link>
        </div>
      </div>
    </div>
  );
}

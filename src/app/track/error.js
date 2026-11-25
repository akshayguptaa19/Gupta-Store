'use client';
import { useEffect } from 'react';
import Link from 'next/link';
import AppIcon from '@/components/AppIcon';

export default function TrackError({ error, reset }) {
  useEffect(() => {
    console.error('Track caught error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '65vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))',
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
          width: 60,
          height: 60,
          borderRadius: '50%',
          background: 'rgba(249, 115, 22, 0.12)',
          color: 'var(--orange)',
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginBottom: '1rem',
        }}>
          <AppIcon name="truck" size={28} />
        </div>
        <h2 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--text-primary)', margin: '0 0 0.5rem' }}>
          Tracking Info Load Nahi Ho Saki
        </h2>
        <p style={{ fontSize: '0.86rem', color: 'var(--text-muted)', margin: '0 0 1.5rem', lineHeight: 1.5 }}>
          Order details load karne me thodi der lag rahi hai. Dobara try karein:
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.65rem' }}>
          <button
            type="button"
            onClick={() => reset()}
            className="btn btn-orange"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, justifyContent: 'center' }}
          >
            🔄 Track Dobara Karein
          </button>
          <Link
            href="/orders"
            className="btn btn-secondary"
            style={{ width: '100%', padding: '0.75rem', borderRadius: '12px', fontWeight: 700, justifyContent: 'center', textDecoration: 'none' }}
          >
            📦 My Orders Dekhein
          </Link>
        </div>
      </div>
    </div>
  );
}

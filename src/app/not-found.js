import Link from 'next/link';
import AppIcon from '@/components/AppIcon';

export const metadata = {
  title: '404 - Page Nahi Mila | Gupta General Store',
  description: 'Aap jo page dhoondh rahe hain wo uplabdh nahi hai. Gupta Store par stationery aur school supplies explore karein.',
};

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: '80vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '2.5rem 1.5rem',
        background: 'var(--bg-secondary)',
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: '100%',
          background: 'var(--bg-card)',
          borderRadius: '24px',
          border: '1px solid var(--border)',
          boxShadow: 'var(--shadow-md)',
          padding: '3rem 2rem',
          textAlign: 'center',
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
            background: 'rgba(249, 115, 22, 0.1)',
            color: 'var(--orange)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '2.2rem',
            fontWeight: 900,
            fontFamily: 'var(--font-display)',
          }}
        >
          404
        </div>

        <h1
          style={{
            fontFamily: 'var(--font-display)',
            fontSize: '1.65rem',
            fontWeight: 800,
            color: 'var(--text-primary)',
            margin: 0,
          }}
        >
          Page Nahi Mila
        </h1>

        <p
          style={{
            fontSize: '0.92rem',
            color: 'var(--text-muted)',
            lineHeight: 1.6,
            margin: 0,
            maxWidth: 420,
          }}
        >
          Lagta hai aap galat link par aa gaye hain ya page hata diya gaya hai. Chinta na karein, Gupta Store par Bakani ki best stationery aur school supplies uplabdh hain!
        </p>

        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '0.65rem',
            width: '100%',
            maxWidth: 320,
            marginTop: '0.5rem',
          }}
        >
          <Link
            href="/"
            className="btn btn-orange"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.85rem 1.5rem',
              borderRadius: '999px',
              fontSize: '0.95rem',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 4px 14px rgba(249, 115, 22, 0.35)',
            }}
          >
            <AppIcon name="shop" size={18} />
            <span>Gupta Store Home Par Jaayein</span>
          </Link>

          <Link
            href="/track"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.75rem 1.5rem',
              borderRadius: '999px',
              background: 'var(--bg-secondary)',
              color: 'var(--text-primary)',
              border: '1.5px solid var(--border)',
              fontSize: '0.88rem',
              fontWeight: 700,
              textDecoration: 'none',
              transition: 'var(--transition)',
            }}
          >
            <AppIcon name="truck" size={17} />
            <span>Track Live Order</span>
          </Link>

          <Link
            href="/contact"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              padding: '0.6rem 1.2rem',
              color: 'var(--text-muted)',
              fontSize: '0.82rem',
              fontWeight: 600,
              textDecoration: 'none',
            }}
          >
            <AppIcon name="phone" size={14} />
            <span>Need Help? Contact Store Manager</span>
          </Link>
        </div>
      </div>
    </div>
  );
}


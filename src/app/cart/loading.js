export default function CartLoading() {
  return (
    <div style={{ maxWidth: 1050, margin: '0 auto', padding: '1.25rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))' }}>
      {/* Top Header Skeleton */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
        <div style={{ width: 140, height: 26, background: 'var(--border)', borderRadius: 8 }} />
        <div style={{ width: 80, height: 28, background: 'var(--border)', borderRadius: 999 }} />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.25rem' }}>
        {/* Cart Items List Skeleton */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.85rem' }}>
          {[1, 2].map(n => (
            <div
              key={n}
              style={{
                background: 'var(--bg-card)',
                border: '1px solid var(--border)',
                borderRadius: 18,
                padding: '1rem',
                display: 'flex',
                gap: '0.85rem',
                alignItems: 'center',
              }}
            >
              <div style={{ width: 68, height: 68, background: 'var(--border)', borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '75%', height: 16, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: '40%', height: 14, background: 'var(--border)', borderRadius: 6, marginBottom: 10 }} />
                <div style={{ width: 80, height: 28, background: 'var(--border)', borderRadius: 8 }} />
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary Box Skeleton */}
        <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', height: 240, display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ width: 120, height: 20, background: 'var(--border)', borderRadius: 6 }} />
          <div style={{ width: '100%', height: 14, background: 'var(--border)', borderRadius: 6 }} />
          <div style={{ width: '100%', height: 14, background: 'var(--border)', borderRadius: 6 }} />
          <div style={{ width: '100%', height: 44, background: 'var(--border)', borderRadius: 12, marginTop: 'auto' }} />
        </div>
      </div>
    </div>
  );
}

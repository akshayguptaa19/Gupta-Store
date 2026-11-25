export default function OrdersLoading() {
  return (
    <div className="orders-page-wrapper" style={{ padding: '1.25rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))', maxWidth: 880, margin: '0 auto' }}>
      {/* Top Header Skeleton */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
        <div>
          <div style={{ width: 100, height: 14, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: 140, height: 26, background: 'var(--border)', borderRadius: 8 }} />
        </div>
        <div style={{ width: 105, height: 38, background: 'var(--border)', borderRadius: 12 }} />
      </div>

      {/* Search & Tabs Card Skeleton */}
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 18, padding: '1rem', marginBottom: '1.25rem' }}>
        <div style={{ width: '100%', height: 42, background: 'var(--bg-secondary)', borderRadius: 12, marginBottom: '0.85rem' }} />
        <div style={{ display: 'flex', gap: '0.5rem', overflow: 'hidden' }}>
          {[90, 80, 95, 90].map((w, i) => (
            <div key={i} style={{ width: w, height: 34, background: 'var(--bg-secondary)', borderRadius: 999, flexShrink: 0 }} />
          ))}
        </div>
      </div>

      {/* Orders Cards Skeleton */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        {[1, 2].map((n) => (
          <div
            key={n}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 20,
              padding: '1.25rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '1rem',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ width: 130, height: 20, background: 'var(--border)', borderRadius: 6 }} />
              <div style={{ width: 90, height: 24, background: 'var(--border)', borderRadius: 999 }} />
            </div>
            <div style={{ display: 'flex', gap: '0.85rem', alignItems: 'center' }}>
              <div style={{ width: 56, height: 56, background: 'var(--border)', borderRadius: 12, flexShrink: 0 }} />
              <div style={{ flex: 1 }}>
                <div style={{ width: '70%', height: 16, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
                <div style={{ width: '40%', height: 14, background: 'var(--border)', borderRadius: 6 }} />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

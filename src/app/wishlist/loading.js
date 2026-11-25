export default function WishlistLoading() {
  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', padding: '1.25rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <div style={{ width: 120, height: 14, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
        <div style={{ width: 160, height: 28, background: 'var(--border)', borderRadius: 8 }} />
      </div>

      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
        gap: '0.85rem',
      }}>
        {[1, 2, 3, 4].map(n => (
          <div
            key={n}
            style={{
              background: 'var(--bg-card)',
              border: '1px solid var(--border)',
              borderRadius: 16,
              padding: '0.85rem',
              display: 'flex',
              flexDirection: 'column',
              gap: '0.65rem',
            }}
          >
            <div style={{ width: '100%', height: 140, background: 'var(--bg-secondary)', borderRadius: 12 }} />
            <div style={{ width: '85%', height: 16, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ width: '50%', height: 18, background: 'var(--border)', borderRadius: 6 }} />
            <div style={{ width: '100%', height: 36, background: 'var(--border)', borderRadius: 10, marginTop: 'auto' }} />
          </div>
        ))}
      </div>
    </div>
  );
}

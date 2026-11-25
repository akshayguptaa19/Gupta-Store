export default function TrackLoading() {
  return (
    <div style={{ maxWidth: 680, margin: '0 auto', padding: '1.5rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem' }}>
        <div style={{ width: 130, height: 18, background: 'var(--border)', borderRadius: 6, marginBottom: 12 }} />
        <div style={{ width: '100%', height: 44, background: 'var(--bg-secondary)', borderRadius: 12 }} />
      </div>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--border)', flexShrink: 0 }} />
            <div style={{ flex: 1 }}>
              <div style={{ width: '50%', height: 16, background: 'var(--border)', borderRadius: 6, marginBottom: 6 }} />
              <div style={{ width: '30%', height: 12, background: 'var(--border)', borderRadius: 6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

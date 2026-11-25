export default function ProfileLoading() {
  return (
    <div style={{ maxWidth: 720, margin: '0 auto', padding: '1.25rem 1rem calc(100px + env(safe-area-inset-bottom, 24px))' }}>
      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', marginBottom: '1.25rem', display: 'flex', gap: '1rem', alignItems: 'center' }}>
        <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--border)' }} />
        <div style={{ flex: 1 }}>
          <div style={{ width: 140, height: 22, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
          <div style={{ width: 180, height: 14, background: 'var(--border)', borderRadius: 6 }} />
        </div>
      </div>

      <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 20, padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
        {[1, 2, 3].map(n => (
          <div key={n}>
            <div style={{ width: 90, height: 14, background: 'var(--border)', borderRadius: 6, marginBottom: 8 }} />
            <div style={{ width: '100%', height: 44, background: 'var(--bg-secondary)', borderRadius: 12 }} />
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AuthLoading() {
  return (
    <div style={{ minHeight: '75vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: 420, width: '100%', background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 24, padding: '2rem 1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ width: 120, height: 24, background: 'var(--border)', borderRadius: 8, margin: '0 auto 0.5rem' }} />
        <div style={{ width: '100%', height: 46, background: 'var(--bg-secondary)', borderRadius: 12 }} />
        <div style={{ width: '100%', height: 46, background: 'var(--bg-secondary)', borderRadius: 12 }} />
        <div style={{ width: '100%', height: 46, background: 'var(--border)', borderRadius: 12, marginTop: '0.5rem' }} />
      </div>
    </div>
  );
}

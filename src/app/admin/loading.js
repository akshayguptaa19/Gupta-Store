export default function AdminLoading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-secondary)', padding: '0 0 calc(90px + env(safe-area-inset-bottom, 24px))' }}>
      {/* Top Bar Skeleton */}
      <div style={{ height: 56, background: '#0f172a', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
          <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10 }} />
          <div style={{ width: 120, height: 18, background: 'rgba(255,255,255,0.15)', borderRadius: 6 }} />
        </div>
        <div style={{ width: 36, height: 36, background: 'rgba(255,255,255,0.15)', borderRadius: 10 }} />
      </div>

      {/* Greeting Skeleton */}
      <div style={{ padding: '1rem' }}>
        <div style={{ width: 150, height: 22, background: 'var(--border)', borderRadius: 6, marginBottom: 6 }} />
        <div style={{ width: 100, height: 14, background: 'var(--border)', borderRadius: 6 }} />
      </div>

      {/* 2-Column KPI Skeleton */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.65rem', padding: '0 1rem', marginBottom: '1.25rem' }}>
        {[1, 2, 3, 4].map(n => (
          <div key={n} style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 16, padding: '1rem', height: 86 }} />
        ))}
      </div>
    </div>
  );
}

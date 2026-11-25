export default function RootLoading() {
  return (
    <div style={{
      minHeight: '60vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      gap: '0.85rem',
      padding: '2rem 1rem',
      background: 'var(--bg-primary)',
    }}>
      <div style={{
        width: 38,
        height: 38,
        borderRadius: '50%',
        border: '3px solid var(--border)',
        borderTopColor: 'var(--orange)',
        animation: 'spin 0.75s linear infinite',
      }} />
      <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 700 }}>
        Gupta Store Load Ho Raha Hai...
      </span>
    </div>
  );
}

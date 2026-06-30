export function GroupStatsRowSkeleton() {
  return (
    <div className="grupo-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <div key={i} className="skeleton" style={{ height: 96, borderRadius: 20, background: 'var(--bg-inset)' }} />
      ))}
    </div>
  );
}

export function GroupRecentPlaysSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {[0, 1, 2].map(i => (
        <div key={i} className="skeleton" style={{ height: 128, borderRadius: 20, background: 'var(--bg-inset)' }} />
      ))}
    </div>
  );
}

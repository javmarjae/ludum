export function TrackerSkeleton() {
  return (
    <div style={{ padding: '32px clamp(16px,4vw,32px) 80px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div className="skeleton" style={{ height: 40, width: 220, borderRadius: 10, background: 'var(--bg-inset)' }} />
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 14 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 84, borderRadius: 16, background: 'var(--bg-inset)' }} />
        ))}
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        {[0, 1, 2, 3].map(i => (
          <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16, background: 'var(--bg-inset)' }} />
        ))}
      </div>
    </div>
  );
}

function ScrollRowSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="scroll-row" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} style={{ flexShrink: 0, width: 84 }}>
          <div className="skeleton" style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--bg-inset)' }} />
        </div>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <>
      <div className="p-main">
        <div style={{ display: 'flex', gap: 10, marginTop: 24 }}>
          <div className="skeleton" style={{ height: 38, width: 160, borderRadius: 999, background: 'var(--bg-inset)' }} />
          <div className="skeleton" style={{ height: 38, width: 160, borderRadius: 999, background: 'var(--bg-inset)' }} />
        </div>
        <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div className="skeleton" style={{ height: 20, width: 180, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 24 }} />
          <ScrollRowSkeleton />
        </section>
      </div>
      <div className="p-aside">
        <div className="skeleton" style={{ height: 200, borderRadius: 20, background: 'var(--bg-inset)' }} />
      </div>
    </>
  );
}

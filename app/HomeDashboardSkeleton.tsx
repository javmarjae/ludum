function SkeletonRow({ title, circles = true }: { title: string; circles?: boolean }) {
  return (
    <section>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.015em' }}>{title}</h2>
        <span style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-4)', lineHeight: 1 }}>→</span>
      </div>
      <div className="h-scroll">
        {[0, 1, 2, 3, 4, 5].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, flexShrink: 0, width: circles ? 104 : 128 }}>
            <div
              className="skeleton"
              style={circles
                ? { width: 88, height: 88, borderRadius: '50%', background: 'var(--bg-inset)' }
                : { width: 128, height: 165, borderRadius: 14, background: 'var(--bg-inset)' }}
            />
            <div className="skeleton" style={{ height: 11, width: circles ? 70 : 100, borderRadius: 4, background: 'var(--bg-inset)' }} />
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeDashboardSkeleton() {
  return (
    <>
      <SkeletonRow title="Explora tus juegos" />
      <SkeletonRow title="Tus partidas" circles={false} />
    </>
  );
}

function SkeletonSection({ title }: { title: string }) {
  return (
    <section style={{ marginBottom: 56 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
        <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{title}</h2>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {[0, 1, 2].map(i => (
          <div key={i} className="skeleton" style={{ height: 76, borderRadius: 16, background: 'var(--bg-inset)' }} />
        ))}
      </div>
    </section>
  );
}

export function GruposSkeleton() {
  return (
    <>
      <SkeletonSection title="Mis Grupos" />
      <SkeletonSection title="Comunidades" />
      <SkeletonSection title="Organizaciones" />
    </>
  );
}

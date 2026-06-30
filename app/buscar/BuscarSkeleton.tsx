/* Esqueleto del buscador. Reutilizado por loading.tsx (navegación) y por el
   Suspense de page.tsx (streaming mientras se resuelven las consultas). */

function SideCardSkeleton() {
  return (
    <div style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
      <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ height: 12, width: '85%', borderRadius: 5, background: 'var(--bg-inset)', marginBottom: 6 }} className="skeleton" />
        <div style={{ height: 10, width: '40%', borderRadius: 4, background: 'var(--bg-inset)' }} className="skeleton" />
      </div>
    </div>
  );
}

function SideColumnSkeleton({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
        <span style={{ fontSize: 18 }}>{icon}</span>
        <div>
          <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>{title}</p>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 1 }}>{subtitle}</p>
        </div>
      </div>
      <div>
        {[0, 1, 2, 3, 4, 5].map((i) => <SideCardSkeleton key={i} />)}
      </div>
    </>
  );
}

export function BuscarSkeleton() {
  return (
    <div className="buscar-3col">
      {/* Izquierda: Novedades */}
      <aside className="buscar-col-left buscar-side-sticky">
        <SideColumnSkeleton icon="⭐" title="Novedades" subtitle="Últimos juegos publicados" />
      </aside>

      {/* Centro: búsqueda */}
      <div className="buscar-col-center">
        <div style={{ height: 52, borderRadius: 14, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }} className="skeleton" />
        <div className="buscar-quick-card">
          <div style={{ height: 18, width: 160, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 18 }} className="skeleton" />
          <div className="buscar-quick-grid">
            {[0, 1, 2, 3].map((c) => (
              <div key={c}>
                <div style={{ height: 10, width: '70%', borderRadius: 4, background: 'var(--bg-inset)', marginBottom: 10 }} className="skeleton" />
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {[0, 1, 2, 3].map((i) => (
                    <div key={i} style={{ height: 34, borderRadius: 9, background: 'var(--bg-inset)' }} className="skeleton" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
        <div>
          <div style={{ height: 16, width: 200, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 14 }} className="skeleton" />
          <div className="h-scroll">
            {[0, 1, 2, 3, 4].map((i) => (
              <div key={i} style={{ flexShrink: 0 }}>
                <div style={{ width: 160, height: 160, borderRadius: 12, background: 'var(--bg-inset)' }} className="skeleton" />
                <div style={{ height: 12, width: 120, borderRadius: 5, background: 'var(--bg-inset)', marginTop: 8 }} className="skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Derecha: Mejor valorados */}
      <aside className="buscar-col-right buscar-side-sticky">
        <SideColumnSkeleton icon="🏆" title="Mejor valorados" subtitle="Los clásicos que nunca fallan" />
      </aside>
    </div>
  );
}

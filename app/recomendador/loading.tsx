export default function Loading() {
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header — texto real para que Chrome dispare FCP inmediatamente */}
      <div style={{ padding: '32px clamp(20px, 4vw, 56px) 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Recomendador
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            Encuentra el juego perfecto para tu próxima partida.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
          <div style={{ width: 110, height: 34, borderRadius: 10, background: 'var(--bg-inset)' }} className="skeleton" />
          <div style={{ width: 150, height: 34, borderRadius: 10, background: 'var(--bg-inset)' }} className="skeleton" />
        </div>
      </div>

      <div style={{ padding: '28px clamp(20px, 4vw, 56px) 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Sección 1 — grupo selector */}
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
            1. ¿Quién va a jugar?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
            Selecciona el grupo o crea una partida nueva
          </p>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {[120, 100, 135].map((w, i) => (
              <div key={i} style={{ width: w, height: 36, borderRadius: 10, background: 'var(--bg-inset)' }} className="skeleton" />
            ))}
          </div>
        </section>

        {/* Skeleton de recomendaciones */}
        <div className="recom-skeleton-cols">
          {/* Columna izquierda */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
                2. Nuestra recomendación para vosotros
              </h2>
              <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ padding: '20px 20px 24px' }}>
                  <div style={{ height: 28, width: 130, borderRadius: 8, background: 'var(--bg-inset)', marginBottom: 20 }} className="skeleton" />
                  <div style={{ display: 'flex', gap: 20 }}>
                    <div style={{ width: 120, height: 150, borderRadius: 12, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div style={{ height: 32, width: '70%', borderRadius: 8, background: 'var(--bg-inset)' }} className="skeleton" />
                      <div style={{ height: 14, width: '90%', borderRadius: 6, background: 'var(--bg-inset)' }} className="skeleton" />
                      <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'var(--bg-inset)' }} className="skeleton" />
                    </div>
                    <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
                  </div>
                </div>
                <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg-inset)' }}>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                    {[0, 1, 2, 3].map((i) => (
                      <div key={i} style={{ height: 16, borderRadius: 6, background: 'var(--border)' }} className="skeleton" />
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div style={{ borderRadius: 16, padding: '18px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ height: 16, width: 180, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 16 }} className="skeleton" />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                    <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-inset)' }} className="skeleton" />
                    <div style={{ height: 12, width: 60, borderRadius: 4, background: 'var(--bg-inset)' }} className="skeleton" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Columna derecha */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ borderRadius: 20, padding: '18px 18px 12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ height: 16, width: 150, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 16 }} className="skeleton" />
              {[0, 1, 2].map((i) => (
                <div key={i}>
                  <div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'center' }}>
                    <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
                    <div style={{ flex: 1 }}>
                      <div style={{ height: 13, width: '80%', borderRadius: 5, background: 'var(--bg-inset)', marginBottom: 6 }} className="skeleton" />
                      <div style={{ height: 11, width: '50%', borderRadius: 4, background: 'var(--bg-inset)' }} className="skeleton" />
                    </div>
                    <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-inset)' }} className="skeleton" />
                  </div>
                  {i < 2 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

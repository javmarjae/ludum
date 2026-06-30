import { Nav } from '@/components/Nav';

// Skeleton instantáneo mientras se resuelven las recomendaciones (mejora el FCP
// percibido: la navegación deja de bloquearse hasta que llega la BD).
export default function Loading() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/recomendador', label: 'Cambiar preferencias' }} />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <div style={{ height: 36, width: 260, borderRadius: 10, background: 'var(--bg-inset)', marginBottom: 10 }} className="skeleton" />
          <div style={{ height: 16, width: 180, borderRadius: 6, background: 'var(--bg-inset)' }} className="skeleton" />
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} style={{ display: 'flex', gap: 16, alignItems: 'center', padding: 16, borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ width: 64, height: 80, borderRadius: 10, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
              <div style={{ flex: 1 }}>
                <div style={{ height: 18, width: '60%', borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 10 }} className="skeleton" />
                <div style={{ height: 13, width: '40%', borderRadius: 5, background: 'var(--bg-inset)' }} className="skeleton" />
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}

import { BuscarSkeleton } from './BuscarSkeleton';

export default function Loading() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <main className="buscar-content">
        {/* Cabecera real para que Chrome dispare FCP inmediatamente */}
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Buscador
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            Encuentra tu próximo juego favorito.
          </p>
        </div>
        <BuscarSkeleton />
      </main>
    </div>
  );
}

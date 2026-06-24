import Link from 'next/link';

export function TrackerFeatureCard() {
  return (
    <Link href="/grupos" style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
      <div
        className="hover-lift"
        style={{
          borderRadius: 12, padding: 28, height: '100%', boxSizing: 'border-box',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #89BA86 0%, #3E5E3B 100%)',
          boxShadow: '0 2px 8px rgba(62,94,59,0.30)',
        }}>
          <img src="/icons/tracker.svg" alt="" aria-hidden="true" style={{ width: 28, height: 28 }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, color: 'var(--text)', letterSpacing: '-0.01em' }}>Tracker</h2>
        <p style={{ marginBottom: 20, lineHeight: 1.6, fontWeight: 500, color: 'var(--text-3)', fontSize: 14 }}>
          Registra partidas y sigue las estadísticas de tu grupo: ranking, juego más jugado, win rate por jugador.
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
          Ver mis grupos →
        </span>
      </div>
    </Link>
  );
}

export function RecommenderFeatureCard() {
  return (
    <Link href="/recomendador" style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
      <div
        className="hover-lift"
        style={{
          borderRadius: 12, padding: 28, height: '100%', boxSizing: 'border-box',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', cursor: 'pointer',
        }}
      >
        <div style={{
          width: 48, height: 48, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 20,
          background: 'linear-gradient(135deg, #89BA86 0%, #3E5E3B 100%)',
          boxShadow: '0 2px 8px rgba(62,94,59,0.30)',
        }}>
          <img src="/icons/recomendador.svg" alt="" aria-hidden="true" style={{ width: 28, height: 28 }} />
        </div>
        <h2 style={{ fontSize: 20, fontWeight: 800, marginBottom: 10, color: 'var(--text)', letterSpacing: '-0.01em' }}>Recomendador</h2>
        <p style={{ marginBottom: 20, lineHeight: 1.6, fontWeight: 500, color: 'var(--text-3)', fontSize: 14 }}>
          Cuéntanos cuántos jugáis, cuánto tiempo tenéis y qué complejidad preferís. Te sugerimos los mejores juegos para vuestra sesión.
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
          Descubrir juegos →
        </span>
      </div>
    </Link>
  );
}

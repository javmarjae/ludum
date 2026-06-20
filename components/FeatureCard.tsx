'use client';

import Link from 'next/link';

export function RecommenderFeatureCard() {
  return (
    <Link href="/recomendador" style={{ display: 'block', textDecoration: 'none', height: '100%' }}>
      <div
        style={{
          borderRadius: 40, padding: 32, height: '100%', boxSizing: 'border-box',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
          transition: 'transform 0.2s, box-shadow 0.2s', cursor: 'pointer',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.02)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card-hover)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)';
          (e.currentTarget as HTMLDivElement).style.boxShadow = 'var(--shadow-card)';
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, marginBottom: 24,
          background: 'linear-gradient(180deg, #89BA86 0%, #3E5E3B 100%)',
          boxShadow: '0 4px 20px rgba(62,94,59,0.35), 0 1px 3px rgba(62,94,59,0.5)',
        }}>
          🎲
        </div>
        <h2 style={{ fontSize: 22, fontWeight: 800, marginBottom: 12, color: 'var(--text)', letterSpacing: '-0.01em' }}>Recomendador</h2>
        <p style={{ marginBottom: 24, lineHeight: 1.6, fontWeight: 500, color: 'var(--text-3)', fontSize: 15 }}>
          Cuéntanos cuántos jugáis, cuánto tiempo tenéis y qué complejidad preferís. Te sugerimos los mejores juegos para vuestra sesión.
        </p>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 14, fontWeight: 700, color: 'var(--brand)' }}>
          Descubrir juegos →
        </span>
      </div>
    </Link>
  );
}

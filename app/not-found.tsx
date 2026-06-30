import Link from 'next/link';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Página no encontrada',
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ fontSize: 64, marginBottom: 12 }}>🎲</p>
        <h1 style={{ fontSize: 'clamp(26px, 5vw, 36px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
          Página no encontrada
        </h1>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 28 }}>
          La página que buscas no existe o se ha movido. Vuelve al inicio o busca tu próximo juego.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}>
            Ir al inicio
          </Link>
          <Link href="/buscar" style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, color: 'var(--text-2)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', textDecoration: 'none' }}>
            Buscar juegos →
          </Link>
        </div>
      </div>
    </div>
  );
}

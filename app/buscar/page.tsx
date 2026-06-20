import { Nav, NavButton } from '@/components/Nav';
import { SearchClient } from './SearchClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Buscar juegos — Ludum',
  description: 'Busca entre más de 138.000 juegos de mesa.',
};

export default function BuscarPage() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav
        back={{ href: '/', label: 'Inicio' }}
        right={<NavButton href="/recomendador" variant="brand">Recomendador</NavButton>}
      />
      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
            Buscar juegos
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            +138.000 juegos de mesa
          </p>
        </div>
        <SearchClient />
      </main>
    </div>
  );
}

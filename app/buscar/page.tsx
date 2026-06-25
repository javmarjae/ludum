import { AppNav } from '@/components/AppNav';
import { SearchClient } from './SearchClient';
import { getTrendingGames, getTopRatedGames, getNewGames } from '@/lib/cached-queries';
import type { Metadata } from 'next';

export const revalidate = 1800;

export const metadata: Metadata = {
  title: 'Buscador',
  description: 'Busca entre más de 138.000 juegos de mesa.',
};

export default async function BuscarPage() {
  const [mostPlayedGames, topRatedGames, newGames] = await Promise.all([
    getTrendingGames(),
    getTopRatedGames(),
    getNewGames(),
  ]);

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <AppNav />
      <main className="buscar-content">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Buscador
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            Encuentra tu próximo juego favorito.
          </p>
        </div>
        <SearchClient
          mostPlayedGames={mostPlayedGames}
          topRatedGames={topRatedGames}
          newGames={newGames}
        />
      </main>
    </div>
  );
}

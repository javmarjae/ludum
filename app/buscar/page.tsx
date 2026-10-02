import { Suspense } from 'react';
import { AppNav } from '@/components/AppNav';
import { SearchClient } from './SearchClient';
import { BuscarSkeleton } from './BuscarSkeleton';
import { getTrendingGames, getTopRatedGames, getNewGames, getSearchTaxonomyOptions } from '@/lib/cached-queries';
import type { Metadata } from 'next';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = {
  title: 'Buscador',
  description: 'Busca entre más de 138.000 juegos de mesa.',
};

// Carga de datos en streaming: la cabecera y el esqueleto aparecen al instante
// y las columnas se rellenan en cuanto resuelven las consultas (cacheadas).
async function SearchData() {
  const [mostPlayedGames, topRatedGames, newGames, taxonomyOptions] = await Promise.all([
    getTrendingGames(),
    getTopRatedGames(),
    getNewGames(),
    getSearchTaxonomyOptions(),
  ]);

  return (
    <SearchClient
      mostPlayedGames={mostPlayedGames}
      topRatedGames={topRatedGames}
      newGames={newGames}
      mechanicOptions={taxonomyOptions.mechanics}
      categoryOptions={taxonomyOptions.categories}
    />
  );
}

export default function BuscarPage() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <AppNav />
      <div className="buscar-content">
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Buscador
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            Encuentra tu próximo juego favorito.
          </p>
        </div>
        <Suspense fallback={<BuscarSkeleton />}>
          <SearchData />
        </Suspense>
      </div>
    </div>
  );
}

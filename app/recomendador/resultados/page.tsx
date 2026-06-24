import { getRecommendations, type RecommenderFilters, type GameResult } from '@/lib/recommender';
import { GameCard } from '@/components/GameCard';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recomendaciones de juegos de mesa',
  description: 'Juegos de mesa recomendados según tus preferencias: número de jugadores, duración y complejidad.',
  openGraph: {
    title: 'Recomendaciones de juegos de mesa',
    description: 'Juegos de mesa recomendados según tus preferencias.',
    type: 'website',
  },
};

interface Props {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}

function buildFilterSummary(filters: RecommenderFilters): string {
  const parts: string[] = [];
  if (filters.players) {
    const l: Record<string, string> = { '1': 'solo', '2': '2 jugadores', '3': '3–4 jugadores', '5': '5+ jugadores' };
    parts.push(l[String(filters.players)] ?? `${filters.players} jugadores`);
  }
  if (filters.duration) {
    const l: Record<string, string> = { corta: 'partidas rápidas', media: 'duración media', larga: 'partidas largas', 'muy-larga': 'partidas épicas' };
    parts.push(l[filters.duration]);
  }
  if (filters.complexity) {
    const l: Record<string, string> = { ligero: 'fácil', medio: 'complejidad media', complejo: 'alta complejidad' };
    parts.push(l[filters.complexity]);
  }
  if (filters.era && filters.era !== 'cualquiera') parts.push(filters.era === 'moderno' ? 'juegos modernos' : 'juegos clásicos');
  return parts.length > 0 ? parts.join(' · ') : 'todos los juegos';
}

export default async function ResultadosPage({ searchParams }: Props) {
  const params = await searchParams;
  const filters: RecommenderFilters = {
    players: params.players ? parseInt(params.players) : undefined,
    duration: params.duration as RecommenderFilters['duration'],
    complexity: params.complexity as RecommenderFilters['complexity'],
    era: (params.era as RecommenderFilters['era']) ?? 'cualquiera',
  };

  let games: GameResult[] = [];
  let error = false;
  try { games = await getRecommendations(filters); } catch { error = true; }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/recomendador', label: 'Cambiar preferencias' }} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
            {games.length > 0 ? `${games.length} recomendaciones` : 'Sin resultados'}
          </h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{buildFilterSummary(filters)}</p>
        </div>

        {error && (
          <div style={{ borderRadius: 16, padding: '12px 16px', marginBottom: 24, background: 'var(--brand-tint)', border: '1px solid rgba(62,94,59,0.2)', color: 'var(--brand)', fontSize: 14, fontWeight: 600 }}>
            Error al cargar los juegos. Inténtalo de nuevo.
          </div>
        )}

        {!error && games.length === 0 && (
          <div style={{ borderRadius: 32, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 48, marginBottom: 16 }}>🎲</p>
            <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Sin resultados</p>
            <p style={{ fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>No encontramos juegos con esas preferencias.</p>
            <Link href="/recomendador" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
              fontWeight: 700, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Probar de nuevo
            </Link>
          </div>
        )}

        {!error && games.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {games.map((game, i) => <GameCard key={game.bgg_id} game={game} index={i} />)}
          </div>
        )}

        <p style={{ textAlign: 'center', fontSize: 12, marginTop: 48, paddingTop: 24, fontWeight: 500, borderTop: '1px solid var(--border)', color: 'var(--text-4)' }}>
          Datos de{' '}
          <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 700 }}>BoardGameGeek</a>
        </p>
      </main>
    </div>
  );
}

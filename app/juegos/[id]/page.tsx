import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import { Nav } from '@/components/Nav';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }>; }

async function getGame(bggId: number) {
  const supabase = await createClient();
  const { data } = await supabase
    .from('games')
    .select('id, bgg_id, name, year_published, bgg_rank, bgg_rating, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description')
    .eq('bgg_id', bggId)
    .single();
  return data ?? null;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(parseInt(id));
  if (!game) return { title: 'Juego no encontrado — Ludum' };
  const desc = [
    game.min_players && game.max_players ? `${game.min_players}–${game.max_players} jugadores` : null,
    game.min_playtime ? `${game.min_playtime} min` : null,
    game.complexity ? `Complejidad ${game.complexity.toFixed(1)}/5` : null,
    game.bgg_rating ? `BGG ${game.bgg_rating.toFixed(1)}/10` : null,
  ].filter(Boolean).join(' · ');
  return {
    title: `${game.name} — Ludum`,
    description: desc || `Ficha de ${game.name} en Ludum.`,
    openGraph: { title: game.name, images: game.image_url ? [game.image_url] : [] },
  };
}

function Tag({ text, accent }: { text: string; accent?: boolean }) {
  return (
    <span style={{
      display: 'inline-block', padding: '5px 12px', borderRadius: 10,
      fontSize: 12, fontWeight: 700, whiteSpace: 'nowrap',
      background: accent ? 'var(--brand-tint)' : 'var(--bg-inset)',
      color: accent ? 'var(--brand)' : 'var(--text-3)',
      border: accent ? '1px solid rgba(62,94,59,0.2)' : 'none',
    }}>
      {text}
    </span>
  );
}

export default async function GamePage({ params }: Props) {
  const { id } = await params;
  const bggId = parseInt(id);
  if (isNaN(bggId)) notFound();
  const game = await getGame(bggId);
  if (!game) notFound();

  const playersText = game.min_players && game.max_players
    ? game.min_players === game.max_players
      ? `${game.min_players} jugadores`
      : `${game.min_players}–${game.max_players} jugadores`
    : null;
  const playtimeText = game.min_playtime
    ? game.max_playtime && game.min_playtime !== game.max_playtime
      ? `${game.min_playtime}–${game.max_playtime} min`
      : `${game.min_playtime} min`
    : null;
  const complexityLabel = game.complexity
    ? game.complexity < 2 ? 'Fácil' : game.complexity < 3 ? 'Medio' : game.complexity < 4 ? 'Complejo' : 'Experto'
    : null;
  const ratingColor = game.bgg_rating
    ? game.bgg_rating >= 8 ? 'var(--forest)' : game.bgg_rating >= 7 ? '#b45309' : 'var(--text-3)'
    : 'var(--text-3)';

  const stats = [
    playersText   && { icon: '👥', label: 'Jugadores',    value: playersText },
    playtimeText  && { icon: '⏱️', label: 'Duración',     value: playtimeText },
    complexityLabel && game.complexity && { icon: '🧠', label: 'Complejidad', value: `${complexityLabel} · ${game.complexity.toFixed(1)}/5` },
    game.year_published && { icon: '📅', label: 'Año',    value: String(game.year_published) },
    game.bgg_rank && { icon: '🏆', label: 'Ranking BGG',  value: `#${game.bgg_rank}` },
  ].filter(Boolean) as { icon: string; label: string; value: string }[];

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/buscar', label: 'Buscar juegos' }} />

      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ borderRadius: 32, padding: 24, marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
            {game.image_url ? (
              <img src={game.image_url} alt={game.name} style={{ width: 120, height: 120, borderRadius: 20, objectFit: 'cover', flexShrink: 0, boxShadow: '0 4px 16px rgba(58,55,47,0.12)' }} />
            ) : (
              <div style={{ width: 120, height: 120, borderRadius: 20, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, flexShrink: 0 }}>🎲</div>
            )}
            <div style={{ flex: 1, minWidth: 0 }}>
              <h1 style={{ fontSize: 22, fontWeight: 800, lineHeight: 1.2, marginBottom: 6, color: 'var(--text)', letterSpacing: '-0.01em' }}>{game.name}</h1>

              {/* Categories */}
              {game.categories && game.categories.length > 0 && (
                <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 12 }}>
                  {game.categories.map(c => <Tag key={c} text={c} accent />)}
                </div>
              )}

              {/* Rating */}
              {game.bgg_rating && (
                <div style={{ display: 'flex', alignItems: 'baseline', gap: 4 }}>
                  <span style={{ fontSize: 36, fontWeight: 800, lineHeight: 1, color: ratingColor }}>{game.bgg_rating.toFixed(1)}</span>
                  <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>/10 BGG</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Stats grid */}
        {stats.length > 0 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: 10, marginBottom: 20 }}>
            {stats.map(s => (
              <div key={s.label} style={{ borderRadius: 20, padding: '14px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 18, marginBottom: 4 }}>{s.icon}</p>
                <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{s.value}</p>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginTop: 2 }}>{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* Mechanics */}
        {game.mechanics && game.mechanics.length > 0 && (
          <div style={{ borderRadius: 24, padding: '18px 20px', marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Mecánicas</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {game.mechanics.map(m => <Tag key={m} text={m} />)}
            </div>
          </div>
        )}

        {/* Description */}
        <div style={{ borderRadius: 24, padding: '18px 20px', marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</h2>
          {game.description ? (
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
              {game.description.length > 600 ? game.description.slice(0, 600) + '…' : game.description}
            </p>
          ) : (
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', fontStyle: 'italic' }}>
              Descripción no disponible aún — estamos enriqueciendo la base de datos.
            </p>
          )}
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <a
            href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
            target="_blank" rel="noopener noreferrer"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
              fontSize: 14, fontWeight: 700, color: 'white', background: 'var(--brand)',
              boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}
          >
            Ver en BGG →
          </a>
          <a
            href={`/recomendador`}
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 24px', borderRadius: 999,
              fontSize: 14, fontWeight: 700, color: 'var(--text)', background: 'var(--bg-card)',
              boxShadow: 'var(--shadow-btn)', textDecoration: 'none',
            }}
          >
            Más recomendaciones
          </a>
        </div>

        <p style={{ fontSize: 12, marginTop: 40, paddingTop: 24, textAlign: 'center', fontWeight: 500, borderTop: '1px solid var(--border)', color: 'var(--text-4)' }}>
          Datos de{' '}
          <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 700 }}>BoardGameGeek</a>
        </p>
      </main>
    </div>
  );
}

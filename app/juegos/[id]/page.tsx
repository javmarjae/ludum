import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { DescriptionCollapse } from './DescriptionCollapse';
import { CollectionButton } from './CollectionButton';
import { WishlistButton } from './WishlistButton';
import { StarRating } from './StarRating';
import { GameRatingProvider } from './GameRatingContext';
import { ExpansionBanner } from './ExpansionBanner';
import { GameRelatedLists } from './GameRelatedLists';
import { GamePlaysTab } from './GamePlaysTab';
import { cache, Suspense } from 'react';
import type { Metadata } from 'next';

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ tab?: string }>;
}

const getGame = cache(async (bggId: number) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('games')
    .select('id, bgg_id, name, year_published, bgg_rank, bgg_rating, num_ratings, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description, is_expansion, parent_bgg_id')
    .eq('bgg_id', bggId)
    .single();
  return data ?? null;
});

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const game = await getGame(parseInt(id));
  if (!game) return { title: 'Juego no encontrado' };

  const parts: string[] = [];
  if (game.min_players && game.max_players) {
    parts.push(game.min_players === game.max_players ? `${game.min_players} jugadores` : `${game.min_players}–${game.max_players} jugadores`);
  }
  if (game.min_playtime) parts.push(`${game.min_playtime} min`);
  if (game.year_published) parts.push(`${game.year_published}`);
  if (game.bgg_rank) parts.push(`#${game.bgg_rank} en BGG`);

  const description = parts.length
    ? `${game.name} — ${parts.join(' · ')}. Reseñas, partidas y recomendaciones en Ludum.`
    : `Descubre ${game.name}: reseñas, partidas y recomendaciones en Ludum.`;

  return {
    title: game.name,
    description,
    openGraph: {
      title: game.name,
      description,
      images: game.image_url ? [{ url: game.image_url, alt: game.name }] : [],
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: game.name,
      description,
      images: game.image_url ? [game.image_url] : [],
    },
    alternates: { canonical: `https://ludumgames.es/juegos/${game.bgg_id}` },
  };
}

export default async function GamePage({ params, searchParams }: Props) {
  const { id } = await params;
  const { tab } = await searchParams;
  // Detalles is the default tab
  const activeTab = tab === 'partidas' ? 'partidas' : 'detalles';

  const bggId = parseInt(id);
  if (isNaN(bggId)) notFound();

  const supabase = await createClient();
  const [game, { data: { user } }] = await Promise.all([
    getGame(bggId),
    supabase.auth.getUser(),
  ]);
  if (!game) notFound();

  const mechanics: string[] = (game as any).mechanics ?? [];
  const categories: string[] = (game as any).categories ?? [];
  const filterCol = mechanics.length > 0 ? 'mechanics' : 'categories';
  const filterArr = mechanics.length > 0 ? mechanics.slice(0, 5) : categories.slice(0, 5);

  const playersText = game.min_players && game.max_players
    ? game.min_players === game.max_players
      ? `${game.min_players} jugadores`
      : `De ${game.min_players} a ${game.max_players} Jugadores`
    : null;
  const maxP = (game.max_players as number | null) ?? (game.min_players as number | null) ?? 0;
  const playersIcon = maxP <= 1 ? '/icons/solo.svg' : maxP === 2 ? '/icons/pareja.svg' : maxP <= 4 ? '/icons/grupo.svg' : '/icons/pandilla.svg';
  const playtimeText = game.min_playtime
    ? game.max_playtime && game.min_playtime !== game.max_playtime
      ? `${game.min_playtime}-${game.max_playtime} minutos`
      : `${game.min_playtime} minutos`
    : null;
  const complexityLabel = game.complexity
    ? game.complexity < 2 ? 'Fácil' : game.complexity < 3 ? 'Medio' : game.complexity < 4 ? 'Complejo' : 'Experto'
    : null;

  const chipStyle: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '6px 14px', borderRadius: 999, fontSize: 13, fontWeight: 600,
    background: 'rgba(255,255,255,0.18)', color: 'white',
    backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
    border: '1px solid rgba(255,255,255,0.22)',
  };

  const tabLink: React.CSSProperties = {
    display: 'inline-flex', alignItems: 'center', gap: 6,
    padding: '8px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700,
    textDecoration: 'none',
  };

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'BoardGame',
    name: game.name,
    ...(game.year_published && { copyrightYear: game.year_published }),
    ...(game.min_players && { minPlayers: game.min_players }),
    ...(game.max_players && { maxPlayers: game.max_players }),
    ...(game.min_playtime && { timeRequired: `PT${game.min_playtime}M` }),
    ...(game.image_url && { image: game.image_url }),
    ...(game.description && { description: game.description.replace(/<[^>]+>/g, '').slice(0, 500) }),
    ...(game.bgg_rating && {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: game.bgg_rating.toFixed(1),
        bestRating: '10',
        worstRating: '1',
        ratingCount: (game as any).num_ratings ?? 1000,
      },
    }),
    url: `https://ludum.es/juegos/${game.bgg_id}`,
  };

  return (
    <GameRatingProvider gameId={game.id}>
    <div style={{ minHeight: '100vh', background: 'transparent' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <AppNav back={{ href: '/buscar', label: 'Buscar' }} />

      {/* ── Hero ─────────────────────────────────────── */}
      <div style={{ position: 'relative', height: 300, overflow: 'hidden' }}>
        {game.image_url ? (
          <Image src={game.image_url} alt="" aria-hidden fill sizes="100vw" style={{
            objectFit: 'cover', objectPosition: 'center',
            filter: 'blur(20px) saturate(1.4)',
            transform: 'scale(1.14)',
          }} />
        ) : (
          <div style={{ position: 'absolute', inset: 0, background: 'var(--olive)' }} />
        )}
        <div style={{
          position: 'absolute', inset: 0,
          background: 'linear-gradient(to bottom, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0.80) 100%)',
        }} />

        <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 2 }}>
          <CollectionButton gameId={game.id} />
        </div>

        {/* Portada + título anclados al fondo */}
        <div className="game-hero-inner">
          {game.image_url && (
            <Image
              src={game.image_url}
              alt={game.name}
              width={160}
              height={220}
              priority
              className="game-hero-cover"
            />
          )}
          <div style={{ flex: 1, minWidth: 0, paddingBottom: 4 }}>
            <h1 className="t-page-title" style={{
              color: 'white', lineHeight: 1.1,
              marginBottom: 4, letterSpacing: '-0.01em', textShadow: '0 2px 10px rgba(0,0,0,0.5)',
            }}>
              {game.name}
            </h1>
            {categories.length > 0 && (
              <p className="t-card-sub" style={{ color: 'rgba(255,255,255,0.72)', marginBottom: 10 }}>
                {categories.slice(0, 2).join(' · ')}
              </p>
            )}
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {playersText && (
                <span style={chipStyle}>
                  <img src={playersIcon} alt="" aria-hidden="true" style={{ width: 18, height: 18, filter: 'brightness(0) invert(1)', flexShrink: 0 }} />
                  {playersText}
                </span>
              )}
              {playtimeText && <span style={chipStyle}>⏱️ {playtimeText}</span>}
            </div>
          </div>
        </div>
      </div>

      {/* ── Tab bar ──────────────────────────────────── */}
      <div style={{
        display: 'flex', justifyContent: 'center',
        padding: '14px 24px', borderBottom: '1px solid var(--border)',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 20,
      }}>
        <div style={{ display: 'inline-flex', background: 'var(--bg-inset)', borderRadius: 999, padding: 3, gap: 2 }}>
          <Link href={`/juegos/${bggId}`} style={{
            ...tabLink,
            background: activeTab === 'detalles' ? 'var(--olive)' : 'transparent',
            color: activeTab === 'detalles' ? 'white' : 'var(--text-3)',
          }}>
            Detalles
          </Link>
          <Link href={`/juegos/${bggId}?tab=partidas`} style={{
            ...tabLink,
            background: activeTab === 'partidas' ? 'var(--olive)' : 'transparent',
            color: activeTab === 'partidas' ? 'white' : 'var(--text-3)',
          }}>
            Partidas
          </Link>
        </div>
      </div>

      {/* ── DETALLES ─────────────────────────────────── */}
      {activeTab === 'detalles' && (
        <main className="game-detail-main">

          {/* Expansion banner */}
          {(game as any).is_expansion && (
            <div style={{ marginBottom: 24 }}>
              {(game as any).parent_bgg_id ? (
                <Suspense fallback={<span className="t-card-sub skeleton">🧩 Expansión</span>}>
                  <ExpansionBanner parentBggId={(game as any).parent_bgg_id} />
                </Suspense>
              ) : (
                <span className="t-card-sub">🧩 Expansión</span>
              )}
            </div>
          )}

          {/* 3-column grid */}
          <div className="game-detail-cols">

            {/* LEFT: Portada + Lista de deseos */}
            <div>
              {game.image_url ? (
                <Image
                  src={game.image_url}
                  alt={game.name}
                  width={240}
                  height={320}
                  style={{
                    width: '100%', height: 'auto',
                    borderRadius: 20,
                    boxShadow: '0 12px 40px rgba(58,55,47,0.22)',
                    display: 'block',
                  }}
                />
              ) : (
                <div style={{
                  width: '100%', aspectRatio: '2/3', borderRadius: 16,
                  background: 'var(--bg-inset)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40,
                }}>🎲</div>
              )}
              {user && (
                <div style={{ marginTop: 12 }}>
                  <WishlistButton gameId={game.id} />
                </div>
              )}
            </div>

            {/* CENTER: Descripción + mecánicas */}
            <div>
              <h2 className="t-section-title" style={{ marginBottom: 16, letterSpacing: '-0.01em' }}>
                Descripción
              </h2>

              {game.description ? (
                <DescriptionCollapse text={game.description as string} />
              ) : (
                <p className="t-body" style={{ fontStyle: 'italic', lineHeight: 1.6 }}>
                  Descripción no disponible aún.
                </p>
              )}

              {/* Mecánicas */}
              {mechanics.length > 0 && (
                <div style={{ marginTop: 24 }}>
                  <p className="t-label" style={{ marginBottom: 12 }}>Mecánicas</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                    {mechanics.map((m: string) => (
                      <span key={m} style={{
                        display: 'inline-block', padding: '6px 14px', borderRadius: 10,
                        fontSize: 14, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)',
                        boxShadow: 'var(--shadow-btn)',
                      }}>
                        {m}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              <Suspense fallback={<div className="skeleton" style={{ height: 60, borderRadius: 10, marginTop: 32, background: 'var(--bg-inset)' }} />}>
                <GameRelatedLists
                  gameId={game.id}
                  bggId={game.bgg_id}
                  isExpansion={!!(game as any).is_expansion}
                  mechanics={mechanics}
                  categories={categories}
                />
              </Suspense>

              <a
                href={`https://boardgamegeek.com/boardgame/${game.bgg_id}`}
                target="_blank" rel="noopener noreferrer"
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8, marginTop: 28,
                  padding: '11px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                  color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
                  textDecoration: 'none',
                }}
              >
                Ver en BoardGameGeek →
              </a>
            </div>

            {/* RIGHT: Información */}
            <div className="game-detail-col-right">
              <h2 className="t-section-title" style={{ marginBottom: 20, letterSpacing: '-0.01em' }}>
                Información
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {game.year_published && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>📅</span>
                    <div>
                      <p className="t-label">Publicado</p>
                      <p className="t-meta">{game.year_published}</p>
                    </div>
                  </div>
                )}
                {playersText && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <img src={playersIcon} alt="" aria-hidden="true" style={{ width: 28, height: 28, flexShrink: 0 }} />
                    <div>
                      <p className="t-label">Jugadores</p>
                      <p className="t-meta">{playersText}</p>
                    </div>
                  </div>
                )}
                {game.min_playtime && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>⏱️</span>
                    <div>
                      <p className="t-label">Duración</p>
                      <p className="t-meta">
                        {game.max_playtime && game.min_playtime !== game.max_playtime
                          ? `${game.min_playtime}–${game.max_playtime} min`
                          : `${game.min_playtime} min`}
                      </p>
                    </div>
                  </div>
                )}
                {complexityLabel && game.complexity && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>🧠</span>
                    <div>
                      <p className="t-label">Complejidad</p>
                      <p className="t-meta">{complexityLabel} · {(game.complexity as number).toFixed(1)}/5</p>
                    </div>
                  </div>
                )}
                {game.bgg_rating && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>⭐</span>
                    <div>
                      <p className="t-label">Rating BGG</p>
                      <p className="t-meta">{(game.bgg_rating as number).toFixed(1)}/10</p>
                    </div>
                  </div>
                )}
                {game.bgg_rank && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0 }}>🏆</span>
                    <div>
                      <p className="t-label">Ranking BGG</p>
                      <p className="t-meta">#{game.bgg_rank}</p>
                    </div>
                  </div>
                )}
                {categories.length > 0 && (
                  <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                    <span style={{ fontSize: 24, flexShrink: 0, marginTop: 2 }}>🎭</span>
                    <div>
                      <p className="t-label" style={{ marginBottom: 8 }}>Categorías</p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                        {categories.map((c: string) => (
                          <span key={c} style={{
                            display: 'inline-block', padding: '4px 12px', borderRadius: 999,
                            fontSize: 14, fontWeight: 600,
                            background: 'var(--brand-tint)', color: 'var(--brand)',
                          }}>
                            {c}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Valoración del usuario */}
              {user && (
                <div style={{ marginTop: 24 }}>
                  <StarRating gameId={game.id} />
                </div>
              )}
            </div>
          </div>
        </main>
      )}

      {/* ── PARTIDAS ─────────────────────────────────── */}
      {activeTab === 'partidas' && (
        <main style={{ maxWidth: 1100, margin: '0 auto', padding: 'clamp(20px,3vw,36px) clamp(16px,4vw,40px) 80px' }}>
          {!user ? (
            <div style={{ textAlign: 'center', padding: '64px 0' }}>
              <p style={{ fontSize: 32, marginBottom: 12 }}>🎲</p>
              <p className="t-section-title" style={{ marginBottom: 8 }}>Inicia sesión para ver tus partidas</p>
              <Link href="/auth/login" style={{ fontSize: 14, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Iniciar sesión →</Link>
            </div>
          ) : (
            <Suspense fallback={
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {[0, 1, 2].map(i => (
                  <div key={i} className="skeleton" style={{ height: 64, borderRadius: 14, background: 'var(--bg-inset)' }} />
                ))}
              </div>
            }>
              <GamePlaysTab gameId={game.id} gameName={game.name} userId={user.id} />
            </Suspense>
          )}
        </main>
      )}

      {/* ── Bottom CTA (guests only) ──────────────── */}
      {!user && (
        <div style={{
          position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 50,
          padding: '12px clamp(16px,4vw,28px)',
          background: 'rgba(247,238,231,0.96)',
          backdropFilter: 'blur(16px)', WebkitBackdropFilter: 'blur(16px)',
          borderTop: '1px solid var(--border)',
          display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10,
          flexWrap: 'wrap',
        }}>
          <p className="t-card-title" style={{ color: 'var(--text-2)', display: 'contents' }}>
            <span style={{ display: 'inline' }}>Regístrate para comentar, editar, inspeccionar</span>
          </p>
          <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
            <Link href="/auth/signup" style={{
              padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: 'var(--brand)', color: 'white', textDecoration: 'none',
              boxShadow: 'var(--shadow-btn-brand)',
            }}>
              Registrarse
            </Link>
            <Link href="/auth/login" style={{
              padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              background: 'var(--bg-card)', color: 'var(--text-2)', textDecoration: 'none',
              boxShadow: 'var(--shadow-btn)',
            }}>
              Entrar
            </Link>
          </div>
        </div>
      )}
    </div>
    </GameRatingProvider>
  );
}

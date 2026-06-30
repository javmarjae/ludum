'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';

interface Game {
  bgg_id: number;
  name: string;
  year_published: number | null;
  bgg_rating: number | null;
  bgg_rank: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  complexity: number | null;
  image_url: string | null;
  categories: string[] | null;
  mechanics: string[] | null;
  is_expansion: boolean | null;
}

interface TrendingGame {
  bgg_id: number;
  name: string;
  image_url: string | null;
  count: number;
}

interface FeaturedGame {
  bgg_id: number;
  name: string;
  image_url: string | null;
  bgg_rating: number | null;
  year_published: number | null;
}

interface Props {
  mostPlayedGames: TrendingGame[];
  topRatedGames: FeaturedGame[];
  newGames: FeaturedGame[];
}

type QuickFilter =
  | { players: number }
  | { duration: string }
  | { complexity: string }
  | { query: string };

const RANK_COLORS = ['#7C3AED', '#0D9488', '#DC2626', '#2563EB', '#16A34A', '#D97706', '#DB2777', '#0891B2'];

const QUICK_GROUPS: { title: string; items: { label: string; filter: QuickFilter }[] }[] = [
  {
    title: 'Por número de jugadores',
    items: [
      { label: 'Un jugador', filter: { players: 1 } },
      { label: 'Pareja', filter: { players: 2 } },
      { label: '3-4 jugadores', filter: { players: 3 } },
      { label: 'Más de 10 personas', filter: { players: 10 } },
    ],
  },
  {
    title: 'Por tipo de experiencia',
    items: [
      { label: 'Picantes 🌶️', filter: { query: 'party' } },
      { label: 'Caóticos', filter: { query: 'chaos' } },
      { label: 'Estratégicos', filter: { query: 'strateg' } },
      { label: 'Cooperativos', filter: { query: 'cooperat' } },
    ],
  },
  {
    title: 'Por situación',
    items: [
      { label: 'Para esta noche', filter: { duration: 'corta' } },
      { label: 'Menos de 30 min', filter: { duration: 'corta' } },
      { label: 'Para novatos', filter: { complexity: 'facil' } },
      { label: 'Para llevar de viaje', filter: { query: 'travel' } },
    ],
  },
  {
    title: 'Otras búsquedas',
    items: [
      { label: 'Juegos para beber 🍺', filter: { query: 'drinking' } },
      { label: 'Juegos de deducción', filter: { query: 'deduc' } },
      { label: 'Juegos familiares', filter: { query: 'family' } },
      { label: 'Mecánicas de cartas', filter: { query: 'card' } },
    ],
  },
];

const PLAYER_BUTTONS = [
  { n: 1, icon: '/icons/solo.svg', label: 'Jugador' },
  { n: 2, icon: '/icons/pareja.svg', label: 'Jugadores' },
  { n: 3, icon: '/icons/grupo.svg', label: 'Jugadores' },
  { n: 4, icon: '/icons/grupo.svg', label: 'Jugadores' },
  { n: 5, icon: '/icons/pandilla.svg', label: 'Jugadores' },
  { n: 6, icon: '/icons/pandilla.svg', label: 'Jugadores' },
];

function GameThumb({ src, alt, size = 44 }: { src: string | null; alt: string; size?: number }) {
  return (
    <div style={{ position: 'relative', width: size, height: size, borderRadius: 8, overflow: 'hidden', flexShrink: 0, background: 'var(--bg-inset)' }}>
      {src
        ? <Image src={src} alt={alt} fill sizes={`${size}px`} style={{ objectFit: 'cover' }} />
        : <span style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>🎲</span>
      }
    </div>
  );
}

function SideCard({ game, badge, index }: { game: FeaturedGame; badge: React.ReactNode; index?: number }) {
  return (
    <Link href={`/juegos/${game.bgg_id}`} className={index !== undefined ? 'stagger-in' : undefined} style={{ ...(index !== undefined ? { ['--stagger-i' as any]: index } : {}), display: 'block', textDecoration: 'none' }}>
      <div className="hover-ghost" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <GameThumb src={game.image_url} alt={game.name} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 600, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>
            {game.name}
          </p>
          {badge}
        </div>
      </div>
    </Link>
  );
}

function ResultRow({ game }: { game: Game }) {
  const players = game.min_players && game.max_players
    ? (game.min_players === game.max_players ? `${game.min_players}j` : `${game.min_players}–${game.max_players}j`)
    : null;
  return (
    <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div className="hover-ghost" style={{ display: 'flex', gap: 10, alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
        <GameThumb src={game.image_url} alt={game.name} size={48} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {game.name}
          </p>
          <div style={{ display: 'flex', gap: 6, alignItems: 'center', marginTop: 2, flexWrap: 'wrap' }}>
            {game.year_published && <span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{game.year_published}</span>}
            {game.bgg_rating && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>★ {game.bgg_rating.toFixed(1)}</span>}
            {players && <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', background: 'var(--bg-inset)', padding: '1px 5px', borderRadius: 4 }}>{players}</span>}
          </div>
        </div>
      </div>
    </Link>
  );
}

function SectionHeader({ icon, title, subtitle }: { icon: string; title: string; subtitle: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
      <span style={{ fontSize: 18 }}>{icon}</span>
      <div>
        <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', lineHeight: 1.2 }}>{title}</p>
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 1 }}>{subtitle}</p>
      </div>
    </div>
  );
}

function CarouselHeader({ icon, title, subtitle, href }: { icon: string; title: string; subtitle: string; href?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {icon.startsWith('/')
          ? <img src={icon} alt="" aria-hidden="true" style={{ width: 22, height: 22, objectFit: 'contain' }} />
          : <span style={{ fontSize: 20 }}>{icon}</span>}
        <div>
          <p className="buscar-section-title">{title}</p>
          <p className="buscar-section-sub">{subtitle}</p>
        </div>
      </div>
      {href && (
        <Link href={href} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none', padding: '5px 12px', borderRadius: 999, background: 'var(--brand-tint)', flexShrink: 0 }}>
          Ver todas ›
        </Link>
      )}
    </div>
  );
}

function GameCarouselCard({ game, rank, badge, index }: {
  game: TrendingGame | FeaturedGame;
  rank?: number;
  badge?: { text: string; color: string; bg: string };
  index?: number;
}) {
  const rating = 'bgg_rating' in game ? game.bgg_rating : null;
  return (
    <Link href={`/juegos/${game.bgg_id}`} className={`buscar-carousel-card${index !== undefined ? ' stagger-in' : ''}`} style={{ ...(index !== undefined ? { ['--stagger-i' as any]: index } : {}), display: 'block', textDecoration: 'none' }}>
      <div className="hover-scale-lg" style={{ cursor: 'pointer' }}>
        <div className="buscar-carousel-img">
          {game.image_url
            ? <Image src={game.image_url} alt={game.name} fill sizes="(max-width:480px) 136px, 160px" style={{ objectFit: 'cover' }} />
            : <div style={{ width: '100%', height: '100%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>🎲</div>
          }
          {rank !== undefined && (
            <div style={{ position: 'absolute', top: 8, left: 8, width: 28, height: 28, borderRadius: '50%', background: RANK_COLORS[(rank - 1) % RANK_COLORS.length], color: 'white', fontWeight: 900, fontSize: 13, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 2px 6px rgba(0,0,0,0.3)' }}>{rank}</div>
          )}
        </div>
        <p style={{ fontWeight: 700, fontSize: 12, marginTop: 8, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
        {badge && <span style={{ fontSize: 10, fontWeight: 700, color: badge.color, background: badge.bg, padding: '2px 7px', borderRadius: 999, display: 'inline-flex', alignItems: 'center', gap: 3, marginTop: 4 }}>{badge.text}</span>}
        {rating && <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', marginTop: 3 }}>★ {rating.toFixed(1)}</p>}
      </div>
    </Link>
  );
}

function ActiveFilterBadge({ label, onRemove }: { label: string; onRemove: () => void }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: 'var(--brand)', color: 'white' }}>
      {label}
      <button onClick={onRemove} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'white', padding: 0, fontSize: 13, lineHeight: 1 }}>×</button>
    </span>
  );
}

export function SearchClient({ mostPlayedGames, topRatedGames, newGames }: Props) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [inputFocused, setInputFocused] = useState(false);
  const [filterPlayers, setFilterPlayers] = useState<number | null>(null);
  const [filterComplexity, setFilterComplexity] = useState<string | null>(null);
  const [filterDuration, setFilterDuration] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabaseRef = useRef(createClient());

  const hasFilters = filterPlayers !== null || filterComplexity !== null || filterDuration !== null;
  const hasQuery = query.trim().length >= 2;
  const showResults = hasQuery || hasFilters;

  function toggleFilter(filter: QuickFilter) {
    if ('players' in filter) {
      setFilterPlayers(prev => prev === filter.players ? null : filter.players);
    } else if ('duration' in filter) {
      setFilterDuration(prev => prev === filter.duration ? null : filter.duration);
    } else if ('complexity' in filter) {
      setFilterComplexity(prev => prev === filter.complexity ? null : filter.complexity);
    } else {
      setQuery(prev => prev === filter.query ? '' : filter.query);
    }
  }

  function clearAll() {
    setQuery(''); setFilterPlayers(null); setFilterComplexity(null); setFilterDuration(null);
  }

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!hasQuery && !hasFilters) { setResults([]); return; }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      let q = supabaseRef.current
        .from('games')
        .select('bgg_id, name, year_published, bgg_rating, bgg_rank, min_players, max_players, min_playtime, max_playtime, complexity, image_url, categories, mechanics, is_expansion')
        .neq('is_expansion', true);

      if (hasQuery) q = q.ilike('name', `%${query.trim()}%`);
      if (filterPlayers) {
        if (filterPlayers >= 10) q = q.gte('max_players', 10);
        else q = q.or(`min_players.is.null,and(min_players.lte.${filterPlayers},max_players.gte.${filterPlayers})`);
      }
      if (filterComplexity === 'facil')    q = q.or('complexity.is.null,and(complexity.gte.1,complexity.lte.2)');
      if (filterComplexity === 'medio')    q = q.or('complexity.is.null,and(complexity.gte.1.8,complexity.lte.3.2)');
      if (filterComplexity === 'complejo') q = q.or('complexity.is.null,and(complexity.gte.3,complexity.lte.5)');
      if (filterDuration === 'corta')      q = q.or('min_playtime.is.null,min_playtime.lte.30');
      if (filterDuration === 'media')      q = q.or('min_playtime.is.null,and(min_playtime.gte.20,min_playtime.lte.60)');
      if (filterDuration === 'larga')      q = q.or('min_playtime.is.null,and(min_playtime.gte.45,min_playtime.lte.120)');
      if (filterDuration === 'muy-larga')  q = q.or('min_playtime.is.null,min_playtime.gte.120');

      const { data } = await q.order('bgg_rank', { ascending: true, nullsFirst: false }).limit(40);
      setResults(data ?? []);
      setLoading(false);
    }, 280);

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, filterPlayers, filterComplexity, filterDuration, hasQuery, hasFilters]);

  const trendingNames = mostPlayedGames.slice(0, 5).map(g => g.name);

  return (
    <div className="buscar-3col">

      {/* ── COLUMNA IZQUIERDA: Novedades ── */}
      <aside className="buscar-col-left buscar-side-sticky">
        <SectionHeader icon="⭐" title="Novedades" subtitle="Últimos juegos publicados" />
        <div>
          {newGames.map((g, i) => (
            <SideCard
              key={g.bgg_id}
              game={g}
              index={i}
              badge={<span style={{ fontSize: 11, color: 'var(--text-4)', fontWeight: 500 }}>{g.year_published}</span>}
            />
          ))}
        </div>
      </aside>

      {/* ── COLUMNA CENTRAL: Búsqueda ── */}
      <div className="buscar-col-center">

        {/* Barra de búsqueda */}
        <div style={{ position: 'relative' }}>
          <svg style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none' }}
            width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
          <input
            type="text"
            placeholder="Buscar juego, mecánica, temática, autor..."
            value={query}
            onChange={e => setQuery(e.target.value)}
            onFocus={() => setInputFocused(true)}
            onBlur={() => setInputFocused(false)}
            style={{
              width: '100%', padding: '15px 52px 15px 46px',
              borderRadius: 14, fontSize: 15, fontWeight: 500,
              background: 'var(--bg-card)',
              border: `2px solid ${inputFocused ? 'var(--brand)' : 'transparent'}`,
              boxShadow: inputFocused ? '0 0 0 4px rgba(62,94,59,0.08), var(--shadow-card)' : 'var(--shadow-card)',
              outline: 'none', fontFamily: 'inherit', color: 'var(--text)',
              transition: 'border-color 0.15s, box-shadow 0.15s',
            }}
          />
          <button
            className="buscar-search-submit"
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', width: 36, height: 36, borderRadius: '50%', background: 'var(--brand)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: 'var(--shadow-btn-brand)' }}
            onClick={() => {}}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
          </button>
        </div>

        {/* Búsquedas rápidas */}
        <div className="buscar-quick-card">
          <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 18 }}>Búsquedas rápidas</h2>
          <div className="buscar-quick-grid">
            {QUICK_GROUPS.map(group => (
              <div key={group.title}>
                <p style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                  {group.title}
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  {group.items.map(item => {
                    const active =
                      ('players' in item.filter && filterPlayers === item.filter.players) ||
                      ('duration' in item.filter && filterDuration === item.filter.duration) ||
                      ('complexity' in item.filter && filterComplexity === item.filter.complexity) ||
                      ('query' in item.filter && query === item.filter.query);
                    return (
                      <button
                        key={item.label}
                        onClick={() => toggleFilter(item.filter)}
                        className="buscar-chip-btn"
                        data-active={active ? 'true' : undefined}
                        style={{
                          display: 'flex', alignItems: 'center', padding: '8px 10px',
                          borderRadius: 9, border: 'none', cursor: 'pointer',
                          textAlign: 'left', fontFamily: 'inherit', width: '100%',
                          fontSize: 12, fontWeight: 600,
                          background: active ? 'var(--brand)' : 'var(--bg-inset)',
                          color: active ? 'white' : 'var(--text-2)',
                          transition: 'background 0.12s, color 0.12s, transform 0.1s',
                        }}
                      >
                        {item.label}
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Tendencias de búsqueda */}
        {trendingNames.length > 0 && (
          <div className="buscar-trending-bar">
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
              <span style={{ fontSize: 18 }}>📈</span>
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', lineHeight: 1.2 }}>¿Qué está buscando la gente?</p>
                <p style={{ fontSize: 10, fontWeight: 500, color: 'var(--text-4)', marginTop: 1 }}>Tendencias de búsqueda</p>
              </div>
            </div>
            <div style={{ display: 'flex', gap: 7, flexWrap: 'wrap' }}>
              {trendingNames.map(name => (
                <button key={name} onClick={() => setQuery(q => q === name ? '' : name)}
                  className="buscar-trend-chip"
                  data-active={query === name ? 'true' : undefined}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 4,
                    padding: '5px 12px', borderRadius: 999,
                    background: query === name ? 'var(--brand)' : 'var(--bg-inset)',
                    border: `1.5px solid ${query === name ? 'var(--brand)' : 'var(--border)'}`,
                    cursor: 'pointer', fontSize: 12, fontWeight: 700,
                    color: query === name ? 'white' : 'var(--text)',
                    fontFamily: 'inherit',
                    transition: 'background 0.12s, color 0.12s, border-color 0.12s, transform 0.1s',
                  }}
                >
                  <span style={{ fontSize: 11, fontWeight: 900 }}>↗</span>
                  {name}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Tendencias ahora */}
        {mostPlayedGames.length > 0 && (
          <div>
            <CarouselHeader icon="🔥" title="Tendencias ahora" subtitle="Lo más jugado esta semana" href="/buscar" />
            <div className="h-scroll">
              {mostPlayedGames.slice(0, 8).map((g, i) => (
                <GameCarouselCard key={g.bgg_id} game={g} rank={i + 1} index={i} badge={{ text: '🔥 Muy tendencia', color: '#EA580C', bg: '#FFF7ED' }} />
              ))}
            </div>
          </div>
        )}

        {/* Recomendados para ti */}
        {topRatedGames.length > 0 && !showResults && (
          <div>
            <CarouselHeader icon="/icons/solo.svg" title="Recomendados para ti" subtitle="Basado en tus partidas y gustos" href="/recomendador" />
            <div className="h-scroll">
              {topRatedGames.map((g, i) => (
                <GameCarouselCard key={g.bgg_id} game={g} index={i} badge={{ text: 'Te puede gustar', color: 'var(--brand)', bg: 'var(--brand-tint)' }} />
              ))}
            </div>
          </div>
        )}

        {/* ¿Cuántos vais a jugar? */}
        <div className="buscar-players-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src="/icons/pandilla.svg" alt="" aria-hidden="true" style={{ width: 22, height: 22, objectFit: 'contain' }} />
            <div>
              <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', lineHeight: 1.2 }}>¿Cuántos vais a jugar?</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 1 }}>Filtra recomendaciones al instante</p>
            </div>
          </div>
          <div className="buscar-players-grid">
            {PLAYER_BUTTONS.map(({ n, icon, label }) => (
              <button
                key={n}
                onClick={() => setFilterPlayers(prev => prev === n ? null : n)}
                className="buscar-player-btn"
                data-active={filterPlayers === n || undefined}
              >
                <img src={icon} alt="" className="bp-icon" aria-hidden="true" />
                <span className="bp-count">{n === 6 ? '6+' : n}</span>
                <span className="bp-label">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Resultados */}
        {showResults && (
          <div className="buscar-quick-card">
            <div style={{ marginBottom: 14, display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap' }}>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Resultados</p>
              <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                {filterPlayers !== null && (
                  <ActiveFilterBadge
                    label={filterPlayers >= 10 ? '10+ j.' : `${filterPlayers} jugador${filterPlayers > 1 ? 'es' : ''}`}
                    onRemove={() => setFilterPlayers(null)}
                  />
                )}
                {filterComplexity && (
                  <ActiveFilterBadge
                    label={filterComplexity === 'facil' ? 'Fácil' : filterComplexity === 'medio' ? 'Medio' : 'Complejo'}
                    onRemove={() => setFilterComplexity(null)}
                  />
                )}
                {filterDuration && (
                  <ActiveFilterBadge
                    label={filterDuration === 'corta' ? '< 30 min' : filterDuration === 'media' ? '30–60 min' : filterDuration === 'larga' ? '1–2h' : '2h+'}
                    onRemove={() => setFilterDuration(null)}
                  />
                )}
                {hasQuery && <ActiveFilterBadge label={`"${query}"`} onRemove={() => setQuery('')} />}
                <button onClick={clearAll} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', padding: '2px 4px', fontFamily: 'inherit' }}>
                  Limpiar
                </button>
              </div>
            </div>
            {loading && (
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-4)', padding: '20px 0' }}>Buscando...</p>
            )}
            {!loading && results.length === 0 && (
              <div style={{ padding: '28px 0', textAlign: 'center' }}>
                <p style={{ fontSize: 26, marginBottom: 8 }}>🤷</p>
                <p style={{ fontWeight: 700, fontSize: 13, color: 'var(--text)', marginBottom: 4 }}>Sin resultados</p>
                <p style={{ fontSize: 11, color: 'var(--text-3)' }}>Prueba con otros filtros</p>
              </div>
            )}
            {!loading && results.length > 0 && (
              <>
                <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginBottom: 4 }}>
                  {results.length} resultado{results.length !== 1 ? 's' : ''}
                </p>
                {results.map(g => <ResultRow key={g.bgg_id} game={g} />)}
              </>
            )}
          </div>
        )}

      </div>{/* fin columna central */}

      {/* ── COLUMNA DERECHA: Mejor valorados ── */}
      <aside className="buscar-col-right buscar-side-sticky">
        <SectionHeader icon="🏆" title="Mejor valorados" subtitle="Los clásicos que nunca fallan" />
        <div>
          {topRatedGames.map((g, i) => (
            <SideCard
              key={g.bgg_id}
              game={g}
              index={i}
              badge={
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  {g.bgg_rating && <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)' }}>★ {g.bgg_rating.toFixed(1)}</span>}
                  <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)' }}>#{i + 1}</span>
                </div>
              }
            />
          ))}
        </div>
      </aside>

    </div>
  );
}

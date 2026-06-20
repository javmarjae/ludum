'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
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
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 18px', borderRadius: 20, fontSize: 16, fontWeight: 500,
  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
  border: '2px solid transparent', outline: 'none', fontFamily: 'inherit',
  color: 'var(--text)', boxSizing: 'border-box', transition: 'border-color 0.15s',
};

export function SearchClient() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Game[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const supabase = useMemo(() => createClient(), []);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);

    if (query.trim().length < 2) {
      setResults([]);
      setSearched(false);
      return;
    }

    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from('games')
        .select('bgg_id, name, year_published, bgg_rating, bgg_rank, min_players, max_players, min_playtime, max_playtime, complexity, image_url, categories, mechanics')
        .ilike('name', `%${query.trim()}%`)
        .order('bgg_rank', { ascending: true, nullsFirst: false })
        .limit(30);
      setResults(data ?? []);
      setLoading(false);
      setSearched(true);
    }, 300);
  }, [query, supabase]);

  return (
    <div>
      {/* Search input */}
      <div style={{ position: 'relative', marginBottom: 24 }}>
        <span style={{ position: 'absolute', left: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 18, pointerEvents: 'none' }}>🔍</span>
        <input
          type="text"
          placeholder="Nombre del juego..."
          value={query}
          onChange={e => setQuery(e.target.value)}
          style={{ ...inputStyle, paddingLeft: 48 }}
          onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand)'; }}
          onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'transparent'; }}
          autoFocus
        />
        {loading && (
          <span style={{ position: 'absolute', right: 18, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-4)', fontWeight: 600 }}>
            Buscando...
          </span>
        )}
      </div>

      {/* Empty state */}
      {!searched && !loading && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🎲</p>
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Escribe para buscar</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>Mínimo 2 caracteres</p>
        </div>
      )}

      {/* No results */}
      {searched && !loading && results.length === 0 && (
        <div style={{ textAlign: 'center', padding: '48px 0' }}>
          <p style={{ fontSize: 40, marginBottom: 12 }}>🤷</p>
          <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Sin resultados</p>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>Prueba con otro nombre</p>
        </div>
      )}

      {/* Results */}
      {results.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-4)', marginBottom: 4 }}>
            {results.length} resultado{results.length !== 1 ? 's' : ''}
          </p>
          {results.map(game => {
            const playersText = game.min_players && game.max_players
              ? game.min_players === game.max_players ? `${game.min_players}p` : `${game.min_players}–${game.max_players}p`
              : null;
            const playtimeText = game.min_playtime ? `${game.min_playtime}min` : null;

            return (
              <Link key={game.bgg_id} href={`/juegos/${game.bgg_id}`} style={{ display: 'block', textDecoration: 'none' }}>
                <div
                  className="hover-scale"
                  style={{ borderRadius: 20, padding: '14px 16px', display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
                >
                  {game.image_url ? (
                    <Image
                      src={game.image_url}
                      alt={game.name}
                      width={56}
                      height={56}
                      style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }}
                    />
                  ) : (
                    <div style={{ width: 56, height: 56, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: 'var(--bg-inset)' }}>🎲</div>
                  )}

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                      {game.bgg_rating && (
                        <span style={{
                          flexShrink: 0, fontSize: 12, fontWeight: 800, padding: '3px 8px', borderRadius: 8,
                          background: game.bgg_rating >= 8 ? 'var(--brand-tint)' : 'var(--bg-inset)',
                          color: game.bgg_rating >= 8 ? 'var(--brand)' : 'var(--text-3)',
                        }}>
                          ★ {game.bgg_rating.toFixed(1)}
                        </span>
                      )}
                    </div>

                    <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
                      {game.year_published && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</span>}
                      {game.bgg_rank && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>#{game.bgg_rank} BGG</span>}
                      {playersText && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                          👥 {playersText}
                        </span>
                      )}
                      {playtimeText && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                          ⏱ {playtimeText}
                        </span>
                      )}
                      {game.categories?.[0] && (
                        <span style={{ fontSize: 11, padding: '2px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.15)' }}>
                          {game.categories[0]}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

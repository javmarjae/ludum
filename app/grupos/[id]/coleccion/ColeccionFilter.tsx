'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { removeGameFromCollection } from '../actions';

interface Game {
  id: string;
  bgg_id: number;
  name: string;
  year_published: number | null;
  bgg_rating: number | null;
  image_url: string | null;
}

interface Props {
  games: Game[];
  groupId: string;
}

export function ColeccionFilter({ games, groupId }: Props) {
  const [filter, setFilter] = useState('');
  const [removingIds, setRemovingIds] = useState<Set<string>>(new Set());

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return games;
    return games.filter((g) => g.name.toLowerCase().includes(q));
  }, [games, filter]);

  async function handleRemove(gameId: string) {
    setRemovingIds((s) => new Set(s).add(gameId));
    await removeGameFromCollection(groupId, gameId);
  }

  const inputStyle: React.CSSProperties = {
    background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
    borderRadius: 16, color: 'var(--text)', padding: '12px 16px', fontSize: 15,
    fontWeight: 500, outline: 'none', fontFamily: 'inherit', width: '100%',
  };

  return (
    <>
      {games.length >= 6 && (
        <div style={{ marginBottom: 16 }}>
          <input
            type="text"
            placeholder={`Filtrar ${games.length} juegos...`}
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            style={inputStyle}
          />
        </div>
      )}

      {filtered.length === 0 ? (
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', padding: '12px 0' }}>
          Sin resultados para "{filter}".
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {filtered.map((game) => (
            <div key={game.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, borderRadius: 20, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0, textDecoration: 'none', flex: 1 }}>
                {game.image_url
                  ? <div style={{ position: 'relative', width: 40, height: 54, borderRadius: 12, overflow: 'hidden', flexShrink: 0 }}>
                      <Image src={game.image_url} alt={game.name} fill style={{ objectFit: 'cover' }} />
                    </div>
                  : <div style={{ width: 40, height: 54, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                }
                <div style={{ minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                    {game.year_published}
                    {game.bgg_rating != null && <span> · ⭐ {game.bgg_rating.toFixed(1)}</span>}
                  </p>
                </div>
              </Link>
              <button
                onClick={() => handleRemove(game.id)}
                disabled={removingIds.has(game.id)}
                style={{
                  flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
                  cursor: 'pointer', fontFamily: 'inherit',
                  background: 'rgba(58,55,47,0.08)', color: 'var(--text-2)',
                  border: '1px solid rgba(58,55,47,0.18)',
                  opacity: removingIds.has(game.id) ? 0.5 : 1,
                }}
              >
                {removingIds.has(game.id) ? '...' : 'Quitar'}
              </button>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

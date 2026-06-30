'use client';

import { useState, useCallback } from 'react';
import Link from 'next/link';
import Image from 'next/image';

interface Game {
  id: string;
  bgg_id: number;
  name: string;
  image_url: string | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
}

interface Props {
  games: Game[];
}

const PLAYER_OPTIONS = [1, 2, 3, 4, 5];

export function WhatToPlay({ games }: Props) {
  const [players, setPlayers] = useState<number | null>(null);
  const [suggestion, setSuggestion] = useState<Game | null>(null);
  const [shown, setShown] = useState(false);

  const eligible = useCallback((n: number | null) => {
    if (!n) return games;
    return games.filter((g) =>
      (g.min_players == null || g.min_players <= n) &&
      (g.max_players == null || g.max_players >= n)
    );
  }, [games]);

  function suggest(n: number | null) {
    const pool = eligible(n);
    if (pool.length === 0) { setSuggestion(null); setShown(true); return; }
    const pick = pool[Math.floor(Math.random() * pool.length)];
    setSuggestion(pick);
    setShown(true);
  }

  function reshuffle() {
    const pool = eligible(players);
    if (pool.length === 0) return;
    let pick = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1) {
      while (pick.id === suggestion?.id) {
        pick = pool[Math.floor(Math.random() * pool.length)];
      }
    }
    setSuggestion(pick);
  }

  if (games.length === 0) return null;

  return (
    <section style={{ marginBottom: 20 }}>
      <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>¿Qué jugamos hoy?</h2>

      <div style={{ borderRadius: 24, padding: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        {/* Selector jugadores */}
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 12 }}>
          Selecciona el número de jugadores y te recomendaremos los mejores juegos de la colección.
        </p>
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap', marginBottom: 16 }}>
          {PLAYER_OPTIONS.map((n) => (
            <button key={n} type="button" onClick={() => { setPlayers(n === players ? null : n); setShown(false); setSuggestion(null); }} style={{
              width: 40, height: 40, borderRadius: '50%', fontWeight: 800, fontSize: 14,
              cursor: 'pointer', fontFamily: 'inherit', border: 'none',
              background: players === n ? 'var(--brand)' : 'var(--bg-inset)',
              color: players === n ? 'white' : 'var(--text-3)',
              boxShadow: players === n ? '0 2px 8px rgba(62,94,59,0.25)' : 'none',
            }}>
              {n}
            </button>
          ))}
          <button type="button" onClick={() => { setPlayers(null); setShown(false); setSuggestion(null); }} style={{
            padding: '0 14px', height: 40, borderRadius: 999, fontWeight: 700, fontSize: 12,
            cursor: 'pointer', fontFamily: 'inherit', border: 'none',
            background: players === null && shown ? 'var(--bg-inset)' : 'var(--bg-inset)',
            color: 'var(--text-3)',
          }}>
            Cualquiera
          </button>
        </div>

        {/* Botón sugerir */}
        {!shown && (
          <button type="button" onClick={() => suggest(players)} className="btn-hero" style={{
            width: '100%', padding: '12px', borderRadius: 999, fontWeight: 800, fontSize: 15,
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', color: 'white',
          }}>
            Ver recomendaciones →
          </button>
        )}

        {/* Resultado */}
        {shown && suggestion && (
          <div style={{ marginTop: 4 }}>
            <Link href={`/juegos/${suggestion.bgg_id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '14px 16px', background: 'var(--brand-tint)', border: '1.5px solid rgba(62,94,59,0.15)', textDecoration: 'none', marginBottom: 10 }}>
              {suggestion.image_url
                ? <div style={{ position: 'relative', width: 52, height: 70, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                    <Image src={suggestion.image_url} alt={suggestion.name} fill sizes="52px" style={{ objectFit: 'cover' }} />
                  </div>
                : <div style={{ width: 52, height: 70, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, background: 'var(--bg-inset)' }}>🎲</div>
              }
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--brand)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{suggestion.name}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>
                  {suggestion.min_players != null && suggestion.max_players != null
                    ? `${suggestion.min_players}–${suggestion.max_players} jugadores`
                    : suggestion.min_players != null ? `${suggestion.min_players}+ jugadores` : null}
                  {suggestion.min_playtime != null && <span> · {suggestion.min_playtime}{suggestion.max_playtime && suggestion.max_playtime !== suggestion.min_playtime ? `–${suggestion.max_playtime}` : ''} min</span>}
                </p>
              </div>
              <span style={{ fontSize: 16, color: 'var(--brand)', flexShrink: 0 }}>›</span>
            </Link>
            <div style={{ display: 'flex', gap: 8 }}>
              <button type="button" onClick={reshuffle} style={{
                flex: 1, padding: '10px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'var(--bg-inset)', border: 'none', color: 'var(--text-3)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                Otra sugerencia
              </button>
              <button type="button" onClick={() => { setShown(false); setSuggestion(null); }} style={{
                padding: '10px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'none', border: '1px solid var(--border)', color: 'var(--text-4)',
                cursor: 'pointer', fontFamily: 'inherit',
              }}>
                ✕
              </button>
            </div>
          </div>
        )}

        {shown && !suggestion && (
          <div style={{ textAlign: 'center', padding: '12px 0' }}>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', marginBottom: 10 }}>
              Sin juegos en la colección para {players} jugadores.
            </p>
            <button type="button" onClick={() => { setPlayers(null); suggest(null); }} style={{
              fontSize: 13, fontWeight: 700, color: 'var(--brand)', background: 'none',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            }}>
              Ver todos los juegos →
            </button>
          </div>
        )}
      </div>
    </section>
  );
}

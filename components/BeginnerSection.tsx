'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';

const STORAGE_KEY = 'ludum-beginner-hidden';

const BEGINNER_TIPS = [
  {
    icon: '👥',
    title: '¿Cuántos jugadores sois?',
    desc: 'Para 2: Patchwork o Jaipur. Para grupo: Catan o Ticket to Ride. Hay juegos para cada número.',
  },
  {
    icon: '⏱️',
    title: '¿Cuánto tiempo tenéis?',
    desc: 'Una partida ágil dura 30 min. Para sesiones largas, elegid algo de 60–90 min. El tiempo de caja es orientativo.',
  },
  {
    icon: '🎯',
    title: 'Empieza por algo ligero',
    desc: 'Los juegos con peso 1–2 (de 5) son perfectos para aprender. Reglas simples, diversión garantizada.',
  },
];

type Game = {
  bgg_id: string;
  name: string;
  image_url?: string;
  min_players?: number;
  max_players?: number;
};

export function BeginnerSection({ games, isLanding }: { games: Game[]; isLanding?: boolean }) {
  const [hidden, setHidden] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setHidden(localStorage.getItem(STORAGE_KEY) === '1');
  }, []);

  function hide() {
    localStorage.setItem(STORAGE_KEY, '1');
    setHidden(true);
  }

  // Avoid flash: render nothing until hydrated
  if (!mounted) return null;
  if (hidden) return null;

  const wrapperStyle: React.CSSProperties = isLanding
    ? { borderTop: '1px solid var(--border)', background: 'var(--bg-inset)' }
    : {};

  return (
    <section style={wrapperStyle}>
      <div style={{ maxWidth: isLanding ? 1120 : undefined, margin: isLanding ? '0 auto' : undefined, padding: isLanding ? '72px 32px' : undefined }}>
        {/* Header row */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16 }}>
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 8 }}>
              Para empezar
            </p>
            <h2 style={{ fontSize: isLanding ? 'clamp(26px, 3vw, 36px)' : 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 10 }}>
              Iníciate en los juegos de mesa
            </h2>
            {isLanding && (
              <p style={{ fontSize: 16, color: 'var(--text-3)', fontWeight: 500, maxWidth: 540 }}>
                ¿Nunca has jugado a juegos modernos? Te ayudamos a dar el primer paso con los títulos perfectos para novatos.
              </p>
            )}
          </div>
          <button
            onClick={hide}
            title="Ocultar sección"
            style={{
              flexShrink: 0,
              marginTop: 2,
              width: 32,
              height: 32,
              borderRadius: '50%',
              border: '1px solid var(--border)',
              background: 'var(--bg-card)',
              color: 'var(--text-3)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              lineHeight: 1,
            }}
          >
            ×
          </button>
        </div>

        {/* Tip cards */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 16, marginBottom: 36 }}>
          {BEGINNER_TIPS.map((tip) => (
            <div key={tip.title} style={{
              borderRadius: 16, padding: '22px 24px', background: 'var(--bg-card)',
              boxShadow: '0 2px 12px rgba(58,55,47,0.09), 0 0 0 1px rgba(216,203,188,0.7)',
              display: 'flex', flexDirection: 'column', gap: 10,
            }}>
              <span style={{ fontSize: 28 }}>{tip.icon}</span>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', lineHeight: 1.3 }}>{tip.title}</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6 }}>{tip.desc}</p>
            </div>
          ))}
        </div>

        {/* Game carousel */}
        <div style={{ display: 'flex', flexDirection: 'row', flexWrap: 'nowrap', gap: 16, overflowX: 'auto', paddingBottom: 12, WebkitOverflowScrolling: 'touch' } as React.CSSProperties}>
          {games.map((game) => (
            <Link
              key={game.bgg_id}
              href={`/juegos/${game.bgg_id}`}
              className="hover-scale-md"
              style={{
                textDecoration: 'none', flexShrink: 0, width: 120, borderRadius: 12, overflow: 'hidden',
                background: 'var(--bg-card)', display: 'block',
                boxShadow: '0 4px 16px rgba(58,55,47,0.12), 0 0 0 1px rgba(216,203,188,0.7)',
              }}
            >
              <div style={{ height: 154, background: 'var(--bg-inset)', overflow: 'hidden' }}>
                {game.image_url ? (
                  <img src={game.image_url} alt={game.name} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32 }}>🎲</div>
                )}
              </div>
              <div style={{ padding: '8px 10px 10px' }}>
                <p style={{ fontWeight: 700, fontSize: 11, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{game.name}</p>
                {(game.min_players || game.max_players) && (
                  <p style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-4)' }}>
                    {game.min_players === game.max_players
                      ? `${game.min_players} jug.`
                      : `${game.min_players ?? '?'}–${game.max_players ?? '?'} jug.`}
                  </p>
                )}
              </div>
            </Link>
          ))}
        </div>

        {isLanding && (
          <div style={{ marginTop: 36, display: 'flex', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/recomendador" style={{ padding: '12px 24px', borderRadius: 8, fontWeight: 700, fontSize: 14, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}>
              Recomiéndame un juego →
            </Link>
            <Link href="/buscar" style={{ padding: '12px 20px', borderRadius: 8, fontWeight: 700, fontSize: 14, color: 'var(--text-2)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', textDecoration: 'none' }}>
              Ver catálogo completo
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

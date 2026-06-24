'use client';

import { useState, useEffect } from 'react';

interface Play {
  id: string;
  played_at: string;
  games: { name: string } | null;
  play_results: { profile_id: string | null; is_winner: boolean }[] | null;
}

interface Props {
  plays: Play[];
  collectionCount: number;
  userId: string;
  compact?: boolean;
}

interface Achievement {
  id: string;
  icon: string;
  title: string;
  desc: string;
  unlocked: boolean;
}

export function Achievements({ plays, collectionCount, userId, compact = false }: Props) {
  const totalPlays = plays.length;
  const totalWins = plays.filter((p) => p.play_results?.some((r) => r.is_winner && r.profile_id === userId)).length;
  const distinctGames = new Set(plays.map((p) => p.games?.name).filter(Boolean)).size;

  // Racha más larga de victorias
  let maxStreak = 0;
  let currentStreak = 0;
  for (const play of [...plays].reverse()) {
    const won = play.play_results?.some((r) => r.is_winner && r.profile_id === userId);
    if (won) { currentStreak++; maxStreak = Math.max(maxStreak, currentStreak); }
    else currentStreak = 0;
  }

  // Noctámbulo: en useEffect para evitar mismatch de timezone servidor/browser
  const [lateNight, setLateNight] = useState(false);
  const [hoveredId, setHoveredId] = useState<string | null>(null);
  useEffect(() => {
    setLateNight(plays.some((p) => {
      const h = new Date(p.played_at).getHours();
      return h >= 0 && h < 6;
    }));
  }, [plays]);

  const achievements: Achievement[] = [
    { id: 'primera', icon: '🎲', title: 'Primera partida', desc: 'Registra tu primera partida', unlocked: totalPlays >= 1 },
    { id: 'cinco', icon: '⭐', title: 'Cinco partidas', desc: 'Lleva el registro de 5 partidas', unlocked: totalPlays >= 5 },
    { id: 'diez', icon: '🎯', title: 'Diez partidas', desc: 'Un jugador comprometido', unlocked: totalPlays >= 10 },
    { id: 'cincuenta', icon: '🏅', title: '50 partidas', desc: 'Veterano de mesa', unlocked: totalPlays >= 50 },
    { id: 'primera_victoria', icon: '🏆', title: 'Primera victoria', desc: 'Gana tu primera partida', unlocked: totalWins >= 1 },
    { id: 'diez_victorias', icon: '👑', title: '10 victorias', desc: 'Un ganador nato', unlocked: totalWins >= 10 },
    { id: 'racha3', icon: '🔥', title: 'En racha', desc: 'Gana 3 partidas seguidas', unlocked: maxStreak >= 3 },
    { id: 'racha5', icon: '⚡', title: 'Imparable', desc: 'Gana 5 partidas seguidas', unlocked: maxStreak >= 5 },
    { id: 'coleccion5', icon: '📦', title: 'Coleccionista', desc: 'Añade 5 juegos a tu colección', unlocked: collectionCount >= 5 },
    { id: 'coleccion20', icon: '🗃️', title: 'Gran colección', desc: 'Añade 20 juegos a tu colección', unlocked: collectionCount >= 20 },
    { id: 'variado', icon: '🌈', title: 'Variado', desc: 'Juega a 5 juegos distintos', unlocked: distinctGames >= 5 },
    { id: 'noctambulo', icon: '🌙', title: 'Noctámbulo', desc: 'Registra una partida de madrugada', unlocked: lateNight },
  ];

  const unlocked = achievements.filter((a) => a.unlocked);
  const locked = achievements.filter((a) => !a.unlocked);

  if (totalPlays === 0 && collectionCount === 0) return null;

  if (compact) {
    return (
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Logros</p>
          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>{unlocked.length}/{achievements.length}</span>
        </div>
        <div className="achievements-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
          {achievements.map((a) => (
            <div
              key={a.id}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHoveredId(a.id)}
              onMouseLeave={() => setHoveredId(null)}
            >
              {/* Tooltip */}
              {hoveredId === a.id && (
                <div style={{
                  position: 'absolute',
                  bottom: 'calc(100% + 8px)',
                  left: '50%',
                  transform: 'translateX(-50%)',
                  background: 'rgba(18, 18, 18, 0.93)',
                  color: 'white',
                  padding: '8px 12px',
                  borderRadius: 10,
                  fontSize: 11,
                  fontWeight: 500,
                  lineHeight: 1.45,
                  whiteSpace: 'nowrap',
                  zIndex: 50,
                  pointerEvents: 'none',
                  boxShadow: '0 4px 14px rgba(0,0,0,0.35)',
                }}>
                  <p style={{ fontWeight: 800, marginBottom: 2, fontSize: 12 }}>{a.title}</p>
                  <p style={{ opacity: 0.8 }}>{a.desc}</p>
                  {/* Flecha */}
                  <div style={{
                    position: 'absolute', top: '100%', left: '50%',
                    transform: 'translateX(-50%)',
                    borderLeft: '5px solid transparent', borderRight: '5px solid transparent',
                    borderTop: '5px solid rgba(18, 18, 18, 0.93)',
                  }} />
                </div>
              )}

              {/* Badge */}
              <div style={{
                borderRadius: 10, padding: '10px 6px', textAlign: 'center',
                background: a.unlocked ? 'var(--brand-tint)' : 'var(--bg-card)',
                boxShadow: 'var(--shadow-card)',
                border: a.unlocked ? '1.5px solid rgba(62,94,59,0.15)' : '1.5px solid transparent',
                opacity: a.unlocked ? 1 : 0.4,
                cursor: 'default',
                transition: 'transform 0.1s',
                transform: hoveredId === a.id ? 'scale(1.06)' : 'scale(1)',
              }}>
                <div style={{ fontSize: 22, marginBottom: 4, filter: a.unlocked ? 'none' : 'grayscale(1)' }}>{a.icon}</div>
                <p style={{ fontSize: 10, fontWeight: 700, color: a.unlocked ? 'var(--brand)' : 'var(--text)', lineHeight: 1.3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{a.title}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <section style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
        <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Logros</h2>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-4)' }}>{unlocked.length}/{achievements.length}</span>
      </div>

      {unlocked.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8, marginBottom: locked.length > 0 ? 10 : 0 }}>
          {unlocked.map((a) => (
            <div key={a.id} style={{ borderRadius: 10, padding: '14px 12px', textAlign: 'center', background: 'var(--brand-tint)', boxShadow: 'var(--shadow-card)', border: '1.5px solid rgba(62,94,59,0.15)' }}>
              <div style={{ fontSize: 28, marginBottom: 6 }}>{a.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--brand)', marginBottom: 2 }}>{a.title}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.4 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      )}

      {locked.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 8 }}>
          {locked.map((a) => (
            <div key={a.id} style={{ borderRadius: 10, padding: '14px 12px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', opacity: 0.5 }}>
              <div style={{ fontSize: 28, marginBottom: 6, filter: 'grayscale(1)' }}>{a.icon}</div>
              <p style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)', marginBottom: 2 }}>{a.title}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', lineHeight: 1.4 }}>{a.desc}</p>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

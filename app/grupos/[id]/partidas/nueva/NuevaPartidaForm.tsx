'use client';

import { useState } from 'react';
import { createPlay } from '../../actions';

interface Game { id: string; name: string; image_url: string | null; min_playtime?: number | null; max_playtime?: number | null; }
interface Member { id: string; display_name: string; }

interface Player {
  uid: string;
  type: 'member' | 'guest';
  profile_id: string | null;
  guest_name: string;
  score: string;
  is_winner: boolean;
}

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 16, color: 'var(--text)', width: '100%', padding: '10px 14px',
  fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit',
};

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    uid: crypto.randomUUID(),
    type: 'member',
    profile_id: null,
    guest_name: '',
    score: '',
    is_winner: false,
    ...overrides,
  };
}

export function NuevaPartidaForm({ groupId, games, members }: { groupId: string; games: Game[]; members: Member[] }) {
  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [duration, setDuration] = useState('');
  const [notes, setNotes] = useState('');
  const [isPublic, setIsPublic] = useState(false);
  const [players, setPlayers] = useState<Player[]>([
    makePlayer({ profile_id: members[0]?.id ?? null }),
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function addPlayer() {
    setPlayers(prev => [...prev, makePlayer()]);
  }

  function removePlayer(uid: string) {
    setPlayers(prev => prev.filter(p => p.uid !== uid));
  }

  function updatePlayer(uid: string, field: keyof Player, value: string | boolean | null) {
    setPlayers(prev => prev.map(p => p.uid === uid ? { ...p, [field]: value } : p));
  }

  function toggleWinner(uid: string) {
    setPlayers(prev => prev.map(p => p.uid === uid ? { ...p, is_winner: !p.is_winner } : p));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);

    const results = players.map((p) => ({
      profile_id: p.type === 'member' ? p.profile_id : null,
      guest_name: p.type === 'guest' ? p.guest_name || null : null,
      score: p.score ? parseFloat(p.score) : null,
      is_winner: p.is_winner,
    }));

    const formData = new FormData();
    formData.set('group_id', groupId);
    formData.set('game_id', gameId);
    formData.set('played_at', playedAt);
    formData.set('notes', notes);
    formData.set('results', JSON.stringify(results));
    formData.set('is_public', String(isPublic));
    if (duration) formData.set('duration_minutes', duration);

    const result = await createPlay(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  const labelStyle = { display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 };

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* Game */}
      <div>
        <label style={labelStyle}>Juego</label>
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} required style={{ ...inputStyle, appearance: 'auto' } as React.CSSProperties}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle}>Fecha</label>
        <input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required style={inputStyle as React.CSSProperties} />
      </div>

      {/* Duration */}
      <div>
        <label style={labelStyle}>Duración (minutos) <span style={{ fontWeight: 500, color: 'var(--text-4)' }}>— opcional</span></label>
        <input
          type="number" min="1" max="999" value={duration}
          onChange={(e) => setDuration(e.target.value)}
          placeholder={(() => {
            const g = games.find(g => g.id === gameId);
            if (!g) return 'ej. 45';
            if (g.min_playtime && g.max_playtime && g.min_playtime !== g.max_playtime) return `ej. ${Math.round((g.min_playtime + g.max_playtime) / 2)} (típico: ${g.min_playtime}–${g.max_playtime})`;
            if (g.min_playtime) return `ej. ${g.min_playtime} (típico del juego)`;
            return 'ej. 45';
          })()}
          style={inputStyle as React.CSSProperties}
        />
      </div>

      {/* Players */}
      <div>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <label style={{ ...labelStyle, marginBottom: 0 }}>Jugadores</label>
          <button type="button" onClick={addPlayer} style={{
            fontSize: 12, padding: '5px 12px', borderRadius: 999, fontWeight: 700,
            background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(92,140,42,0.2)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}>
            + Añadir jugador
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {players.map((player, i) => {
            // Miembros ya elegidos en otros slots → se deshabilitan para no duplicar a la misma persona
            const usedElsewhere = new Set(
              players.filter(p => p.uid !== player.uid && p.type === 'member' && p.profile_id).map(p => p.profile_id)
            );
            return (
            <div key={player.uid} style={{
              borderRadius: 20, padding: 16,
              background: player.is_winner ? 'var(--brand-tint)' : 'var(--bg-card)',
              boxShadow: 'var(--shadow-card)',
              border: player.is_winner ? '1.5px solid rgba(62,94,59,0.2)' : '1.5px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
                  Jugador {i + 1} {player.is_winner && '🏆'}
                </span>
                {players.length > 1 && (
                  <button type="button" onClick={() => removePlayer(player.uid)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Quitar
                  </button>
                )}
              </div>

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(['member', 'guest'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => updatePlayer(player.uid, 'type', type)} style={{
                    padding: '5px 12px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
                    background: player.type === type ? 'var(--brand-tint)' : 'var(--bg-inset)',
                    color: player.type === type ? 'var(--brand)' : 'var(--text-3)',
                    border: player.type === type ? '1px solid rgba(92,140,42,0.2)' : '1px solid transparent',
                  }}>
                    {type === 'member' ? 'Del grupo' : 'Invitado'}
                  </button>
                ))}
              </div>

              {/* Name */}
              {player.type === 'member' ? (
                <select value={player.profile_id ?? ''} onChange={(e) => updatePlayer(player.uid, 'profile_id', e.target.value)}
                  style={{ ...inputStyle, marginBottom: 10, appearance: 'auto' } as React.CSSProperties}>
                  <option value="">— Seleccionar —</option>
                  {members.map((m) => (
                    <option key={m.id} value={m.id} disabled={usedElsewhere.has(m.id)}>
                      {m.display_name}{usedElsewhere.has(m.id) ? ' (ya añadido)' : ''}
                    </option>
                  ))}
                </select>
              ) : (
                <input type="text" placeholder="Nombre del invitado" value={player.guest_name}
                  onChange={(e) => updatePlayer(player.uid, 'guest_name', e.target.value)}
                  style={{ ...inputStyle, marginBottom: 10 } as React.CSSProperties} />
              )}

              {/* Score + winner */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Puntuación" value={player.score}
                  onChange={(e) => updatePlayer(player.uid, 'score', e.target.value)}
                  style={{ ...inputStyle, flex: 1 } as React.CSSProperties} />
                <button type="button" onClick={() => toggleWinner(player.uid)} style={{
                  padding: '10px 14px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  background: player.is_winner ? 'var(--brand-tint)' : 'var(--bg-inset)',
                  color: player.is_winner ? 'var(--brand)' : 'var(--text-3)',
                  border: player.is_winner ? '1px solid rgba(92,140,42,0.2)' : '1px solid transparent',
                }}>
                  🏆 Ganador
                </button>
              </div>
            </div>
            );
          })}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notas (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Algo memorable de esta partida?" rows={2}
          style={{ ...inputStyle, resize: 'none' } as React.CSSProperties} />
      </div>

      {/* Visibilidad */}
      <div style={{ borderRadius: 20, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 6 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
              {isPublic ? '🌐 Partida pública' : '🔒 Partida privada'}
            </p>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
              {isPublic ? 'Cualquiera con el enlace puede verla' : 'Solo los miembros del grupo pueden verla'}
            </p>
          </div>
          <button type="button" onClick={() => setIsPublic(!isPublic)} style={{
            width: 44, height: 24, borderRadius: 999, border: 'none', cursor: 'pointer',
            background: isPublic ? 'var(--brand)' : 'var(--bg-inset)',
            position: 'relative', transition: 'background 0.2s', flexShrink: 0,
            boxShadow: isPublic ? 'var(--shadow-btn-brand)' : 'var(--shadow-input)',
          }}>
            <span style={{
              position: 'absolute', top: 3, left: isPublic ? 23 : 3, width: 18, height: 18,
              borderRadius: '50%', background: 'white',
              transition: 'left 0.2s', boxShadow: '0 1px 3px rgba(0,0,0,0.2)',
            }} />
          </button>
        </div>
      </div>

      {error && (
        <p style={{ fontSize: 13, borderRadius: 16, padding: '10px 14px', fontWeight: 600, background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.2)' }}>
          {error}
        </p>
      )}

      <button type="submit" disabled={loading} style={{
        width: '100%', padding: '14px', borderRadius: 999, fontWeight: 800, fontSize: 16,
        color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
        border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
      }}>
        {loading ? 'Guardando...' : 'Registrar partida'}
      </button>
    </form>
  );
}

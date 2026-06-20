'use client';

import { useState } from 'react';
import { createPlay } from '../../actions';

interface Game { id: string; name: string; image_url: string | null; }
interface Member { id: string; display_name: string; }

interface Player {
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

export function NuevaPartidaForm({ groupId, games, members }: { groupId: string; games: Game[]; members: Member[] }) {
  const [gameId, setGameId] = useState(games[0]?.id ?? '');
  const [playedAt, setPlayedAt] = useState(new Date().toISOString().split('T')[0]);
  const [notes, setNotes] = useState('');
  const [players, setPlayers] = useState<Player[]>([
    { type: 'member', profile_id: members[0]?.id ?? null, guest_name: '', score: '', is_winner: false },
  ]);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  function addPlayer() {
    setPlayers([...players, { type: 'member', profile_id: null, guest_name: '', score: '', is_winner: false }]);
  }

  function removePlayer(i: number) {
    setPlayers(players.filter((_, idx) => idx !== i));
  }

  function updatePlayer(i: number, field: keyof Player, value: any) {
    setPlayers(players.map((p, idx) => idx === i ? { ...p, [field]: value } : p));
  }

  function setWinner(i: number) {
    setPlayers(players.map((p, idx) => ({ ...p, is_winner: idx === i })));
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
        <select value={gameId} onChange={(e) => setGameId(e.target.value)} required style={{ ...inputStyle, appearance: 'auto' } as any}>
          {games.map((g) => (
            <option key={g.id} value={g.id}>{g.name}</option>
          ))}
        </select>
      </div>

      {/* Date */}
      <div>
        <label style={labelStyle}>Fecha</label>
        <input type="date" value={playedAt} onChange={(e) => setPlayedAt(e.target.value)} required style={inputStyle as any} />
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
          {players.map((player, i) => (
            <div key={i} style={{
              borderRadius: 20, padding: 16,
              background: player.is_winner ? 'var(--brand-tint)' : 'var(--bg-card)',
              boxShadow: player.is_winner ? 'var(--shadow-card)' : 'var(--shadow-card)',
              border: player.is_winner ? '1.5px solid rgba(62,94,59,0.2)' : '1.5px solid transparent',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>
                  Jugador {i + 1} {player.is_winner && '🏆'}
                </span>
                {players.length > 1 && (
                  <button type="button" onClick={() => removePlayer(i)} style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                    Quitar
                  </button>
                )}
              </div>

              {/* Type toggle */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {(['member', 'guest'] as const).map((type) => (
                  <button key={type} type="button" onClick={() => updatePlayer(i, 'type', type)} style={{
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
                <select value={player.profile_id ?? ''} onChange={(e) => updatePlayer(i, 'profile_id', e.target.value)}
                  style={{ ...inputStyle, marginBottom: 10, appearance: 'auto' } as any}>
                  <option value="">— Seleccionar —</option>
                  {members.map((m) => <option key={m.id} value={m.id}>{m.display_name}</option>)}
                </select>
              ) : (
                <input type="text" placeholder="Nombre del invitado" value={player.guest_name}
                  onChange={(e) => updatePlayer(i, 'guest_name', e.target.value)}
                  style={{ ...inputStyle, marginBottom: 10 } as any} />
              )}

              {/* Score + winner */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input type="number" placeholder="Puntuación" value={player.score}
                  onChange={(e) => updatePlayer(i, 'score', e.target.value)}
                  style={{ ...inputStyle, flex: 1 } as any} />
                <button type="button" onClick={() => setWinner(i)} style={{
                  padding: '10px 14px', borderRadius: 14, fontSize: 13, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                  background: player.is_winner ? 'var(--brand-tint)' : 'var(--bg-inset)',
                  color: player.is_winner ? 'var(--brand)' : 'var(--text-3)',
                  border: player.is_winner ? '1px solid rgba(92,140,42,0.2)' : '1px solid transparent',
                }}>
                  🏆 Ganador
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Notes */}
      <div>
        <label style={labelStyle}>Notas (opcional)</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
          placeholder="¿Algo memorable de esta partida?" rows={2}
          style={{ ...inputStyle, resize: 'none' } as any} />
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

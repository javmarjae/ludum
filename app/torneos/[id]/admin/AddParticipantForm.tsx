'use client';

import { useState, useCallback } from 'react';
import { addParticipant, removeParticipant, searchProfiles } from '../../actions';

interface Participant {
  id: string;
  profile_id: string | null;
  guest_name: string | null;
  status: string;
  profiles: { display_name: string; avatar_url: string | null } | null;
}
interface Profile { id: string; display_name: string; avatar_url: string | null }

const inputStyle = {
  background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 12,
  color: 'var(--text)', padding: '9px 13px', fontSize: 14, fontWeight: 500,
  outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
};

export function AddParticipantForm({ tournamentId, participants }: { tournamentId: string; participants: Participant[] }) {
  const [mode, setMode] = useState<'usuario' | 'invitado'>('invitado');
  const [guestName, setGuestName] = useState('');
  const [userQuery, setUserQuery] = useState('');
  const [userResults, setUserResults] = useState<Profile[]>([]);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [removing, setRemoving] = useState<string | null>(null);
  const [error, setError] = useState('');

  const handleSearch = useCallback(async (q: string) => {
    setUserQuery(q);
    if (q.length < 2) { setUserResults([]); return; }
    setSearching(true);
    const results = await searchProfiles(q);
    setUserResults(results as Profile[]);
    setSearching(false);
  }, []);

  async function handleAddGuest(e: React.FormEvent) {
    e.preventDefault();
    if (!guestName.trim()) return;
    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('tournament_id', tournamentId);
    fd.append('guest_name', guestName.trim());
    const res = await addParticipant(fd);
    if (res?.error) setError(res.error);
    else setGuestName('');
    setLoading(false);
  }

  async function handleAddUser(profile: Profile) {
    setLoading(true);
    setError('');
    const fd = new FormData();
    fd.append('tournament_id', tournamentId);
    fd.append('profile_id', profile.id);
    const res = await addParticipant(fd);
    if (res?.error) setError(res.error);
    else { setUserQuery(''); setUserResults([]); }
    setLoading(false);
  }

  async function handleRemove(participantId: string) {
    setRemoving(participantId);
    await removeParticipant(participantId, tournamentId);
    setRemoving(null);
  }

  return (
    <div>
      {/* Participant list */}
      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: 16 }}>
        {participants.length === 0 ? (
          <div style={{ padding: '24px 18px', textAlign: 'center', color: 'var(--text-4)', fontSize: 14, fontWeight: 500 }}>
            Sin participantes todavía
          </div>
        ) : participants.map((p, i) => {
          const name = p.profiles?.display_name ?? p.guest_name ?? 'Invitado';
          return (
            <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
              <div style={{ width: 34, height: 34, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16, flexShrink: 0 }}>
                {p.profile_id ? '👤' : '🎮'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{name}</p>
                {!p.profile_id && <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>Invitado</p>}
              </div>
              <button
                onClick={() => handleRemove(p.id)}
                disabled={removing === p.id}
                style={{ padding: '5px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: removing === p.id ? 'var(--text-4)' : '#dc2626', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
              >
                {removing === p.id ? '...' : 'Quitar'}
              </button>
            </div>
          );
        })}
      </div>

      {/* Add form */}
      <div style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', padding: '18px' }}>
        <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Añadir participante</p>

        {/* Mode toggle */}
        <div style={{ display: 'flex', gap: 8, marginBottom: 14 }}>
          {(['invitado', 'usuario'] as const).map(m => (
            <button key={m} type="button" onClick={() => { setMode(m); setError(''); }}
              style={{ padding: '6px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, background: mode === m ? 'var(--brand)' : 'var(--bg-inset)', color: mode === m ? 'white' : 'var(--text-3)', transition: 'all 0.15s' }}>
              {m === 'invitado' ? '🎮 Nombre libre' : '👤 Usuario Ludum'}
            </button>
          ))}
        </div>

        {mode === 'invitado' ? (
          <form onSubmit={handleAddGuest} style={{ display: 'flex', gap: 8 }}>
            <input
              value={guestName}
              onChange={e => setGuestName(e.target.value)}
              placeholder="Nombre del participante"
              style={{ ...inputStyle, flex: 1 }}
            />
            <button type="submit" disabled={loading || !guestName.trim()}
              style={{ padding: '9px 18px', borderRadius: 12, border: 'none', background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 14, cursor: 'pointer', flexShrink: 0, opacity: loading ? 0.7 : 1 }}>
              {loading ? '...' : 'Añadir'}
            </button>
          </form>
        ) : (
          <div style={{ position: 'relative' }}>
            <input
              value={userQuery}
              onChange={e => handleSearch(e.target.value)}
              placeholder="Buscar por nombre de usuario..."
              style={inputStyle}
            />
            {(userResults.length > 0 || searching) && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 12, boxShadow: 'var(--shadow-card)', marginTop: 4, overflow: 'hidden' }}>
                {searching && <div style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-4)' }}>Buscando...</div>}
                {userResults.map(u => (
                  <button key={u.id} type="button" onClick={() => handleAddUser(u)}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                    <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, flexShrink: 0 }}>👤</div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{u.display_name}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        )}

        {error && (
          <p style={{ marginTop: 10, fontSize: 13, fontWeight: 600, color: '#dc2626' }}>{error}</p>
        )}
      </div>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { createRound, addMatch, recordResult } from '../../actions';

interface Participant {
  id: string;
  profile_id: string | null;
  guest_name: string | null;
  profiles: { display_name: string } | null;
}
interface MatchResult {
  id: string;
  participant_id: string;
  score: number | null;
  is_winner: boolean;
  tournament_participants: { id: string; profile_id: string | null; guest_name: string | null; profiles: { display_name: string } | null } | null;
}
interface Match {
  id: string;
  status: string;
  table_number: number | null;
  match_results: MatchResult[];
}
interface Round {
  id: string;
  round_number: number;
  name: string;
  status: string;
  tournament_matches: Match[];
}

const inputStyle = {
  background: 'var(--bg-inset)', border: '1px solid var(--border)', borderRadius: 10,
  color: 'var(--text)', padding: '7px 11px', fontSize: 13, fontWeight: 500,
  outline: 'none', fontFamily: 'inherit', width: '100%', boxSizing: 'border-box' as const,
};

function participantName(p: Participant | null | undefined): string {
  if (!p) return 'Jugador';
  return p.profiles?.display_name ?? p.guest_name ?? 'Invitado';
}

function AddMatchForm({ roundId, tournamentId, participants }: { roundId: string; tournamentId: string; participants: Participant[] }) {
  const [selected, setSelected] = useState<string[]>([]);
  const [table, setTable] = useState('');
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);

  function toggle(id: string) {
    setSelected(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (selected.length < 2) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('round_id', roundId);
    fd.append('tournament_id', tournamentId);
    selected.forEach(id => fd.append('participant_ids', id));
    if (table) fd.append('table_number', table);
    await addMatch(fd);
    setSelected([]);
    setTable('');
    setOpen(false);
    setLoading(false);
  }

  if (!open) return (
    <button onClick={() => setOpen(true)} style={{ width: '100%', padding: '10px', borderRadius: 12, border: '1.5px dashed var(--border)', background: 'none', color: 'var(--text-4)', fontSize: 13, fontWeight: 700, cursor: 'pointer', marginTop: 8 }}>
      + Añadir enfrentamiento
    </button>
  );

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 10, padding: '14px', borderRadius: 14, background: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nuevo enfrentamiento</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 10 }}>
        {participants.map(p => (
          <button key={p.id} type="button" onClick={() => toggle(p.id)}
            style={{ padding: '5px 12px', borderRadius: 20, border: 'none', cursor: 'pointer', fontSize: 12, fontWeight: 700, background: selected.includes(p.id) ? 'var(--brand)' : 'var(--bg-card)', color: selected.includes(p.id) ? 'white' : 'var(--text-3)', transition: 'all 0.15s' }}>
            {participantName(p)}
          </button>
        ))}
      </div>
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <input value={table} onChange={e => setTable(e.target.value)} placeholder="Mesa nº (opc.)" type="number" style={{ ...inputStyle, width: 120 }} />
        <button type="submit" disabled={selected.length < 2 || loading}
          style={{ padding: '7px 16px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', flexShrink: 0, opacity: selected.length < 2 ? 0.5 : 1 }}>
          {loading ? '...' : 'Crear'}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          style={{ padding: '7px 12px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-4)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

function RecordResultForm({ match, tournamentId, onDone }: { match: Match; tournamentId: string; onDone: () => void }) {
  const [winnerId, setWinnerId] = useState('');
  const [scores, setScores] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!winnerId) return;
    setLoading(true);
    const fd = new FormData();
    fd.append('match_id', match.id);
    fd.append('tournament_id', tournamentId);
    fd.append('winner_id', winnerId);
    match.match_results.forEach(r => {
      fd.append('participant_ids', r.participant_id);
      if (scores[r.participant_id]) fd.append(`score_${r.participant_id}`, scores[r.participant_id]);
    });
    await recordResult(fd);
    setLoading(false);
    onDone();
  }

  return (
    <form onSubmit={handleSubmit} style={{ marginTop: 8, padding: '14px', borderRadius: 14, background: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
      <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Registrar resultado</p>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12 }}>
        {match.match_results.map(r => {
          const name = r.tournament_participants?.profiles?.display_name ?? r.tournament_participants?.guest_name ?? 'Jugador';
          const isWinner = winnerId === r.participant_id;
          return (
            <div key={r.participant_id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 12px', borderRadius: 12, background: isWinner ? 'rgba(62,94,59,0.1)' : 'var(--bg-card)', border: `1px solid ${isWinner ? 'var(--brand)' : 'var(--border)'}`, cursor: 'pointer' }}
              onClick={() => setWinnerId(r.participant_id)}>
              <input type="radio" name="winner" checked={isWinner} onChange={() => setWinnerId(r.participant_id)} style={{ accentColor: 'var(--brand)' }} />
              <span style={{ flex: 1, fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{name}</span>
              {isWinner && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>🏆 Ganador</span>}
              <input
                value={scores[r.participant_id] ?? ''}
                onChange={e => { e.stopPropagation(); setScores(prev => ({ ...prev, [r.participant_id]: e.target.value })); }}
                onClick={e => e.stopPropagation()}
                placeholder="Puntos"
                type="number"
                style={{ width: 80, padding: '5px 8px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--bg-inset)', color: 'var(--text)', fontSize: 13, outline: 'none', fontFamily: 'inherit' }}
              />
            </div>
          );
        })}
      </div>
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="submit" disabled={!winnerId || loading}
          style={{ flex: 1, padding: '8px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: !winnerId ? 0.5 : 1 }}>
          {loading ? '...' : 'Guardar resultado'}
        </button>
        <button type="button" onClick={onDone}
          style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid var(--border)', background: 'none', color: 'var(--text-4)', fontSize: 13, cursor: 'pointer' }}>
          Cancelar
        </button>
      </div>
    </form>
  );
}

export function RoundManager({ tournamentId, rounds, participants }: { tournamentId: string; rounds: Round[]; participants: Participant[] }) {
  const [creatingRound, setCreatingRound] = useState(false);
  const [recordingMatch, setRecordingMatch] = useState<string | null>(null);

  async function handleCreateRound() {
    setCreatingRound(true);
    await createRound(tournamentId);
    setCreatingRound(false);
  }

  return (
    <div>
      {rounds.length === 0 ? (
        <div style={{ borderRadius: 18, padding: '32px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: 14 }}>
          <p style={{ fontSize: 36, marginBottom: 8 }}>🎯</p>
          <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 4 }}>Sin rondas todavía</p>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Crea la primera ronda para empezar a registrar enfrentamientos.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14, marginBottom: 14 }}>
          {rounds.map(round => {
            const matches = round.tournament_matches ?? [];
            const completed = matches.filter(m => m.status === 'completada').length;
            return (
              <div key={round.id} style={{ borderRadius: 18, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', flex: 1 }}>{round.name || `Ronda ${round.round_number}`}</span>
                  <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>{completed}/{matches.length} ✓</span>
                </div>

                <div style={{ padding: '10px 14px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {matches.map(match => {
                    const names = match.match_results.map(r => r.tournament_participants?.profiles?.display_name ?? r.tournament_participants?.guest_name ?? 'Jugador');
                    const isRecording = recordingMatch === match.id;
                    const winner = match.match_results.find(r => r.is_winner);
                    const winnerName = winner?.tournament_participants?.profiles?.display_name ?? winner?.tournament_participants?.guest_name;

                    return (
                      <div key={match.id}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px', borderRadius: 14, background: match.status === 'completada' ? 'rgba(62,94,59,0.06)' : 'var(--bg-inset)', border: '1px solid var(--border)' }}>
                          {match.table_number && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', minWidth: 44 }}>M{match.table_number}</span>
                          )}
                          <div style={{ flex: 1, display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                            {names.map((name, ni) => (
                              <span key={ni} style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', background: 'var(--bg-card)', padding: '3px 10px', borderRadius: 20 }}>{name}</span>
                            ))}
                          </div>
                          {match.status === 'completada' ? (
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                              {winnerName && <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>🏆 {winnerName}</span>}
                              <button onClick={() => setRecordingMatch(isRecording ? null : match.id)}
                                style={{ padding: '4px 10px', borderRadius: 8, border: '1px solid var(--border)', background: 'none', color: 'var(--text-4)', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>
                                Editar
                              </button>
                            </div>
                          ) : (
                            <button onClick={() => setRecordingMatch(isRecording ? null : match.id)}
                              style={{ padding: '5px 12px', borderRadius: 10, border: 'none', background: 'var(--brand)', color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                              {isRecording ? 'Cancelar' : 'Resultado'}
                            </button>
                          )}
                        </div>

                        {isRecording && (
                          <RecordResultForm
                            match={match}
                            tournamentId={tournamentId}
                            onDone={() => setRecordingMatch(null)}
                          />
                        )}
                      </div>
                    );
                  })}

                  <AddMatchForm roundId={round.id} tournamentId={tournamentId} participants={participants} />
                </div>
              </div>
            );
          })}
        </div>
      )}

      <button onClick={handleCreateRound} disabled={creatingRound || participants.length < 2}
        style={{ width: '100%', padding: '13px', borderRadius: 16, border: 'none', background: participants.length < 2 ? 'var(--bg-inset)' : 'var(--brand)', color: participants.length < 2 ? 'var(--text-4)' : 'white', fontWeight: 700, fontSize: 15, cursor: participants.length < 2 ? 'not-allowed' : 'pointer', opacity: creatingRound ? 0.7 : 1 }}>
        {creatingRound ? 'Creando...' : participants.length < 2 ? 'Añade al menos 2 participantes' : `+ Nueva ronda (Ronda ${rounds.length + 1})`}
      </button>
    </div>
  );
}

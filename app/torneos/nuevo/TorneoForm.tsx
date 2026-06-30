'use client';

import { useState, useCallback } from 'react';
import { createTournament, searchGames } from '../actions';

interface Org { id: string; name: string; type: string }
interface Game { id: string; name: string; image_url: string | null; year_published: number | null }

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 14, color: 'var(--text)', width: '100%', padding: '11px 14px',
  fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
};

export function TorneoForm({ orgs }: { orgs: Org[] }) {
  const [gameQuery, setGameQuery] = useState('');
  const [gameResults, setGameResults] = useState<Game[]>([]);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [searching, setSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedFormat, setSelectedFormat] = useState('libre');

  const handleGameSearch = useCallback(async (q: string) => {
    setGameQuery(q);
    setSelectedGame(null);
    if (q.length < 2) { setGameResults([]); return; }
    setSearching(true);
    const results = await searchGames(q);
    setGameResults(results as Game[]);
    setSearching(false);
  }, []);

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setError('');
    const result = await createTournament(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }

  return (
    <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {orgs.length > 1 && (
        <div>
          <label style={labelStyle}>Organización *</label>
          <select name="organization_id" required style={inputStyle}>
            {orgs.map(o => (
              <option key={o.id} value={o.id}>{o.name} ({o.type === 'tienda' ? '🏪' : '🎲'})</option>
            ))}
          </select>
        </div>
      )}
      {orgs.length === 1 && (
        <input type="hidden" name="organization_id" value={orgs[0].id} />
      )}

      <div>
        <label style={labelStyle} htmlFor="t-name">Nombre del torneo *</label>
        <input id="t-name" name="name" required placeholder="Ej: 1er Torneo de Catan Madrid" style={inputStyle} />
      </div>

      {/* Game search */}
      <div style={{ position: 'relative' }}>
        <label style={labelStyle}>Juego</label>
        <input type="hidden" name="game_id" value={selectedGame?.id ?? ''} />
        {selectedGame ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 14, background: 'var(--bg-inset)', border: '1px solid var(--brand)' }}>
            {selectedGame.image_url && (
              <img src={selectedGame.image_url} alt={selectedGame.name} style={{ width: 36, height: 36, borderRadius: 8, objectFit: 'cover' }} />
            )}
            <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{selectedGame.name}</span>
            <button type="button" onClick={() => { setSelectedGame(null); setGameQuery(''); setGameResults([]); }}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-4)', fontSize: 18, padding: '0 4px' }}>×</button>
          </div>
        ) : (
          <>
            <input
              value={gameQuery}
              onChange={e => handleGameSearch(e.target.value)}
              placeholder="Busca un juego (opcional)..."
              style={inputStyle}
            />
            {(gameResults.length > 0 || searching) && (
              <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 50, background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, boxShadow: 'var(--shadow-card)', marginTop: 4, overflow: 'hidden' }}>
                {searching && <div style={{ padding: '12px 16px', fontSize: 13, color: 'var(--text-4)' }}>Buscando...</div>}
                {gameResults.map(g => (
                  <button key={g.id} type="button" onClick={() => { setSelectedGame(g); setGameResults([]); }}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'none', border: 'none', borderTop: '1px solid var(--border)', cursor: 'pointer', textAlign: 'left' }}>
                    {g.image_url && <img src={g.image_url} alt={g.name} loading="lazy" decoding="async" style={{ width: 32, height: 32, borderRadius: 6, objectFit: 'cover' }} />}
                    <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>{g.name}</span>
                    {g.year_published && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{g.year_published}</span>}
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Format */}
      <div>
        <label style={labelStyle}>Formato *</label>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10 }}>
          {[
            { value: 'libre', label: 'Libre', desc: 'Gestión manual total' },
            { value: 'round_robin', label: 'Round Robin', desc: 'Todos contra todos' },
            { value: 'swiss', label: 'Sistema Suizo', desc: 'Parejas por puntos' },
            { value: 'eliminacion', label: 'Eliminación', desc: 'Por brackets' },
          ].map(f => {
            const selected = selectedFormat === f.value;
            return (
              <label key={f.value} style={{ cursor: 'pointer' }} onClick={() => setSelectedFormat(f.value)}>
                <input type="radio" name="format" value={f.value} checked={selected} onChange={() => setSelectedFormat(f.value)} style={{ display: 'none' }} />
                <div style={{
                  padding: '12px 14px', borderRadius: 14,
                  border: selected ? '2px solid var(--brand)' : '2px solid var(--border)',
                  background: selected ? 'var(--brand-tint)' : 'var(--bg-card)',
                  cursor: 'pointer', transition: 'border-color 0.15s, background 0.15s',
                }}>
                  <p style={{ fontWeight: 700, fontSize: 13, color: selected ? 'var(--brand)' : 'var(--text)' }}>{f.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>{f.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="start_date">Fecha inicio</label>
          <input id="start_date" name="start_date" type="date" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="end_date">Fecha fin</label>
          <input id="end_date" name="end_date" type="date" style={inputStyle} />
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
        <div>
          <label style={labelStyle} htmlFor="location">Lugar</label>
          <input id="location" name="location" placeholder="Ej: Sala polideportiva" style={inputStyle} />
        </div>
        <div>
          <label style={labelStyle} htmlFor="max_participants">Máx. participantes</label>
          <input id="max_participants" name="max_participants" type="number" min="2" placeholder="Sin límite" style={inputStyle} />
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="prize_info">Premios / información</label>
        <input id="prize_info" name="prize_info" placeholder="Ej: Trofeo + crédito en tienda para el ganador" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">Descripción</label>
        <textarea id="description" name="description" rows={3} placeholder="Describe el torneo, reglas especiales..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      {error && (
        <div style={{ padding: '12px 16px', borderRadius: 12, background: '#fee2e2', color: '#dc2626', fontSize: 14, fontWeight: 600 }}>
          {error}
        </div>
      )}

      <button type="submit" disabled={loading} style={{ borderRadius: 16, padding: '14px', fontSize: 16, fontWeight: 700, width: '100%', border: 'none', cursor: loading ? 'not-allowed' : 'pointer', background: 'var(--brand)', color: 'white', marginTop: 4, opacity: loading ? 0.7 : 1 }}>
        {loading ? 'Creando...' : 'Crear torneo'}
      </button>
    </form>
  );
}

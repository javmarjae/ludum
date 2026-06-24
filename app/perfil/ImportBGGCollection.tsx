'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';

export function ImportBGGCollection() {
  const [open, setOpen] = useState(false);
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [message, setMessage] = useState('');
  const [imported, setImported] = useState(0);

  async function handleImport() {
    if (!username.trim()) return;
    setStatus('loading');
    setMessage('Conectando con BoardGameGeek...');

    let bggIds: number[] = [];
    let retries = 0;

    // BGG puede responder 202 (procesando) hasta 3 veces
    while (retries < 4) {
      const res = await fetch(`/api/bgg-collection?username=${encodeURIComponent(username.trim())}`);
      if (res.status === 202) {
        retries++;
        setMessage(`Esperando respuesta de BGG... (${retries}/3)`);
        await new Promise((r) => setTimeout(r, 3000));
        continue;
      }
      const data = await res.json();
      if (!res.ok || data.error) {
        setStatus('error');
        setMessage(data.error ?? 'Error al conectar con BGG');
        return;
      }
      bggIds = data.bggIds ?? [];
      break;
    }

    if (bggIds.length === 0) {
      setStatus('error');
      setMessage('No se encontraron juegos en esa colección de BGG.');
      return;
    }

    setMessage(`Encontrados ${bggIds.length} juegos. Buscando en Ludum...`);

    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setStatus('error'); setMessage('No autenticado.'); return; }

    // Buscar IDs internos por bgg_id en lotes de 100
    let internalIds: string[] = [];
    for (let i = 0; i < bggIds.length; i += 100) {
      const batch = bggIds.slice(i, i + 100);
      const { data: games } = await supabase
        .from('games')
        .select('id')
        .in('bgg_id', batch);
      if (games) internalIds = [...internalIds, ...games.map((g) => g.id)];
    }

    if (internalIds.length === 0) {
      setStatus('error');
      setMessage('Ningún juego de tu colección BGG está en el catálogo de Ludum todavía.');
      return;
    }

    // Obtener los que ya están en la colección del usuario
    const { data: existing } = await supabase
      .from('user_games')
      .select('game_id')
      .eq('profile_id', user.id)
      .in('game_id', internalIds);
    const existingSet = new Set((existing ?? []).map((e) => e.game_id));

    const toInsert = internalIds
      .filter((id) => !existingSet.has(id))
      .map((game_id) => ({ profile_id: user.id, game_id }));

    if (toInsert.length === 0) {
      setStatus('success');
      setMessage('Tu colección ya estaba actualizada.');
      setImported(0);
      return;
    }

    const { error } = await supabase.from('user_games').insert(toInsert);
    if (error) { setStatus('error'); setMessage('Error al guardar la colección.'); return; }

    setImported(toInsert.length);
    setStatus('success');
    setMessage(`¡Importados ${toInsert.length} juego${toInsert.length !== 1 ? 's' : ''} de ${bggIds.length} en BGG!`);
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} style={{
        fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 999,
        background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', border: 'none',
        color: 'var(--text-2)', cursor: 'pointer', fontFamily: 'inherit',
      }}>
        Importar desde BGG
      </button>
    );
  }

  const inputStyle: React.CSSProperties = {
    flex: 1, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
    border: '1px solid var(--border)', borderRadius: 8, color: 'var(--text)',
    padding: '10px 14px', fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit',
  };

  return (
    <div style={{ borderRadius: 10, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Importar colección de BGG</p>
        <button onClick={() => { setOpen(false); setStatus('idle'); setMessage(''); }} style={{ fontSize: 13, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 700 }}>✕</button>
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 12 }}>
        Introduce tu usuario de BoardGameGeek para importar tu colección de juegos.
      </p>

      <div style={{ display: 'flex', gap: 8, marginBottom: 12 }}>
        <input
          type="text"
          placeholder="Usuario de BGG"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && handleImport()}
          style={inputStyle}
          disabled={status === 'loading'}
        />
        <button
          onClick={handleImport}
          disabled={status === 'loading' || !username.trim()}
          style={{
            padding: '10px 18px', borderRadius: 999, fontWeight: 700, fontSize: 13,
            color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            opacity: (status === 'loading' || !username.trim()) ? 0.6 : 1,
          }}
        >
          {status === 'loading' ? '...' : 'Importar'}
        </button>
      </div>

      {message && (
        <p style={{
          fontSize: 13, fontWeight: 600, padding: '8px 12px', borderRadius: 12,
          background: status === 'error' ? 'rgba(220,38,38,0.08)' : 'var(--brand-tint)',
          color: status === 'error' ? '#dc2626' : 'var(--brand)',
        }}>
          {message}
        </p>
      )}

      {status === 'success' && (
        <button
          onClick={() => window.location.reload()}
          style={{
            marginTop: 10, fontSize: 13, fontWeight: 700, padding: '8px 16px', borderRadius: 999,
            background: 'var(--brand)', color: 'white', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Ver mi colección actualizada →
        </button>
      )}
    </div>
  );
}

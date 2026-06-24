'use client';

import { useState } from 'react';
import { deleteGroup } from '@/app/grupos/actions';

export function DeleteGroupButton({ groupId }: { groupId: string }) {
  const [confirming, setConfirming] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setLoading(true);
    const result = await deleteGroup(groupId);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
      setConfirming(false);
    }
  }

  if (!confirming) {
    return (
      <button
        onClick={() => setConfirming(true)}
        style={{
          padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
          color: '#c0392b', background: 'rgba(192,57,43,0.08)', border: '1px solid rgba(192,57,43,0.2)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        Eliminar grupo
      </button>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
      {error && <p style={{ fontSize: 12, color: '#c0392b', fontWeight: 600 }}>{error}</p>}
      <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', textAlign: 'right' }}>
        ¿Seguro? Se borrarán todos los datos del grupo.
      </p>
      <div style={{ display: 'flex', gap: 8 }}>
        <button
          onClick={() => setConfirming(false)}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            color: 'var(--text-2)', background: 'var(--bg-inset)', border: '1px solid var(--border)',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Cancelar
        </button>
        <button
          onClick={handleDelete}
          disabled={loading}
          style={{
            padding: '8px 16px', borderRadius: 999, fontSize: 13, fontWeight: 700,
            color: 'white', background: '#c0392b', border: 'none',
            cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
          }}
        >
          {loading ? 'Eliminando...' : 'Sí, eliminar'}
        </button>
      </div>
    </div>
  );
}

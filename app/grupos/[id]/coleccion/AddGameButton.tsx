'use client';

import { useState } from 'react';
import { addGameToCollection, removeGameFromCollection } from '../actions';

interface Props {
  groupId: string;
  gameId: string;
  inCollection: boolean;
}

export function AddGameButton({ groupId, gameId, inCollection: initialInCollection }: Props) {
  const [inCollection, setInCollection] = useState(initialInCollection);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (inCollection) {
      await removeGameFromCollection(groupId, gameId);
      setInCollection(false);
    } else {
      await addGameToCollection(groupId, gameId);
      setInCollection(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.15s', border: 'none',
        ...(inCollection
          ? { background: 'rgba(58,55,47,0.08)', color: 'var(--text-2)', border: '1px solid rgba(58,55,47,0.18)' }
          : { background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.25)' }
        ),
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {loading ? '...' : inCollection ? 'Quitar' : '+ Añadir'}
    </button>
  );
}

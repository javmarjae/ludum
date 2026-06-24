'use client';

import { useState } from 'react';
import { addGameToCatalog, removeGameFromCatalog } from '../../actions';

interface Props {
  orgId: string;
  gameId: string;
  inCatalog: boolean;
}

export function AddCatalogButton({ orgId, gameId, inCatalog: initial }: Props) {
  const [inCatalog, setInCatalog] = useState(initial);
  const [loading, setLoading] = useState(false);

  async function toggle() {
    setLoading(true);
    if (inCatalog) {
      await removeGameFromCatalog(orgId, gameId);
      setInCatalog(false);
    } else {
      await addGameToCatalog(orgId, gameId);
      setInCatalog(true);
    }
    setLoading(false);
  }

  return (
    <button
      onClick={toggle}
      disabled={loading}
      style={{
        flexShrink: 0, padding: '6px 14px', borderRadius: 999, fontSize: 12, fontWeight: 700,
        cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.15s',
        background: inCatalog ? 'rgba(58,55,47,0.08)' : 'var(--brand-tint)',
        color: inCatalog ? 'var(--text-2)' : 'var(--brand)',
        border: inCatalog ? '1px solid rgba(58,55,47,0.18)' : '1px solid rgba(62,94,59,0.25)',
        opacity: loading ? 0.5 : 1,
      }}
      onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.05)'; }}
      onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {loading ? '...' : inCatalog ? 'Quitar' : '+ Añadir'}
    </button>
  );
}

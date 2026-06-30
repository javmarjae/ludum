'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addGameToUserCollection, removeGameFromUserCollection } from '@/app/perfil/actions';

type State = 'loading' | 'anon' | 'in' | 'out';

export function CollectionButton({ gameId }: { gameId: string }) {
  const [state, setState] = useState<State>('loading');
  const [toast, setToast] = useState<{ msg: string; added: boolean } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setState('anon'); return; }
      supabase
        .from('user_games')
        .select('id')
        .eq('profile_id', user.id)
        .eq('game_id', gameId)
        .eq('in_wishlist', false)
        .single()
        .then(({ data }) => setState(data ? 'in' : 'out'));
    });
  }, [gameId]);

  function showToast(msg: string, added: boolean) {
    setToast({ msg, added });
    setTimeout(() => setToast(null), 5000);
  }

  async function toggle() {
    if (state === 'in') {
      setState('out');
      await removeGameFromUserCollection(gameId);
      showToast('Eliminado de tu colección', false);
    } else if (state === 'out') {
      setState('in');
      await addGameToUserCollection(gameId);
      showToast('Añadido a tu colección', true);
    }
  }

  if (state === 'loading' || state === 'anon') return null;

  const isIn = state === 'in';

  return (
    <>
      <button
        onClick={toggle}
        title={isIn ? 'Quitar de mi colección' : 'Añadir a mi colección'}
        aria-label={isIn ? 'Quitar de mi colección' : 'Añadir a mi colección'}
        aria-pressed={isIn}
        style={{
          width: 36, height: 36, borderRadius: '50%',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
          border: 'none', flexShrink: 0,
          background: isIn ? 'var(--brand)' : 'var(--bg-inset)',
          color: isIn ? 'white' : 'var(--text-3)',
          boxShadow: isIn ? 'var(--shadow-btn-brand)' : 'var(--shadow-btn)',
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        }}
      >
        {isIn ? '✓' : '+'}
      </button>

      {toast && (
        <div
          role="status"
          aria-live="polite"
          style={{
            position: 'fixed', top: 80, left: '50%',
            transform: 'translateX(-50%)',
            animation: 'toast-in 0.2s ease',
            background: 'var(--bg-card)', color: 'var(--text)',
            padding: '11px 22px', borderRadius: 14,
            boxShadow: 'var(--shadow-card)',
            border: '1px solid var(--border)',
            fontSize: 14, fontWeight: 700, zIndex: 9999,
            display: 'flex', alignItems: 'center', gap: 8,
            whiteSpace: 'nowrap', pointerEvents: 'none',
          }}
        >
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
            background: toast.added ? 'var(--brand)' : 'var(--bg-inset)',
            color: toast.added ? 'white' : 'var(--text-3)',
          }}>
            {toast.added ? '✓' : '×'}
          </span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

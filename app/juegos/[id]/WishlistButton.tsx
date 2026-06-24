'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { addToWishlist, removeFromWishlist } from '@/app/perfil/actions';

type State = 'loading' | 'anon' | 'in' | 'owned' | 'out';

export function WishlistButton({ gameId }: { gameId: string }) {
  const [state, setState] = useState<State>('loading');
  const [toast, setToast] = useState<{ msg: string; added: boolean } | null>(null);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) { setState('anon'); return; }
      supabase
        .from('user_games')
        .select('in_wishlist')
        .eq('profile_id', user.id)
        .eq('game_id', gameId)
        .single()
        .then(({ data }) => {
          if (!data) setState('out');
          else if (data.in_wishlist) setState('in');
          else setState('owned');
        });
    });
  }, [gameId]);

  function showToast(msg: string, added: boolean) {
    setToast({ msg, added });
    setTimeout(() => setToast(null), 4000);
  }

  async function toggle() {
    if (state === 'in') {
      setState('out');
      await removeFromWishlist(gameId);
      showToast('Eliminado de tu lista de deseos', false);
    } else if (state === 'out') {
      setState('in');
      await addToWishlist(gameId);
      showToast('Añadido a tu lista de deseos', true);
    }
  }

  if (state === 'loading' || state === 'anon') return null;

  const isIn = state === 'in';
  const isOwned = state === 'owned';

  return (
    <>
      <button
        onClick={toggle}
        disabled={isOwned}
        title={isOwned ? 'Ya está en tu colección' : isIn ? 'Quitar de lista de deseos' : 'Añadir a lista de deseos'}
        style={{
          display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          width: '100%', padding: '10px 14px', borderRadius: 12,
          fontSize: 12, fontWeight: 700,
          cursor: isOwned ? 'default' : 'pointer',
          fontFamily: 'inherit',
          border: isIn
            ? '1.5px solid var(--brand)'
            : '1.5px solid var(--border)',
          background: isIn ? 'var(--brand-tint)' : 'var(--bg-card)',
          color: isIn ? 'var(--brand)' : isOwned ? 'var(--text-4)' : 'var(--text-3)',
          boxShadow: 'var(--shadow-btn)',
          transition: 'all 0.15s',
          opacity: isOwned ? 0.65 : 1,
        }}
      >
        {isOwned ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
            Ya en tu colección
          </>
        ) : isIn ? (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            En lista de deseos
          </>
        ) : (
          <>
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
            </svg>
            Añadir a lista de deseos
          </>
        )}
      </button>

      {toast && (
        <div style={{
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
        }}>
          <span style={{
            width: 20, height: 20, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 11, fontWeight: 800,
            background: toast.added ? 'var(--brand)' : 'var(--bg-inset)',
            color: toast.added ? 'white' : 'var(--text-3)',
          }}>
            {toast.added ? '♥' : '×'}
          </span>
          {toast.msg}
        </div>
      )}
    </>
  );
}

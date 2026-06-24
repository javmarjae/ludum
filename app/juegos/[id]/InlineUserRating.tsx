'use client';

import { useGameRating } from './GameRatingContext';

export function InlineUserRating() {
  const { rating, visible } = useGameRating();

  if (!visible) return null;

  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 3,
      fontSize: 13, fontWeight: 700,
      color: rating ? 'var(--brand)' : 'var(--text-4)',
      marginLeft: 2,
    }}>
      · ★ {rating ? `${rating}/5` : '—'}
    </span>
  );
}

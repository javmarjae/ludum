'use client';

import { useState } from 'react';
import { rateGame } from '@/app/perfil/actions';
import { useGameRating } from './GameRatingContext';

function StarIcon({ filled, half }: { filled: boolean; half: boolean }) {
  return (
    <div style={{ position: 'relative', display: 'inline-block', width: 30, height: 32, flexShrink: 0 }}>
      {/* Estrella vacía (fondo) */}
      <span style={{ fontSize: 28, color: 'var(--sand)', lineHeight: 1, display: 'block' }}>★</span>
      {/* Estrella rellena encima, recortada al 50% si es media */}
      {(filled || half) && (
        <span style={{
          position: 'absolute', inset: 0,
          fontSize: 28, color: 'var(--brand)', lineHeight: 1,
          overflow: 'hidden', whiteSpace: 'nowrap',
          width: half ? '50%' : '100%',
          display: 'block',
        }}>
          ★
        </span>
      )}
    </div>
  );
}

export function StarRating({ gameId }: { gameId: string }) {
  const { rating, setRating, visible } = useGameRating();
  const [hovered, setHovered] = useState<number | null>(null);
  const [saving, setSaving] = useState(false);

  if (!visible) return null;

  async function handleRate(value: number) {
    if (saving) return;
    const next = rating === value ? null : value;
    setRating(next);
    setSaving(true);
    await rateGame(gameId, next);
    setSaving(false);
  }

  const display = hovered ?? rating ?? 0;

  return (
    <div style={{
      display: 'flex', flexDirection: 'column', gap: 8,
      padding: '18px 20px', borderRadius: 20,
      background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
    }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Tu valoración
      </span>

      <div style={{ display: 'flex', gap: 4, alignItems: 'center' }} onMouseLeave={() => setHovered(null)}>
        {[1, 2, 3, 4, 5].map((star) => {
          const full = display >= star;
          const half = !full && display >= star - 0.5;
          return (
            <div
              key={star}
              style={{ position: 'relative', width: 34, height: 32, cursor: 'pointer' }}
            >
              <StarIcon filled={full} half={half} />
              {/* Mitad izquierda → media estrella */}
              <div
                style={{ position: 'absolute', left: 0, top: 0, width: '50%', height: '100%' }}
                onMouseEnter={() => setHovered(star - 0.5)}
                onClick={() => handleRate(star - 0.5)}
              />
              {/* Mitad derecha → estrella entera */}
              <div
                style={{ position: 'absolute', right: 0, top: 0, width: '50%', height: '100%' }}
                onMouseEnter={() => setHovered(star)}
                onClick={() => handleRate(star)}
              />
            </div>
          );
        })}
      </div>

        {rating !== null && (
          <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--brand)', marginLeft: 4 }}>
            {rating}/5
          </span>
        )}
        {saving && <span style={{ fontSize: 13, color: 'var(--text-4)', marginLeft: 4 }}>···</span>}
    </div>
  );
}

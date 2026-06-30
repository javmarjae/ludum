'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useState } from 'react';
import type { GameResult } from '@/lib/recommender';

function playerIcon(min: number): string {
  if (min <= 1) return '/icons/solo.svg';
  if (min <= 2) return '/icons/pareja.svg';
  if (min <= 4) return '/icons/grupo.svg';
  return '/icons/pandilla.svg';
}

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8 ? '#16a34a' : rating >= 7 ? '#d97706' : '#71717A';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${color}18`, color }}>
      ★ {rating.toFixed(1)}
    </span>
  );
}

interface Props {
  game: GameResult;
  index: number;
  inCollection?: boolean;
  onCollectionToggle?: () => void;
}

export function GameCard({ game, index, inCollection, onCollectionToggle }: Props) {
  const [btnHovered, setBtnHovered] = useState(false);
  const showBtn = onCollectionToggle !== undefined;

  return (
    <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="hover-scale-md"
        style={{ borderRadius: 10, padding: 14, display: 'flex', gap: 14, alignItems: 'flex-start', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Rank badge */}
        <div style={{
          width: 28, height: 28, borderRadius: 6, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 12, fontWeight: 800, flexShrink: 0, marginTop: 2,
          background: index < 3 ? 'linear-gradient(135deg, #89BA86 0%, #3E5E3B 100%)' : 'var(--bg-inset)',
          color: index < 3 ? 'white' : 'var(--text-4)',
          boxShadow: index < 3 ? '0 2px 6px rgba(62,94,59,0.30)' : 'none',
        }}>
          {index + 1}
        </div>

        {/* Image */}
        {game.image_url ? (
          <div style={{ position: 'relative', width: 48, height: 64, borderRadius: 8, overflow: 'hidden', flexShrink: 0 }}>
            <Image src={game.image_url} alt={game.name} fill sizes="48px" style={{ objectFit: 'cover' }} />
          </div>
        ) : (
          <div style={{ width: 48, height: 64, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 26, flexShrink: 0, background: 'var(--bg-inset)' }}>
            🎲
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, marginBottom: 4 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {game.name}
            </h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
              {game.bgg_rating && <RatingBadge rating={game.bgg_rating} />}
              {showBtn && (
                <button
                  onClick={(e) => { e.preventDefault(); e.stopPropagation(); onCollectionToggle!(); }}
                  onMouseEnter={() => setBtnHovered(true)}
                  onMouseLeave={() => setBtnHovered(false)}
                  title={inCollection ? 'Quitar de mi colección' : 'Añadir a mi colección'}
                  style={{
                    width: 28, height: 28, borderRadius: 8, flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 14, fontWeight: 800, cursor: 'pointer', fontFamily: 'inherit',
                    transition: 'all 0.12s',
                    background: inCollection
                      ? 'var(--brand-tint)'
                      : btnHovered ? 'var(--brand-tint)' : 'var(--bg-inset)',
                    color: inCollection || btnHovered ? 'var(--brand)' : 'var(--text-4)',
                    border: inCollection || btnHovered
                      ? '1px solid rgba(62,94,59,0.25)'
                      : '1px solid transparent',
                  }}
                >
                  {inCollection ? '✓' : '+'}
                </button>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            {game.year_published && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</span>}
            {game.bgg_rank && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>#{game.bgg_rank} BGG</span>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {game.min_players && game.max_players && (
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                <img src={playerIcon(game.min_players)} alt="" aria-hidden="true" style={{ width: 13, height: 13 }} />
                {game.min_players === game.max_players ? game.min_players : `${game.min_players}–${game.max_players}`}
              </span>
            )}
            {game.min_playtime && (
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                ⏱ {game.max_playtime && game.min_playtime !== game.max_playtime ? `${game.min_playtime}–${game.max_playtime}` : game.min_playtime} min
              </span>
            )}
            {game.complexity && (
              <span style={{ fontSize: 11, padding: '2px 7px', borderRadius: 4, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                🧠 {game.complexity.toFixed(1)}/5
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

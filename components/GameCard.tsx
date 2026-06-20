'use client';

import Link from 'next/link';
import Image from 'next/image';
import type { GameResult } from '@/lib/recommender';

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 8 ? '#16a34a' : rating >= 7 ? '#d97706' : '#71717A';
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 8, fontSize: 11, fontWeight: 700, background: `${color}18`, color }}>
      ★ {rating.toFixed(1)}
    </span>
  );
}

export function GameCard({ game, index }: { game: GameResult; index: number }) {
  return (
    <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'block', textDecoration: 'none' }}>
      <div
        className="hover-scale-md"
        style={{ borderRadius: 24, padding: 16, display: 'flex', gap: 16, alignItems: 'flex-start', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}
      >
        {/* Rank badge */}
        <div style={{
          width: 32, height: 32, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 13, fontWeight: 800, flexShrink: 0, marginTop: 2,
          background: index < 3 ? 'linear-gradient(180deg, #89BA86 0%, #3E5E3B 100%)' : 'var(--bg-inset)',
          color: index < 3 ? 'white' : 'var(--text-4)',
          boxShadow: index < 3 ? '0 3px 10px rgba(62,94,59,0.35)' : 'var(--shadow-btn)',
        }}>
          {index + 1}
        </div>

        {/* Image */}
        {game.image_url ? (
          <Image
            src={game.image_url}
            alt={game.name}
            width={64}
            height={64}
            style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }}
          />
        ) : (
          <div style={{ width: 64, height: 64, borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, flexShrink: 0, background: 'var(--bg-inset)' }}>
            🎲
          </div>
        )}

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, flexWrap: 'wrap', marginBottom: 4 }}>
            <h3 style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {game.name}
            </h3>
            {game.bgg_rating && <RatingBadge rating={game.bgg_rating} />}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8, flexWrap: 'wrap' }}>
            {game.year_published && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{game.year_published}</span>}
            {game.bgg_rank && <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>#{game.bgg_rank} BGG</span>}
          </div>

          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {game.min_players && game.max_players && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                👥 {game.min_players === game.max_players ? game.min_players : `${game.min_players}–${game.max_players}`}
              </span>
            )}
            {game.min_playtime && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                ⏱ {game.max_playtime && game.min_playtime !== game.max_playtime ? `${game.min_playtime}–${game.max_playtime}` : game.min_playtime} min
              </span>
            )}
            {game.complexity && (
              <span style={{ fontSize: 11, padding: '3px 8px', borderRadius: 8, fontWeight: 600, background: 'var(--bg-inset)', color: 'var(--text-3)' }}>
                🧠 {game.complexity.toFixed(1)}/5
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

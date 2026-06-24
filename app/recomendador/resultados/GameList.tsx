'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { GameCard } from '@/components/GameCard';
import { addGameToUserCollection, removeGameFromUserCollection } from '@/app/perfil/actions';
import type { GameResult } from '@/lib/recommender';

const PAGE_SIZE = 12;

export function GameList({ games }: { games: GameResult[] }) {
  const [showing, setShowing] = useState(PAGE_SIZE);
  const [collectionIds, setCollectionIds] = useState<Set<string>>(new Set());

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      const ids = games.map((g) => g.id);
      supabase
        .from('user_games')
        .select('game_id')
        .eq('profile_id', user.id)
        .in('game_id', ids)
        .then(({ data }) => {
          setCollectionIds(new Set(data?.map((r) => r.game_id) ?? []));
        });
    });
  }, [games]);

  async function toggleCollection(game: GameResult) {
    if (collectionIds.has(game.id)) {
      setCollectionIds((prev) => { const n = new Set(prev); n.delete(game.id); return n; });
      await removeGameFromUserCollection(game.id);
    } else {
      setCollectionIds((prev) => new Set(prev).add(game.id));
      await addGameToUserCollection(game.id);
    }
  }

  const visible = games.slice(0, showing);
  const remaining = Math.min(games.length, 100) - showing;

  return (
    <div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {visible.map((game, i) => (
          <GameCard
            key={game.bgg_id}
            game={game}
            index={i}
            inCollection={collectionIds.has(game.id)}
            onCollectionToggle={() => toggleCollection(game)}
          />
        ))}
      </div>
      {remaining > 0 && (
        <button
          onClick={() => setShowing((s) => Math.min(s + PAGE_SIZE, 100))}
          style={{
            display: 'block', width: '100%', marginTop: 16,
            padding: '14px', borderRadius: 999,
            fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit',
            background: 'var(--bg-card)', border: '1.5px solid var(--border)',
            color: 'var(--text-2)', boxShadow: 'var(--shadow-btn)',
          }}
        >
          Ver {Math.min(remaining, PAGE_SIZE)} más →
        </button>
      )}
    </div>
  );
}

'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';

interface RatingCtx {
  rating: number | null;
  setRating: (r: number | null) => void;
  visible: boolean;
}

const Ctx = createContext<RatingCtx>({ rating: null, setRating: () => {}, visible: false });

export function GameRatingProvider({ gameId, children }: { gameId: string; children: React.ReactNode }) {
  const [rating, setRating] = useState<number | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      setVisible(true);
      supabase
        .from('user_games')
        .select('rating')
        .eq('profile_id', user.id)
        .eq('game_id', gameId)
        .single()
        .then(({ data }) => { if (data?.rating) setRating(data.rating); });
    });
  }, [gameId]);

  return <Ctx.Provider value={{ rating, setRating, visible }}>{children}</Ctx.Provider>;
}

export function useGameRating() {
  return useContext(Ctx);
}

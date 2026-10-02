import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';

/* La home autenticada solo necesita beginnerGames para el dashboard,
   así que separamos la query pesada de la landing pública. */
export const getBeginnerGames = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('games')
      .select('bgg_id, name, image_url, min_players, max_players, min_playtime, max_playtime')
      .gt('bgg_rank', 0)
      .not('image_url', 'is', null)
      .gte('complexity', 1)
      .lte('complexity', 2.5)
      .order('bgg_rank', { ascending: true })
      .limit(16);
    return data ?? [];
  },
  ['home-beginner-games-v2'],
  { revalidate: 3600 }
);

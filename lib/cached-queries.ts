import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';

function getPublicSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* Cliente admin (service role) para consultas globales sobre tablas con RLS.
   `plays` tiene RLS "Group members can view plays", así que el cliente anónimo
   devolvería siempre vacío. El service role solo se usa en servidor. */
function getAdminSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
}

/* Juegos más jugados en las últimas 2 semanas (para buscar/page).
   Caché 30 min. Lectura global → requiere admin client (RLS en plays). */
export const getTrendingGames = unstable_cache(
  async () => {
    const supabase = getAdminSupabase();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();
    const { data, error } = await supabase
      .from('plays')
      .select('games(bgg_id, name, image_url, is_expansion)')
      .gte('played_at', twoWeeksAgo)
      .limit(150);

    if (error) console.error('[cached-queries] getTrendingGames:', error.message);

    const freq: Record<string, { bgg_id: number; name: string; image_url: string | null; is_expansion: boolean | null; count: number }> = {};
    for (const row of data ?? []) {
      const g = (row as any).games;
      if (!g?.bgg_id || !g?.image_url) continue;
      if (!freq[g.bgg_id]) freq[g.bgg_id] = { bgg_id: g.bgg_id, name: g.name, image_url: g.image_url, is_expansion: g.is_expansion ?? null, count: 0 };
      freq[g.bgg_id].count++;
    }
    return Object.values(freq)
      .sort((a, b) => b.count - a.count)
      .slice(0, 14);
  },
  ['buscar-trending-games'],
  { revalidate: 1800 }
);

/* Mejor valorados BGG (top 10). Caché 1 hora. */
export const getTopRatedGames = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, name, image_url, bgg_rating, year_published, is_expansion')
      .not('bgg_rating', 'is', null)
      .not('is_expansion', 'is', true)
      .order('bgg_rating', { ascending: false })
      .limit(10);
    if (error) console.error('[cached-queries] getTopRatedGames:', error.message);
    return data ?? [];
  },
  ['top-rated-games-v4'],
  { revalidate: 3600 }
);

/* Top juegos BGG para el recomendador (80 juegos, caché 1 hora). */
const RECOMMENDER_GAME_SELECT =
  'id, bgg_id, name, year_published, bgg_rank, bgg_rating, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description';

export const getCachedRecommenderGames = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    const [{ data: main, error: mainErr }, { data: trending, error: trendingErr }] = await Promise.all([
      supabase
        .from('games')
        .select(RECOMMENDER_GAME_SELECT)
        .not('bgg_rank', 'is', null)
        .not('bgg_rating', 'is', null)
        .gte('bgg_rating', 7.0)
        .order('bgg_rating', { ascending: false })
        .limit(80),
      supabase
        .from('games')
        .select(RECOMMENDER_GAME_SELECT)
        .not('bgg_rank', 'is', null)
        .gte('bgg_rating', 7.5)
        .order('bgg_rating', { ascending: false })
        .range(8, 26),
    ]);
    // Throw on error or empty so unstable_cache never stores a failed result
    if (mainErr) throw new Error(mainErr.message);
    if (!main || main.length === 0) throw new Error('recommender: no games returned');
    if (trendingErr) console.error('[cached-queries] getCachedRecommenderGames trending:', trendingErr.message);
    // Use a slice of main as fallback so trending is never silently cached as []
    return { main, trending: (trending && trending.length > 0) ? trending : main.slice(8, 27) };
  },
  ['recommender-games'],
  { revalidate: 3600 }
);

/* Novedades (últimos 2 años, ordenados por rating). Caché 1 hora. */
export const getNewGames = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id, name, image_url, bgg_rating, year_published, is_expansion')
      .not('year_published', 'is', null)
      .not('bgg_rating', 'is', null)
      .gte('year_published', new Date().getFullYear() - 1)
      .lte('year_published', new Date().getFullYear())
      .order('bgg_rating', { ascending: false })
      .limit(15);
    if (error) console.error('[cached-queries] getNewGames:', error.message);
    return data ?? [];
  },
  ['new-games-v5'],
  { revalidate: 3600 }
);

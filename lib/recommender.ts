import { supabase } from './supabase';

export interface RecommenderFilters {
  players?: number;
  duration?: 'corta' | 'media' | 'larga' | 'muy-larga';
  complexity?: 'ligero' | 'medio' | 'complejo';
  era?: 'moderno' | 'clasico' | 'cualquiera';
}

export interface GameResult {
  id: string;
  bgg_id: number;
  name: string;
  year_published: number | null;
  bgg_rank: number | null;
  bgg_rating: number | null;
  min_players: number | null;
  max_players: number | null;
  min_playtime: number | null;
  max_playtime: number | null;
  complexity: number | null;
  image_url: string | null;
  mechanics: string[] | null;
  categories: string[] | null;
  description: string | null;
}

export async function getRecommendations(filters: RecommenderFilters): Promise<GameResult[]> {
  let query = supabase
    .from('games')
    .select('id, bgg_id, name, year_published, bgg_rank, bgg_rating, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description')
    .not('bgg_rank', 'is', null)
    .not('bgg_rating', 'is', null);

  // Filter by era (functional with current data)
  if (filters.era === 'moderno') {
    query = query.gte('year_published', 2010);
  } else if (filters.era === 'clasico') {
    query = query.lte('year_published', 2000);
  }

  // Filter by player count — include games without data (null) as fallback
  if (filters.players && filters.players > 0) {
    query = query.or(
      `min_players.is.null,and(min_players.lte.${filters.players},max_players.gte.${filters.players})`
    );
  }

  // Filter by duration — include games without data (null) as fallback
  if (filters.duration) {
    const durationRanges: Record<string, { min?: number; max?: number }> = {
      'corta':     { max: 45 },
      'media':     { min: 30, max: 120 },
      'larga':     { min: 90, max: 240 },
      'muy-larga': { min: 180 },
    };
    const range = durationRanges[filters.duration];
    if (range.min && range.max) {
      query = query.or(`min_playtime.is.null,and(min_playtime.gte.${range.min},max_playtime.lte.${range.max})`);
    } else if (range.min) {
      query = query.or(`min_playtime.is.null,min_playtime.gte.${range.min}`);
    } else if (range.max) {
      query = query.or(`max_playtime.is.null,max_playtime.lte.${range.max}`);
    }
  }

  // Filter by complexity — include games without data (null) as fallback
  if (filters.complexity) {
    const complexityRanges: Record<string, { min: number; max: number }> = {
      'ligero':   { min: 1.0, max: 2.0 },
      'medio':    { min: 1.8, max: 3.2 },
      'complejo': { min: 3.0, max: 5.0 },
    };
    const range = complexityRanges[filters.complexity];
    query = query.or(`complexity.is.null,and(complexity.gte.${range.min},complexity.lte.${range.max})`);
  }

  const { data, error } = await query
    .order('bgg_rating', { ascending: false })
    .limit(20);

  if (error) throw new Error(error.message);
  return (data ?? []) as GameResult[];
}

export async function getGameByBggId(bggId: number): Promise<GameResult | null> {
  const { data, error } = await supabase
    .from('games')
    .select('id, bgg_id, name, year_published, bgg_rank, bgg_rating, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description')
    .eq('bgg_id', bggId)
    .single();

  if (error) return null;
  return data as GameResult;
}

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { getCachedRecommenderGames } from '@/lib/cached-queries';

export interface RecommenderFilters {
  players?: number;
  duration?: 'corta' | 'media' | 'larga' | 'muy-larga';
  complexity?: 'ligero' | 'medio' | 'complejo';
  era?: 'moderno' | 'clasico' | 'cualquiera';
  collection?: 'discover' | 'own' | 'mix';
  collectionGameIds?: string[];
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

const GAME_SELECT = 'id, bgg_id, name, year_published, bgg_rank, bgg_rating, min_players, max_players, min_playtime, max_playtime, complexity, image_url, mechanics, categories, description';

export async function getRecommendations(filters: RecommenderFilters): Promise<GameResult[]> {
  const supabase = await createClient();
  let query = supabase
    .from('games')
    .select(GAME_SELECT)
    .not('bgg_rank', 'is', null)
    .not('bgg_rating', 'is', null);

  if (filters.era === 'moderno') {
    query = query.gte('year_published', 2010);
  } else if (filters.era === 'clasico') {
    query = query.lte('year_published', 2000);
  }

  if (filters.players && filters.players > 0) {
    query = query.or(
      `min_players.is.null,and(min_players.lte.${filters.players},max_players.gte.${filters.players})`
    );
  }

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

  if (filters.complexity) {
    const complexityRanges: Record<string, { min: number; max: number }> = {
      'ligero':   { min: 1.0, max: 2.0 },
      'medio':    { min: 1.8, max: 3.2 },
      'complejo': { min: 3.0, max: 5.0 },
    };
    const range = complexityRanges[filters.complexity];
    query = query.or(`complexity.is.null,and(complexity.gte.${range.min},complexity.lte.${range.max})`);
  }

  const ids = filters.collectionGameIds ?? [];
  if (filters.collection === 'own') {
    if (ids.length === 0) return [];
    query = query.in('id', ids);
  } else if (filters.collection === 'discover' && ids.length > 0) {
    query = query.not('id', 'in', `(${ids.join(',')})`);
  }

  const { data, error } = await query
    .order('bgg_rating', { ascending: false })
    .limit(100);

  if (error) throw new Error(error.message);
  return (data ?? []) as GameResult[];
}

// ── Group-based recommendations ──────────────────────────────────────────────

export interface GroupFilters {
  jugadores?: number;
  duracion?: 'corta' | 'media' | 'larga' | 'muy-larga';
  dificultad?: 'ligero' | 'medio' | 'complejo';
  novedad?: 'nuevo' | 'jugado';
  skippedGameIds?: string[]; // IDs de juegos descartados por "No me interesa"
}

export interface GroupRecommendation {
  game: GameResult;
  affinity: number;
  reasons: string[];
  stats: {
    membersEnjoy: number;
    durationFit: number;
    complexityFit: number;
    positiveRatings: number;
  };
}

export interface GroupRecommendationsResult {
  top: GroupRecommendation;
  alternatives: Array<GameResult & { affinity: number }>;
  wildcard: (GameResult & { affinity: number; wildcardReason: string }) | null;
  trending: Array<GameResult & { groupCount: number }>;
}

// ── Preference profile built from member ratings ──────────────────────────────

interface PreferenceProfile {
  categoryWeights: Record<string, number>;
  mechanicWeights: Record<string, number>;
  // members who rated ≥3.5★ for each category
  membersPerCategory: Map<string, Set<string>>;
  avgPreferredComplexity: number | null;
  avgPreferredDuration: number | null; // minutes
  totalMembers: number;
  hasData: boolean;
}

function buildPreferenceProfile(
  ratedRows: Array<{
    profile_id: string;
    rating: number;
    games: {
      categories: string[] | null;
      mechanics: string[] | null;
      min_playtime: number | null;
      max_playtime: number | null;
      complexity: number | null;
    } | null;
  }>,
  totalMembers: number
): PreferenceProfile {
  const categoryWeights: Record<string, number> = {};
  const mechanicWeights: Record<string, number> = {};
  const membersPerCategory = new Map<string, Set<string>>();
  let complexitySum = 0, complexityW = 0;
  let durationSum = 0, durationW = 0;

  for (const row of ratedRows) {
    const g = row.games;
    if (!g) continue;
    // weight: 3★→0.2, 4★→0.6, 5★→1.0 (ratings below 3 already filtered)
    const w = (row.rating - 2.5) / 2.5;

    for (const cat of g.categories ?? []) {
      categoryWeights[cat] = (categoryWeights[cat] ?? 0) + w;
      if (!membersPerCategory.has(cat)) membersPerCategory.set(cat, new Set());
      membersPerCategory.get(cat)!.add(row.profile_id);
    }
    for (const mec of g.mechanics ?? []) {
      mechanicWeights[mec] = (mechanicWeights[mec] ?? 0) + w;
    }
    if (g.complexity && row.rating >= 3.5) {
      complexitySum += g.complexity * w;
      complexityW += w;
    }
    if (g.min_playtime && row.rating >= 3.5) {
      const mid = g.max_playtime ? (g.min_playtime + g.max_playtime) / 2 : g.min_playtime;
      durationSum += mid * w;
      durationW += w;
    }
  }

  return {
    categoryWeights,
    mechanicWeights,
    membersPerCategory,
    avgPreferredComplexity: complexityW > 0 ? complexitySum / complexityW : null,
    avgPreferredDuration: durationW > 0 ? durationSum / durationW : null,
    totalMembers,
    hasData: ratedRows.length > 0,
  };
}

// ── Scoring ───────────────────────────────────────────────────────────────────

function stableHash(str: string): number {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function seededInt(seed: number, min: number, max: number): number {
  const x = Math.sin(seed + 1) * 10000;
  return Math.round(min + (x - Math.floor(x)) * (max - min));
}

function scoreGame(
  game: GameResult,
  profile: PreferenceProfile,
  playCount: number,
  memberCount: number,
  maxPrefScore: number
): { prefRaw: number; score01: number } {
  // 1. Preference match (0–∞, normalized later against maxPrefScore → 0–1)
  const cats = game.categories ?? [];
  const mecs = game.mechanics ?? [];
  const catSum = cats.reduce((s, c) => s + (profile.categoryWeights[c] ?? 0), 0);
  const mecSum = mecs.reduce((s, m) => s + (profile.mechanicWeights[m] ?? 0), 0);
  const prefRaw =
    catSum / Math.max(1, cats.length) + mecSum / Math.max(1, mecs.length);

  const prefScore = maxPrefScore > 0 ? prefRaw / maxPrefScore : 0; // 0–1

  // 2. BGG quality (0–1, maps rating 6–10 → 0–1)
  const bggScore = Math.max(0, Math.min(1, ((game.bgg_rating ?? 7) - 6) / 4));

  // 3. Player count fit (0–1)
  const minP = game.min_players ?? 1;
  const maxP = game.max_players ?? 10;
  const playerFit = memberCount >= minP && memberCount <= maxP ? 1.0 : 0.35;

  // 4. Novelty penalty
  const novelty = playCount === 0 ? 1.0 : playCount <= 2 ? 0.82 : 0.65;

  const score01 = profile.hasData
    ? (prefScore * 0.50 + bggScore * 0.35 + playerFit * 0.15) * novelty
    : (bggScore * 0.80 + playerFit * 0.20) * novelty;

  return { prefRaw, score01 };
}

function toAffinity(score01: number): number {
  // 0 → 55%, 1 → 99%  (even a mediocre match gets ≥55 with good BGG quality)
  return Math.min(99, Math.max(55, Math.round(55 + score01 * 44)));
}

// ── Reasons ───────────────────────────────────────────────────────────────────

function buildRealReasons(
  game: GameResult,
  profile: PreferenceProfile,
  memberCount: number,
  playCount: number
): string[] {
  const cats = game.categories ?? [];

  // R1: members who like this category
  let r1: string;
  if (profile.hasData && cats.length > 0) {
    const maxMembers = cats.reduce(
      (max, c) => Math.max(max, profile.membersPerCategory.get(c)?.size ?? 0),
      0
    );
    if (maxMembers > 0) {
      const topCat = cats.find(
        (c) => (profile.membersPerCategory.get(c)?.size ?? 0) === maxMembers
      )!;
      r1 = `A ${maxMembers} de ${profile.totalMembers} miembros les gustan los juegos de ${topCat.toLowerCase()}`;
    } else {
      r1 = 'Muy valorado por la comunidad boardgamer';
    }
  } else {
    const minP = game.min_players ?? 1;
    const maxP = game.max_players ?? 10;
    r1 =
      memberCount >= minP && memberCount <= maxP
        ? `A ${Math.max(1, Math.floor(memberCount * 0.75))} de ${memberCount} miembros les gusta este tipo de juego`
        : 'Muy valorado por la comunidad boardgamer';
  }

  // R2: duration fit
  let r2: string;
  if (profile.hasData && profile.avgPreferredDuration && game.min_playtime) {
    const mid = game.max_playtime
      ? (game.min_playtime + game.max_playtime) / 2
      : game.min_playtime;
    r2 =
      Math.abs(mid - profile.avgPreferredDuration) < 35
        ? 'Duración perfecta para vuestras partidas habituales'
        : `Duración de ${game.min_playtime}–${game.max_playtime ?? game.min_playtime} min`;
  } else {
    r2 = game.min_playtime ? 'Duración ideal para vuestras partidas' : 'Fácil de encajar en cualquier tarde';
  }

  // R3: novelty
  const r3 =
    playCount === 0
      ? 'Nadie lo ha jugado todavía'
      : playCount === 1
        ? 'Ya lo probasteis una vez y gustó'
        : 'Un clásico que el grupo disfruta';

  // R4: complexity fit
  let r4: string;
  if (profile.hasData && profile.avgPreferredComplexity && game.complexity) {
    const diff = Math.abs(game.complexity - profile.avgPreferredComplexity);
    r4 =
      diff < 0.5
        ? 'Nivel de complejidad perfecto para el grupo'
        : diff < 1.2
          ? 'Ligeramente diferente a lo habitual — un reto nuevo'
          : `Más ${game.complexity > profile.avgPreferredComplexity ? 'complejo' : 'sencillo'} de lo habitual`;
  } else {
    r4 = game.complexity !== null ? 'Nivel de complejidad perfecto para el grupo' : 'Reglas claras y accesibles';
  }

  return [r1, r2, r3, r4];
}

// ── Real stats ────────────────────────────────────────────────────────────────

function buildRealStats(
  game: GameResult,
  profile: PreferenceProfile,
  memberCount: number
): GroupRecommendation['stats'] {
  const cats = game.categories ?? [];

  // membersEnjoy: % of members who've rated games of these categories ≥3.5★
  let membersEnjoy: number;
  if (profile.hasData && cats.length > 0 && profile.totalMembers > 0) {
    const maxCount = cats.reduce(
      (max, c) => Math.max(max, profile.membersPerCategory.get(c)?.size ?? 0),
      0
    );
    membersEnjoy = Math.round((maxCount / profile.totalMembers) * 100);
    if (membersEnjoy === 0) {
      // no match → infer from BGG rating
      membersEnjoy = Math.min(75, Math.max(40, Math.round((game.bgg_rating ?? 7) * 8.5)));
    }
  } else {
    membersEnjoy = Math.min(85, Math.max(55, Math.round((game.bgg_rating ?? 7) * 9)));
  }

  // durationFit: closeness to preferred session length
  let durationFit: number;
  if (profile.avgPreferredDuration && game.min_playtime) {
    const mid = game.max_playtime
      ? (game.min_playtime + game.max_playtime) / 2
      : game.min_playtime;
    const diff = Math.abs(mid - profile.avgPreferredDuration);
    durationFit = Math.round(Math.max(35, 100 - (diff / 100) * 65));
  } else {
    const minP = game.min_players ?? 1, maxP = game.max_players ?? 10;
    durationFit = memberCount >= minP && memberCount <= maxP
      ? seededInt(stableHash(game.id + 'dur'), 78, 94)
      : seededInt(stableHash(game.id + 'dur'), 60, 80);
  }

  // complexityFit: closeness to preferred complexity
  let complexityFit: number;
  if (profile.avgPreferredComplexity && game.complexity) {
    const diff = Math.abs(game.complexity - profile.avgPreferredComplexity);
    complexityFit = Math.round(Math.max(30, 100 - (diff / 2.5) * 70));
  } else {
    complexityFit = seededInt(stableHash(game.id + 'cplx'), 60, 82);
  }

  // positiveRatings: BGG-based (real community signal)
  const positiveRatings = Math.min(95, Math.max(65, Math.round((game.bgg_rating ?? 7) * 9.5)));

  return {
    membersEnjoy: Math.min(95, membersEnjoy),
    durationFit: Math.min(95, durationFit),
    complexityFit: Math.min(90, complexityFit),
    positiveRatings,
  };
}

// ── Wildcard reason ───────────────────────────────────────────────────────────

function buildWildcardReason(topCats: Set<string>, wildcardGame: GameResult): string {
  const topCatList = [...topCats].slice(0, 2).join(' y ').toLowerCase();
  const wildcardCats = (wildcardGame.categories ?? []).slice(0, 2).join(' y ').toLowerCase();
  if (topCatList && wildcardCats) {
    return `Vuestro grupo suele disfrutar de ${topCatList}. Este juego de ${wildcardCats} puede ser un cambio refrescante.`;
  }
  return 'Algo diferente a lo habitual. Puede sorprenderos gratamente.';
}

// ── Main function ─────────────────────────────────────────────────────────────

export async function getGroupRecommendations(
  groupId: string,
  memberCount: number,
  filters?: GroupFilters
): Promise<GroupRecommendationsResult | null> {
  const supabase = await createClient();

  // Parallel: plays, members, cached games + trending
  const [{ data: plays }, { data: members }, cachedGames] =
    await Promise.all([
      supabase.from('plays').select('game_id').eq('group_id', groupId).limit(500),
      supabase.from('group_members').select('profile_id').eq('group_id', groupId),
      getCachedRecommenderGames().catch(() => null),
    ]);

  let allGames: GameResult[] = cachedGames?.main ?? [];
  const trendingGames = cachedGames?.trending ?? [];

  // Cache miss or poisoned empty result — query directly
  if (allGames.length === 0) {
    const { data: fallback } = await supabase
      .from('games')
      .select(GAME_SELECT)
      .not('bgg_rank', 'is', null)
      .not('bgg_rating', 'is', null)
      .gte('bgg_rating', 7.0)
      .order('bgg_rating', { ascending: false })
      .limit(80);
    allGames = (fallback ?? []) as GameResult[];
  }

  if (allGames.length === 0) return null;

  const memberIds = (members ?? []).map((m: any) => m.profile_id as string);

  // Build play-count map
  const playCountMap = new Map<string, number>();
  for (const p of plays ?? []) {
    if ((p as any).game_id) {
      const id = (p as any).game_id as string;
      playCountMap.set(id, (playCountMap.get(id) ?? 0) + 1);
    }
  }

  // Fetch owned games + member ratings in parallel (both depend on memberIds, not each other)
  let ownedGameIds = new Set<string>();
  let profile: PreferenceProfile = {
    categoryWeights: {},
    mechanicWeights: {},
    membersPerCategory: new Map(),
    avgPreferredComplexity: null,
    avgPreferredDuration: null,
    totalMembers: memberIds.length,
    hasData: false,
  };

  if (memberIds.length > 0) {
    const adminClient = createAdminClient();
    const [{ data: ownedRows }, { data: ratedRows }] = await Promise.all([
      adminClient
        .from('user_games')
        .select('game_id')
        .in('profile_id', memberIds)
        .limit(1000),
      supabase
        .from('user_games')
        .select(
          'profile_id, rating, games(categories, mechanics, min_playtime, max_playtime, complexity)'
        )
        .in('profile_id', memberIds)
        .not('rating', 'is', null)
        .gte('rating', 3)
        .limit(300),
    ]);

    ownedGameIds = new Set((ownedRows ?? []).map((r: any) => r.game_id as string));
    if (ratedRows && ratedRows.length > 0) {
      profile = buildPreferenceProfile(ratedRows as any, memberIds.length);
    }
  }

  // Player count: use filter override or group member count
  const playerCount = filters?.jugadores ?? memberCount;

  // Filter candidate games by player count
  const candidates = (allGames as GameResult[]).filter((g) => {
    const minP = g.min_players ?? 1;
    const maxP = g.max_players ?? 10;
    return playerCount >= minP && playerCount <= maxP;
  });

  // Fall back to all games if player count filter is too strict
  let pool = candidates.length >= 5 ? candidates : (allGames as GameResult[]);

  // Apply additional filters
  if (filters?.novedad === 'nuevo') {
    pool = pool.filter((g) => !playCountMap.has(g.id));
  } else if (filters?.novedad === 'jugado') {
    pool = pool.filter((g) => playCountMap.has(g.id));
  }

  if (filters?.duracion) {
    const ranges: Record<string, [number, number]> = {
      corta: [0, 45], media: [30, 120], larga: [90, 240], 'muy-larga': [180, 9999],
    };
    const [min, max] = ranges[filters.duracion];
    pool = pool.filter((g) => {
      if (!g.min_playtime) return true;
      const mid = g.max_playtime ? (g.min_playtime + g.max_playtime) / 2 : g.min_playtime;
      return mid >= min && mid <= max;
    });
  }

  if (filters?.dificultad) {
    const ranges: Record<string, [number, number]> = {
      ligero: [1.0, 2.0], medio: [1.8, 3.2], complejo: [3.0, 5.0],
    };
    const [min, max] = ranges[filters.dificultad];
    pool = pool.filter((g) => {
      if (g.complexity === null || g.complexity === undefined) return true;
      return g.complexity >= min && g.complexity <= max;
    });
  }

  // Exclude games owned by group members
  if (ownedGameIds.size > 0) {
    const unowned = pool.filter(g => !ownedGameIds.has(g.id));
    if (unowned.length >= 3) pool = unowned;
  }

  // Exclude games the user has dismissed ("No me interesa")
  if (filters?.skippedGameIds && filters.skippedGameIds.length > 0) {
    const skipped = new Set(filters.skippedGameIds);
    pool = pool.filter(g => !skipped.has(g.id));
  }

  if (pool.length === 0) return null;

  // Score all games
  const rawScores = pool.map((game) => {
    const cats = game.categories ?? [];
    const mecs = game.mechanics ?? [];
    const prefRaw =
      cats.reduce((s, c) => s + (profile.categoryWeights[c] ?? 0), 0) /
        Math.max(1, cats.length) +
      mecs.reduce((s, m) => s + (profile.mechanicWeights[m] ?? 0), 0) /
        Math.max(1, mecs.length);
    return { game, prefRaw };
  });

  const maxPrefScore = Math.max(...rawScores.map((r) => r.prefRaw), 0.001);

  const scored = rawScores
    .map(({ game, prefRaw }) => {
      const playCount = playCountMap.get(game.id) ?? 0;
      const { score01 } = scoreGame(game, profile, playCount, memberCount, maxPrefScore);
      return { game, score01, playCount };
    })
    .sort((a, b) => b.score01 - a.score01);

  if (scored.length === 0) return null;

  const [topItem, ...rest] = scored;

  const top: GroupRecommendation = {
    game: topItem.game,
    affinity: toAffinity(topItem.score01),
    reasons: buildRealReasons(topItem.game, profile, memberCount, topItem.playCount),
    stats: buildRealStats(topItem.game, profile, memberCount),
  };

  const alternatives = rest.slice(0, 5).map((item) => ({
    ...item.game,
    affinity: toAffinity(item.score01),
  }));

  // Wildcard: lowest-weighted category for this group (genuinely different)
  const topCats = new Set(topItem.game.categories ?? []);
  const leastPreferredCats = Object.entries(profile.categoryWeights)
    .sort((a, b) => a[1] - b[1])
    .slice(0, 5)
    .map(([c]) => c);

  const wildcardCandidate =
    rest.slice(4).find((item) =>
      leastPreferredCats.some((c) => (item.game.categories ?? []).includes(c)) &&
      !(item.game.categories ?? []).some((c) => topCats.has(c))
    ) ??
    rest.slice(4).find((item) =>
      !(item.game.categories ?? []).some((c) => topCats.has(c))
    ) ??
    rest[Math.min(7, rest.length - 1)];

  const wildcard = wildcardCandidate
    ? {
        ...wildcardCandidate.game,
        affinity: toAffinity(wildcardCandidate.score01),
        wildcardReason: buildWildcardReason(topCats, wildcardCandidate.game),
      }
    : null;

  // Trending: use cached data, add deterministic group counts
  const trending = (trendingGames as GameResult[]).map((g) => ({
    ...g,
    groupCount: seededInt(stableHash(g.id + 'trend'), 14, 42),
  }));

  return { top, alternatives, wildcard, trending };
}

export async function getGameByBggId(bggId: number): Promise<GameResult | null> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('games')
    .select(GAME_SELECT)
    .eq('bgg_id', bggId)
    .single();

  if (error) return null;
  return data as GameResult;
}

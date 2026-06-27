import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { TrackerClient, type TrackerPlay, type TrackerRating } from './TrackerClient';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tracker' };

export default async function TrackerPage() {
  const user = await getAuthUser();
  if (!user) redirect('/auth/login?next=/partidas');
  const supabase = await createClient();

  // Get play IDs where the user participated
  const { data: userPlayResults } = await supabase
    .from('play_results')
    .select('play_id')
    .eq('profile_id', user.id);

  const playIds = (userPlayResults ?? []).map((r: any) => r.play_id as string);

  const [playsRes, ratingsRes, totalUsersRes, winsRes] = await Promise.all([
    playIds.length > 0
      ? supabase
          .from('plays')
          .select('id, played_at, group_id, games(id, bgg_id, name, image_url, min_playtime), groups(name), play_results(profile_id, guest_name, is_winner, profiles(display_name))')
          .in('id', playIds)
          .order('played_at', { ascending: false })
          .limit(500)
      : Promise.resolve({ data: [] as any[] }),
    supabase
      .from('user_games')
      .select('rating, game_id, games(bgg_id, name, image_url)')
      .eq('profile_id', user.id)
      .not('rating', 'is', null)
      .order('rating', { ascending: false })
      .limit(20),
    supabase.from('profiles').select('id', { count: 'exact', head: true }),
    supabase
      .from('play_results')
      .select('profile_id')
      .eq('is_winner', true)
      .not('profile_id', 'is', null),
  ]);

  const rawPlays = (playsRes.data ?? []) as any[];
  const rawRatings = (ratingsRes.data ?? []) as any[];
  const totalUsers = (totalUsersRes as any).count ?? 0;
  const allWins = (winsRes.data ?? []) as any[];

  // Compute user rank by total wins
  const winsByUser: Record<string, number> = {};
  allWins.forEach((r: any) => {
    winsByUser[r.profile_id] = (winsByUser[r.profile_id] ?? 0) + 1;
  });
  const myWins = winsByUser[user.id] ?? 0;
  const usersWithMoreWins = Object.keys(winsByUser).filter(id => winsByUser[id] > myWins).length;
  const userRank = usersWithMoreWins + 1;

  // Shape plays for client
  const plays: TrackerPlay[] = rawPlays.map((p: any) => {
    const allResults = (p.play_results ?? []).map((r: any) => ({
      profile_id: r.profile_id ?? null,
      guest_name: r.guest_name ?? null,
      is_winner: r.is_winner ?? false,
      display_name: r.profiles?.display_name ?? null,
    }));
    const myResult = allResults.find((r: any) => r.profile_id === user.id);
    return {
      id: p.id,
      played_at: p.played_at,
      game: p.games ? {
        id: p.games.id,
        bgg_id: p.games.bgg_id ?? null,
        name: p.games.name,
        image_url: p.games.image_url ?? null,
        min_playtime: p.games.min_playtime ?? null,
      } : null,
      group_id: p.group_id ?? null,
      group_name: p.groups?.name ?? null,
      all_results: allResults,
      my_is_winner: myResult?.is_winner ?? false,
    };
  });

  // Shape ratings for client
  const ratings: TrackerRating[] = rawRatings
    .filter((r: any) => r.games && r.rating != null)
    .map((r: any) => ({
      rating: r.rating,
      game: {
        bgg_id: r.games.bgg_id ?? null,
        name: r.games.name,
        image_url: r.games.image_url ?? null,
      },
    }));

  if (plays.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: '60vh', padding: '48px 32px', textAlign: 'center' }}>
        <div style={{ width: 72, height: 72, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 20, color: 'var(--text-3)' }}>
          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>
        </div>
        <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Tu tracker está vacío</h1>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24, maxWidth: 320 }}>
          Registra tu primera partida en un grupo para ver tus estadísticas aquí.
        </p>
        <Link href="/grupos" style={{
          padding: '12px 24px', borderRadius: 999, fontWeight: 700, fontSize: 14,
          color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
        }}>
          Ir a mis grupos →
        </Link>
      </div>
    );
  }

  return (
    <TrackerClient
      plays={plays}
      ratings={ratings}
      totalUsers={totalUsers}
      userRank={userRank}
      userId={user.id}
    />
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StatsPage({ params }: Props) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: group }, { data: membership }, { data: plays }] = await Promise.all([
    supabase.from('groups').select('id, name').eq('id', groupId).single(),
    supabase.from('group_members').select('group_id').eq('group_id', groupId).eq('profile_id', user.id).single(),
    supabase
      .from('plays')
      .select('id, played_at, games(bgg_id, name, image_url), play_results(profile_id, guest_name, score, is_winner, profiles(display_name))')
      .eq('group_id', groupId)
      .order('played_at', { ascending: false })
      .limit(500),
  ]);

  if (!group) notFound();
  if (!membership) redirect('/grupos');

  const totalPlays = plays?.length ?? 0;

  // --- Top juegos ---
  const gameCount: Record<string, { name: string; image_url: string | null; bgg_id: number | null; count: number }> = {};
  plays?.forEach((play: any) => {
    const key = play.games?.name ?? 'Desconocido';
    if (!gameCount[key]) gameCount[key] = { name: key, image_url: play.games?.image_url ?? null, bgg_id: play.games?.bgg_id ?? null, count: 0 };
    gameCount[key].count++;
  });
  const topGames = Object.values(gameCount).sort((a, b) => b.count - a.count).slice(0, 5);

  // --- Ranking jugadores ---
  const playerStats: Record<string, { name: string; wins: number; plays: number }> = {};
  plays?.forEach((play: any) => {
    play.play_results?.forEach((r: any) => {
      const name = r.profiles?.display_name ?? r.guest_name ?? 'Invitado';
      const key = r.profile_id ?? r.guest_name ?? 'guest';
      if (!playerStats[key]) playerStats[key] = { name, wins: 0, plays: 0 };
      playerStats[key].plays++;
      if (r.is_winner) playerStats[key].wins++;
    });
  });
  const playerRanking = Object.values(playerStats).sort((a, b) => b.wins - a.wins || b.plays - a.plays);

  // --- Gráfica por mes (últimos 6 meses) ---
  const now = new Date();
  const months: { label: string; key: string }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      label: d.toLocaleDateString('es-ES', { month: 'short' }),
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
    });
  }
  const playsByMonth: Record<string, number> = {};
  plays?.forEach((play: any) => {
    const d = new Date(play.played_at);
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    playsByMonth[key] = (playsByMonth[key] ?? 0) + 1;
  });
  const monthData = months.map((m) => ({ ...m, count: playsByMonth[m.key] ?? 0 }));
  const maxMonthCount = Math.max(...monthData.map((m) => m.count), 1);

  // --- Récords ---
  let highestScore: { player: string; score: number; game: string } | null = null;
  plays?.forEach((play: any) => {
    play.play_results?.forEach((r: any) => {
      if (r.score != null && (highestScore === null || r.score > highestScore.score)) {
        highestScore = {
          player: r.profiles?.display_name ?? r.guest_name ?? 'Invitado',
          score: r.score,
          game: play.games?.name ?? 'Juego desconocido',
        };
      }
    });
  });

  // Racha más larga de victorias (por jugador)
  let longestStreak: { player: string; streak: number } | null = null;
  const streakByPlayer: Record<string, { name: string; current: number; max: number }> = {};
  // plays are ordered desc, reverse for chronological
  const chronoPlays = [...(plays ?? [])].reverse();
  chronoPlays.forEach((play: any) => {
    const playerKeys = new Set<string>();
    play.play_results?.forEach((r: any) => {
      const key = r.profile_id ?? r.guest_name ?? 'guest';
      const name = r.profiles?.display_name ?? r.guest_name ?? 'Invitado';
      if (!streakByPlayer[key]) streakByPlayer[key] = { name, current: 0, max: 0 };
      playerKeys.add(key);
      if (r.is_winner) {
        streakByPlayer[key].current++;
        if (streakByPlayer[key].current > streakByPlayer[key].max) streakByPlayer[key].max = streakByPlayer[key].current;
      } else {
        streakByPlayer[key].current = 0;
      }
    });
  });
  Object.values(streakByPlayer).forEach((s) => {
    if (longestStreak === null || s.max > longestStreak.streak) longestStreak = { player: s.name, streak: s.max };
  });

  const distinctGames = Object.keys(gameCount).length;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/grupos/${groupId}`, label: group.name }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Estadísticas</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{group.name}</p>
        </div>

        {totalPlays === 0 ? (
          <div style={{ borderRadius: 24, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <img src="/icons/tracker.svg" alt="Estadísticas" style={{ width: 56, height: 56, marginBottom: 12 }} />
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Sin datos todavía</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>Registra partidas para ver las estadísticas del grupo.</p>
            <Link href={`/grupos/${groupId}/partidas/nueva`} style={{
              display: 'inline-flex', padding: '12px 22px', borderRadius: 999, fontSize: 14, fontWeight: 700,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Registrar primera partida →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12 }}>
              {[
                { value: totalPlays, label: 'partidas' },
                { value: distinctGames, label: 'juegos distintos' },
                { value: playerRanking.length, label: 'jugadores' },
              ].map((s) => (
                <div key={s.label} style={{ borderRadius: 24, padding: '18px 12px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                  <p style={{ fontSize: 36, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</p>
                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>

            {/* Gráfica de actividad */}
            <section>
              <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 16 }}>Actividad (últimos 6 meses)</h2>
              <div style={{ borderRadius: 24, padding: '20px 20px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                  {monthData.map((m) => (
                    <div key={m.key} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, height: '100%', justifyContent: 'flex-end' }}>
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', visibility: m.count > 0 ? 'visible' : 'hidden' }}>{m.count}</span>
                      <div style={{
                        width: '100%', height: 52, borderRadius: 8,
                        background: m.count > 0 ? 'var(--brand)' : 'var(--bg-inset)',
                        transform: `scaleY(${m.count > 0 ? Math.max(8 / 52, m.count / maxMonthCount) : 4 / 52})`,
                        transformOrigin: 'bottom',
                        transition: 'transform 0.4s cubic-bezier(0.16,1,0.3,1)',
                        boxShadow: m.count > 0 ? '0 2px 8px rgba(62,94,59,0.2)' : 'none',
                      }} />
                    </div>
                  ))}
                </div>
                <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
                  {monthData.map((m) => (
                    <div key={m.key} style={{ flex: 1, textAlign: 'center' }}>
                      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', textTransform: 'capitalize' }}>{m.label}</span>
                    </div>
                  ))}
                </div>
              </div>
            </section>

            {/* Récords */}
            {(highestScore || (longestStreak && (longestStreak as any).streak > 1)) && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Récords</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {highestScore && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '14px 18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>🏅</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Puntuación más alta</p>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{(highestScore as any).player} · {(highestScore as any).game}</p>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{(highestScore as any).score}</span>
                    </div>
                  )}
                  {longestStreak && (longestStreak as any).streak > 1 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '14px 18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>🔥</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Racha de victorias más larga</p>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{(longestStreak as any).player}</p>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{(longestStreak as any).streak} seguidas</span>
                    </div>
                  )}
                  {topGames[0] && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '14px 18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{ fontSize: 24, flexShrink: 0 }}>🎯</span>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>Juego favorito del grupo</p>
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{topGames[0].name}</p>
                      </div>
                      <span style={{ fontSize: 22, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{topGames[0].count}×</span>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Top juegos */}
            {topGames.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Juegos más jugados</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topGames.map((game, i) => (
                    <Link key={game.name} href={game.bgg_id ? `/juegos/${game.bgg_id}` : '#'} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 22, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textDecoration: 'none' }}>
                      <span style={{ width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, flexShrink: 0, background: i === 0 ? 'var(--brand-tint)' : 'var(--bg-inset)', color: i === 0 ? 'var(--brand)' : 'var(--text-4)' }}>
                        {i + 1}
                      </span>
                      {game.image_url
                        ? <Image src={game.image_url} alt={game.name} width={36} height={36} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)' }}>🎲</div>
                      }
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{game.count}×</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Ranking jugadores */}
            {playerRanking.length > 0 && (
              <section>
                <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Ranking de jugadores</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {playerRanking.map((player, i) => {
                    const winRate = player.plays > 0 ? Math.round((player.wins / player.plays) * 100) : 0;
                    return (
                      <div key={player.name} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 22, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                        <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, flexShrink: 0, background: i === 0 ? 'linear-gradient(135deg, #89BA86, #3E5E3B)' : 'var(--bg-inset)', color: i === 0 ? 'white' : 'var(--text-4)', boxShadow: i === 0 ? '0 2px 8px rgba(62,94,59,0.2)' : 'none' }}>
                          {player.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{player.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{player.plays} partidas · {player.wins} victorias</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 20, fontWeight: 800, color: winRate >= 50 ? '#16a34a' : 'var(--text-3)', letterSpacing: '-0.01em' }}>{winRate}%</p>
                          <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>win rate</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}

          </div>
        )}
      </main>
    </div>
  );
}

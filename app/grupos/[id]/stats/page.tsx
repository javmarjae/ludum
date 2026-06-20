import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function StatsPage({ params }: Props) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: group } = await supabase.from('groups').select('id, name').eq('id', groupId).single();
  if (!group) notFound();

  const { data: membership } = await supabase.from('group_members').select('group_id').eq('group_id', groupId).eq('profile_id', user.id).single();
  if (!membership) redirect('/grupos');

  const { data: plays } = await supabase
    .from('plays')
    .select('id, played_at, games(name, image_url), play_results(profile_id, guest_name, score, is_winner, profiles(display_name))')
    .eq('group_id', groupId)
    .order('played_at', { ascending: false });

  const totalPlays = plays?.length ?? 0;

  const gameCount: Record<string, { name: string; image_url: string | null; count: number }> = {};
  plays?.forEach((play: any) => {
    const name = play.games?.name ?? 'Desconocido';
    if (!gameCount[name]) gameCount[name] = { name, image_url: play.games?.image_url, count: 0 };
    gameCount[name].count++;
  });
  const topGames = Object.values(gameCount).sort((a, b) => b.count - a.count).slice(0, 5);

  const playerStats: Record<string, { name: string; wins: number; plays: number }> = {};
  plays?.forEach((play: any) => {
    play.play_results?.forEach((result: any) => {
      const name = result.profiles?.display_name ?? result.guest_name ?? 'Invitado';
      const key = result.profile_id ?? result.guest_name ?? 'guest';
      if (!playerStats[key]) playerStats[key] = { name, wins: 0, plays: 0 };
      playerStats[key].plays++;
      if (result.is_winner) playerStats[key].wins++;
    });
  });
  const playerRanking = Object.values(playerStats).sort((a, b) => b.wins - a.wins || b.plays - a.plays);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav back={{ href: `/grupos/${groupId}`, label: group.name }} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Estadísticas</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>{group.name}</p>
        </div>

        {totalPlays === 0 ? (
          <div style={{ borderRadius: 24, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>📊</p>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Sin datos todavía</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>Registra partidas para ver las estadísticas del grupo.</p>
            <Link href={`/grupos/${groupId}/partidas/nueva`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999,
              fontSize: 14, fontWeight: 700, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Registrar primera partida →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>
            {/* Summary */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
              <div style={{ borderRadius: 24, padding: 20, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{totalPlays}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>partidas jugadas</p>
              </div>
              <div style={{ borderRadius: 24, padding: 20, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 40, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{topGames.length}</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>juegos distintos</p>
              </div>
            </div>

            {/* Top games */}
            {topGames.length > 0 && (
              <section>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Juegos más jugados</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {topGames.map((game, i) => (
                    <div key={game.name} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                      <span style={{
                        width: 28, height: 28, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontSize: 12, fontWeight: 800, flexShrink: 0,
                        background: i === 0 ? 'var(--brand-tint)' : 'var(--bg-inset)',
                        color: i === 0 ? 'var(--brand)' : 'var(--text-4)',
                      }}>
                        {i + 1}
                      </span>
                      {game.image_url
                        ? <img src={game.image_url} alt={game.name} style={{ width: 36, height: 36, borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                        : <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-inset)' }}>🎲</div>
                      }
                      <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{game.name}</span>
                      <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>{game.count}×</span>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* Player ranking */}
            {playerRanking.length > 0 && (
              <section>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Ranking de jugadores</h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {playerRanking.map((player, i) => {
                    const winRate = player.plays > 0 ? Math.round((player.wins / player.plays) * 100) : 0;
                    return (
                      <div key={player.name} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                        <div style={{
                          width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 13, fontWeight: 800, flexShrink: 0,
                          background: i === 0 ? 'linear-gradient(135deg, #89BA86, #3E5E3B)' : 'var(--bg-inset)',
                          color: i === 0 ? 'white' : 'var(--text-4)',
                          boxShadow: i === 0 ? '0 2px 8px rgba(62,94,59,0.2)' : 'none',
                        }}>
                          {player.name[0].toUpperCase()}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)' }}>{player.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{player.plays} partidas · {player.wins} victorias</p>
                        </div>
                        <div style={{ textAlign: 'right', flexShrink: 0 }}>
                          <p style={{ fontSize: 20, fontWeight: 800, color: winRate >= 50 ? '#16a34a' : 'var(--text-3)', letterSpacing: '-0.01em' }}>
                            {winRate}%
                          </p>
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

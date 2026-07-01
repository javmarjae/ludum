import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { WhatToPlay } from './WhatToPlay';

function playerIcon(n: number): string {
  if (n <= 1) return '/icons/solo.svg';
  if (n <= 2) return '/icons/pareja.svg';
  if (n <= 4) return '/icons/grupo.svg';
  return '/icons/pandilla.svg';
}

function relativeDate(dateStr: string): string {
  const date = new Date(dateStr);
  const now = new Date();
  const diffDays = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  if (diffDays < 30) return `Hace ${Math.floor(diffDays / 7)} semanas`;
  return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

export async function GroupRecentPlays({ groupId, userId }: { groupId: string; userId: string }) {
  const supabase = await createClient();

  const [{ data: recentPlays }, { data: collection }] = await Promise.all([
    supabase.from('plays')
      .select('id, played_at, duration_minutes, games(name, image_url, bgg_id), play_results(profile_id, is_winner, score, guest_name, profiles(display_name, avatar_url))')
      .eq('group_id', groupId)
      .order('played_at', { ascending: false })
      .limit(5),
    supabase.from('group_games')
      .select('game_id, games(id, bgg_id, name, image_url, min_players, max_players, min_playtime, max_playtime)')
      .eq('group_id', groupId),
  ]);

  const collectionGames = (collection ?? []).map((c: any) => c.games).filter(Boolean);

  return (
    <>
      {/* Recent plays */}
      <section>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Partidas recientes</h2>
        </div>

        {!recentPlays || recentPlays.length === 0 ? (
          <div style={{ borderRadius: 22, padding: 28, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 26, marginBottom: 8 }}>🎲</p>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 6 }}>Sin partidas todavía</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 14 }}>Registrad vuestra primera partida.</p>
            <Link href={`/grupos/${groupId}/partidas/nueva`} style={{
              display: 'inline-flex', padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Registrar partida →
            </Link>
          </div>
        ) : (
          <>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(recentPlays as any[]).map((play, i) => {
                const results = play.play_results ?? [];
                const winners = results.filter((r: any) => r.is_winner);
                const multipleWinners = winners.length > 1;
                const firstWinner = winners[0] ?? null;
                const winnerName = multipleWinners
                  ? 'Varios'
                  : (firstWinner?.profiles?.display_name ?? firstWinner?.guest_name ?? null);
                const winnerAvatar = multipleWinners ? null : (firstWinner?.profiles?.avatar_url ?? null);
                const playerCount = results.length;

                const winnerScore = firstWinner?.score ?? 100;

                const hasScores = results.some((r: any) => r.score !== null && r.score !== undefined);
                const myResult = results.find((r: any) => r.profile_id === userId);
                let myPosition: number | null = null;
                if (myResult) {
                  if (hasScores && myResult.score != null) {
                    myPosition = 1 + results.filter((r: any) => r.score != null && r.score > myResult.score).length;
                  } else if (myResult.is_winner) {
                    myPosition = 1;
                  }
                }

                return (
                  <Link key={play.id} href={`/grupos/${groupId}/partidas/${play.id}`} className="stagger-in" style={{ ['--stagger-i' as any]: i, textDecoration: 'none' }}>
                    <div className="hover-scale grupo-play-card" style={{
                      display: 'flex', alignItems: 'center', gap: 18,
                      borderRadius: 20, padding: '18px 22px',
                      background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
                    }}>
                      {/* Game image */}
                      {play.games?.image_url
                        ? <div className="grupo-play-img" style={{ position: 'relative', width: 68, height: 92, borderRadius: 14, overflow: 'hidden', flexShrink: 0 }}>
                            <Image src={play.games.image_url} alt={play.games.name} fill sizes="68px" style={{ objectFit: 'cover' }} />
                          </div>
                        : <div className="grupo-play-img" style={{ width: 68, height: 92, borderRadius: 14, flexShrink: 0, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 30 }}>🎲</div>
                      }

                      {/* Game name + meta */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 800, fontSize: 17, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 8 }}>
                          {play.games?.name ?? 'Juego desconocido'}
                        </p>
                        <div className="grupo-play-meta" style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                          <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
                            📅 {relativeDate(play.played_at)}
                          </span>
                          {playerCount > 0 && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                              <img src={playerIcon(playerCount)} alt="" aria-hidden="true" style={{ width: 16, height: 16 }} />
                              {playerCount} jugadores
                            </span>
                          )}
                          {play.duration_minutes && (
                            <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
                              ⏱ {play.duration_minutes} min
                            </span>
                          )}
                        </div>
                      </div>

                      {/* Winner block */}
                      {winnerName && (
                        <div className="grupo-winner" style={{ display: 'flex', alignItems: 'center', gap: 14, flexShrink: 0 }}>
                          {/* Avatar */}
                          {multipleWinners ? (
                            <div className="grupo-winner-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, flexShrink: 0 }}>
                              👑
                            </div>
                          ) : winnerAvatar ? (
                            <Image className="grupo-winner-avatar" src={winnerAvatar} alt={winnerName} width={48} height={48} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                          ) : (
                            <div className="grupo-winner-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>
                              {(winnerName[0] ?? '?').toUpperCase()}
                            </div>
                          )}
                          {/* Name */}
                          <div style={{ minWidth: 0, maxWidth: 130, overflow: 'hidden' }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 3 }}>
                              {multipleWinners ? 'Ganadores' : 'Ganador'}
                            </p>
                            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {winnerName}{!multipleWinners && ' 👑'}
                            </p>
                          </div>
                          {/* Score */}
                          <div className="grupo-play-score" style={{ textAlign: 'center', minWidth: 54 }}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 3 }}>Puntos</p>
                            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>{winnerScore}</p>
                          </div>
                          {/* Tu puesto en la partida (N/A si no participaste) */}
                          <div className="grupo-play-score" style={{ textAlign: 'center', minWidth: 54 }} title={myPosition !== null ? 'Tu puesto en la partida' : 'No participaste en esta partida'}>
                            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 3 }}>Tu puesto</p>
                            <div className="grupo-play-badge" style={{
                              width: 40, height: 40, borderRadius: '50%', flexShrink: 0, margin: '0 auto',
                              background: myPosition === 1 ? 'var(--brand-tint)' : 'var(--bg-inset)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                              fontSize: myPosition !== null ? 14 : 11, fontWeight: 800,
                              color: myPosition === 1 ? 'var(--brand)' : 'var(--text-3)',
                              border: myPosition === 1 ? '1.5px solid rgba(62,94,59,0.25)' : '1px solid var(--border)',
                            }}>
                              {myPosition !== null ? `${myPosition}º` : 'N/A'}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
            <Link href={`/grupos/${groupId}/partidas`} style={{
              display: 'block', textAlign: 'center', marginTop: 10,
              padding: '11px', borderRadius: 16, fontSize: 13, fontWeight: 700,
              color: 'var(--brand)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
              textDecoration: 'none',
            }}>
              Ver todas las partidas →
            </Link>
          </>
        )}
      </section>

      {/* What to play */}
      {collectionGames.length > 0 && <WhatToPlay games={collectionGames} />}
    </>
  );
}

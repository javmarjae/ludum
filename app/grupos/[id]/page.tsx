import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { DeleteGroupButton } from './DeleteGroupButton';
import { EditGroupForm } from './EditGroupForm';
import { VisitTracker } from './VisitTracker';
import { WhatToPlay } from './WhatToPlay';
import { CopyButton } from '@/components/CopyButton';
import { InviteQR } from './InviteQR';

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

interface Props { params: Promise<{ id: string }>; }

export default async function GrupoDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');
  const supabase = await createClient();

  const [
    { data: group },
    { data: membership },
    { data: members },
    { data: recentPlays },
    { data: collection },
    { data: allPlayStats, count: totalPlaysCount },
  ] = await Promise.all([
    supabase.from('groups').select('id, name, invite_code, owner_id, image_url, description').eq('id', id).single(),
    supabase.from('group_members').select('group_id').eq('group_id', id).eq('profile_id', user.id).single(),
    supabase.from('group_members').select('profile_id, profiles(display_name, avatar_url, is_verified)').eq('group_id', id),
    supabase.from('plays')
      .select('id, played_at, duration_minutes, games(name, image_url, bgg_id), play_results(profile_id, is_winner, score, guest_name, profiles(display_name, avatar_url))')
      .eq('group_id', id)
      .order('played_at', { ascending: false })
      .limit(5),
    supabase.from('group_games')
      .select('game_id, games(id, bgg_id, name, image_url, min_players, max_players, min_playtime, max_playtime)')
      .eq('group_id', id),
    supabase.from('plays')
      .select('game_id, duration_minutes, games(min_playtime, max_playtime), play_results(score)', { count: 'exact' })
      .eq('group_id', id)
      .limit(500),
  ]);

  if (!group) notFound();
  if (!membership) redirect('/grupos');

  const isOwner = group.owner_id === user.id;
  const memberCount = members?.length ?? 0;
  const collectionCount = collection?.length ?? 0;
  const collectionGames = (collection ?? []).map((c: any) => c.games).filter(Boolean);
  const totalPlays = totalPlaysCount ?? 0;

  // Best score from sampled plays
  let bestScore: { score: number; gameName: string } | null = null;
  (allPlayStats ?? []).forEach((play: any) => {
    (play.play_results ?? []).forEach((r: any) => {
      if (r.score !== null && r.score !== undefined && (bestScore === null || r.score > bestScore.score)) {
        bestScore = { score: r.score, gameName: '' };
      }
    });
  });

  // Repeated games %
  const gameCount: Record<string, number> = {};
  (allPlayStats ?? []).forEach((play: any) => {
    if (play.game_id) gameCount[play.game_id] = (gameCount[play.game_id] ?? 0) + 1;
  });
  const repeatedPlays = Object.values(gameCount).filter(c => c > 1).reduce((sum, c) => sum + c, 0);
  const sampleSize = allPlayStats?.length ?? 0;
  const repeatedPercent = sampleSize > 0 ? Math.round((repeatedPlays / sampleSize) * 100) : 0;

  // Average play duration
  const durationsForAvg: number[] = [];
  (allPlayStats ?? []).forEach((play: any) => {
    if (play.duration_minutes != null) {
      durationsForAvg.push(play.duration_minutes);
    } else if (play.games?.min_playtime != null || play.games?.max_playtime != null) {
      const min = play.games.min_playtime ?? play.games.max_playtime;
      const max = play.games.max_playtime ?? play.games.min_playtime;
      durationsForAvg.push(Math.round((min + max) / 2));
    }
  });
  const avgDuration = durationsForAvg.length > 0
    ? Math.round(durationsForAvg.reduce((sum, d) => sum + d, 0) / durationsForAvg.length)
    : null;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', width: '100%' }}>
      <VisitTracker groupId={id} />

      {/* Sticky group header */}
      <div className="grupo-header-inner" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', boxSizing: 'border-box',
        padding: '0 clamp(14px,4vw,32px)', height: 72, gap: 16,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Link href="/grupos" style={{
            color: 'var(--text-4)', textDecoration: 'none', fontSize: 18, lineHeight: 1,
            flexShrink: 0, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-inset)',
            fontWeight: 700,
          }}>
            ←
          </Link>
          {(group as any).image_url ? (
            <img src={(group as any).image_url} alt={group.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={playerIcon(memberCount)} alt="" aria-hidden="true" style={{ width: 22, height: 22 }} />
              </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, lineHeight: 1.2 }}>
              {group.name}
            </h1>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', lineHeight: 1 }}>
              {memberCount} miembros
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <span className="grupo-invite-btn">
            <CopyButton text={group.invite_code} label="Invitar miembros" />
          </span>
          <Link href={`/grupos/${id}/partidas/nueva`} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14,
            color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <span className="grupo-btn-long">+ Registrar nueva partida</span>
            <span className="grupo-btn-short" style={{ display: 'none' }}>+ Partida</span>
          </Link>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '28px clamp(16px,4vw,32px) 80px' }}>

        {/* Stats row */}
        <div className="grupo-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
          <StatCard
            value={collectionCount.toString()}
            label="Juegos en posesión"
            link={{ href: `/grupos/${id}/coleccion`, text: 'Ver colección' }}
          />
          <StatCard
            value={totalPlays.toString()}
            label="Partidas jugadas"
            link={{ href: `/grupos/${id}/stats`, text: 'Ver estadísticas' }}
          />
          <StatCard
            value={bestScore ? `${(bestScore as any).score} pts` : '—'}
            label="Mejor puntuación"
            sub={bestScore ? 'Récord del grupo' : 'Sin puntuaciones'}
          />
          <StatCard
            value={`${repeatedPercent}%`}
            label="Juegos repetidos"
            sub={`${repeatedPlays} de ${sampleSize} partidas`}
          />
          <StatCard
            value={avgDuration != null ? `${avgDuration} min` : '—'}
            label="Tiempo medio de partida"
            sub={avgDuration != null ? `Sobre ${durationsForAvg.length} partidas` : 'Sin datos aún'}
          />
        </div>

        {/* Two-column grid */}
        <div className="grupo-cols" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

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
                  <Link href={`/grupos/${id}/partidas/nueva`} style={{
                    display: 'inline-flex', padding: '9px 18px', borderRadius: 999, fontSize: 13, fontWeight: 700,
                    color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
                  }}>
                    Registrar partida →
                  </Link>
                </div>
              ) : (
                <>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {(recentPlays as any[]).map((play) => {
                      const results = play.play_results ?? [];
                      const winners = results.filter((r: any) => r.is_winner);
                      const multipleWinners = winners.length > 1;
                      const firstWinner = winners[0] ?? null;
                      // Si ganó más de una persona mostramos "Varios" en vez de un solo nombre
                      const winnerName = multipleWinners
                        ? 'Varios'
                        : (firstWinner?.profiles?.display_name ?? firstWinner?.guest_name ?? null);
                      const winnerAvatar = multipleWinners ? null : (firstWinner?.profiles?.avatar_url ?? null);
                      const playerCount = results.length;

                      // Score del ganador (los ganadores empatados suelen compartir puntuación)
                      const winnerScore = firstWinner?.score ?? 100;

                      // Tu puesto: posición del usuario actual en esta partida
                      const hasScores = results.some((r: any) => r.score !== null && r.score !== undefined);
                      const myResult = results.find((r: any) => r.profile_id === user.id);
                      let myPosition: number | null = null;
                      if (myResult) {
                        if (hasScores && myResult.score != null) {
                          myPosition = 1 + results.filter((r: any) => r.score != null && r.score > myResult.score).length;
                        } else if (myResult.is_winner) {
                          myPosition = 1;
                        }
                      }

                      return (
                        <Link key={play.id} href={`/grupos/${id}/partidas/${play.id}`} style={{ textDecoration: 'none' }}>
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
                                  <img className="grupo-winner-avatar" src={winnerAvatar} alt={winnerName} loading="lazy" decoding="async" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                                ) : (
                                  <div className="grupo-winner-avatar" style={{ width: 48, height: 48, borderRadius: '50%', background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 19, fontWeight: 800, color: 'var(--brand)', flexShrink: 0 }}>
                                    {(winnerName[0] ?? '?').toUpperCase()}
                                  </div>
                                )}
                                {/* Name */}
                                <div style={{ minWidth: 0 }}>
                                  <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: 3 }}>
                                    {multipleWinners ? 'Ganadores' : 'Ganador'}
                                  </p>
                                  <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', whiteSpace: 'nowrap' }}>
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
                  <Link href={`/grupos/${id}/partidas`} style={{
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
          </div>

          {/* RIGHT column */}
          <div className="grupo-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Members */}
            <section style={{ borderRadius: 22, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '16px 18px 12px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Miembros del grupo ({memberCount})
                </h2>
              </div>
              {(members as any[])?.map((m, i) => (
                <Link
                  key={m.profile_id}
                  href={m.profile_id === user.id ? '/perfil' : `/perfil/${m.profile_id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    borderTop: '1px solid var(--border)',
                    textDecoration: 'none',
                  }}
                >
                  <Avatar name={m.profiles?.display_name ?? '?'} src={(m.profiles as any)?.avatar_url} size={34} />
                  <span style={{
                    fontWeight: 600, fontSize: 13, color: 'var(--text)', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {m.profiles?.display_name ?? 'Usuario'}
                    {(m.profiles as any)?.is_verified && <VerifiedBadge size={12} title="Verificado" />}
                  </span>
                  {m.profile_id === group.owner_id && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--text-4)',
                      background: 'var(--bg-inset)', padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                    }}>
                      Admin
                    </span>
                  )}
                </Link>
              ))}
              <div style={{ padding: '11px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Ver todos los miembros</span>
                <span style={{ color: 'var(--text-4)', fontSize: 16 }}>›</span>
              </div>
            </section>

            {/* Next session */}
            <section style={{ borderRadius: 22, padding: '18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Próxima partida</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  📅
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                  Aún no hay ninguna partida programada.
                </p>
              </div>
              <Link href={`/grupos/${id}/partidas/nueva`} style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
                Programar partida →
              </Link>
            </section>

            {/* Owner settings */}
            {isOwner && (
              <section style={{ borderRadius: 22, padding: '18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Ajustes del grupo</h3>

                {/* Editar grupo */}
                <div style={{ marginBottom: 14 }}>
                  <EditGroupForm
                    groupId={group.id}
                    initialName={group.name}
                    initialDescription={(group as any).description ?? ''}
                    initialImage={(group as any).image_url ?? null}
                    inviteCode={group.invite_code}
                    isOwner={isOwner}
                  />
                </div>

                {/* Invite code */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Código de invitación
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 800, fontSize: 14,
                      padding: '4px 10px', borderRadius: 8, letterSpacing: '0.15em',
                      background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(92,140,42,0.2)',
                    }}>
                      {group.invite_code}
                    </span>
                    <CopyButton text={group.invite_code} />
                    <InviteQR inviteCode={group.invite_code} groupName={group.name} />
                  </div>
                </div>

                {/* Danger zone */}
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginBottom: 10 }}>
                    Esta acción es irreversible y borrará todos los datos del grupo.
                  </p>
                  <DeleteGroupButton groupId={group.id} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, link, sub }: {
  value: string;
  label: string;
  link?: { href: string; text: string };
  sub?: string;
}) {
  return (
    <div style={{ borderRadius: 20, padding: '18px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <p className="grupo-stat-value" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 3, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: sub || link ? 8 : 0 }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginBottom: link ? 6 : 0 }}>
          {sub}
        </p>
      )}
      {link && (
        <Link href={link.href} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
          {link.text} →
        </Link>
      )}
    </div>
  );
}

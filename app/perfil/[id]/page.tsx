import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Achievements } from '../Achievements';
import { FollowButton } from './FollowButton';
import { MessageButton } from './MessageButton';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('profiles').select('display_name').eq('id', id).single();
  return { title: data?.display_name ? `Perfil de ${data.display_name}` : 'Perfil' };
}

function GamePlaceholderIcon() {
  return (
    <svg width="36" height="36" viewBox="0 0 36 36" fill="none" aria-hidden>
      <path d="M10 26L18 10L26 26H10Z" fill="currentColor" opacity="0.3" />
      <rect x="12" y="20" width="8" height="8" rx="2" fill="currentColor" opacity="0.2" />
    </svg>
  );
}

function StatBadge({ label, value }: { label: string; value: number }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 20px', borderRadius: 999, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', whiteSpace: 'nowrap' }}>
      <span style={{ fontSize: 15, color: 'var(--brand)' }}>★</span>
      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>
        {label}: <strong>{value}</strong>
      </span>
    </div>
  );
}

function formatJoinDate(iso: string) {
  return new Date(iso).toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export default async function PublicProfilePage({ params }: Props) {
  const { id: profileId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');
  if (user.id === profileId) redirect('/perfil');

  const [
    { data: profile },
    { data: followStats },
    { data: playsRaw },
    { data: collectionData },
    { data: ratedData },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name, avatar_url, bio, is_verified, created_at').eq('id', profileId).single(),
    supabase.rpc('get_profile_follow_stats', { target_profile_id: profileId }),
    supabase
      .from('plays')
      .select('id, played_at, is_public, games(id, bgg_id, name, image_url), groups(name), play_results!inner(profile_id, is_winner)')
      .eq('play_results.profile_id', profileId)
      .order('played_at', { ascending: false })
      .limit(200),
    supabase
      .from('user_games')
      .select('game_id, games(id, bgg_id, name, image_url)')
      .eq('profile_id', profileId)
      .limit(50),
    supabase
      .from('user_games')
      .select('rating, games(id, bgg_id, name, image_url)')
      .eq('profile_id', profileId)
      .not('rating', 'is', null)
      .gt('rating', 0)
      .order('rating', { ascending: false })
      .limit(30),
  ]);

  if (!profile) notFound();

  const stats = followStats as { followers_count: number; following_count: number; is_following: boolean } | null;
  const isFollowing = stats?.is_following ?? false;
  const followingCount = stats?.following_count ?? 0;

  const displayName = profile.display_name ?? 'Usuario';
  const avatarUrl = (profile as any).avatar_url as string | null;
  const bio = (profile as any).bio as string | null;
  const isVerified = (profile as any).is_verified as boolean ?? false;
  const createdAt = (profile as any).created_at as string | null;

  const myPlays = (playsRaw ?? []).filter((p: any) => p.is_public);
  const totalPlays = myPlays.length;
  const totalWins = myPlays.filter((p: any) => p.play_results?.some((r: any) => r.is_winner)).length;

  const gamePlayMap = new Map<string, { name: string; image_url: string | null; bgg_id: number | null; count: number }>();
  for (const play of myPlays) {
    const game = play.games as any;
    if (!game) continue;
    const existing = gamePlayMap.get(game.name);
    if (existing) { existing.count++; }
    else { gamePlayMap.set(game.name, { name: game.name, image_url: game.image_url ?? null, bgg_id: game.bgg_id ?? null, count: 1 }); }
  }
  const playsByGame = Array.from(gamePlayMap.values()).sort((a, b) => b.count - a.count);
  const collection = (collectionData ?? []).map((ug: any) => ug.games).filter(Boolean);
  const ratedGames = (ratedData ?? []).map((ug: any) => ({ ...ug.games, rating: ug.rating as number })).filter((g: any) => g?.id);

  return (
    <>
      <style>{`
        .p-wrap  { padding: 0 48px 80px; }
        .p-row   { display: flex; align-items: flex-start; gap: 0; padding-top: 32px; }
        .p-main  { flex: 1; min-width: 0; padding-right: 48px; }
        .p-aside { width: 280px; flex-shrink: 0; border-left: 1px solid var(--border); padding-left: 36px; }
        @media (max-width: 1000px) {
          .p-wrap  { padding: 0 28px 80px; }
          .p-row   { flex-direction: column; padding-top: 24px; }
          .p-main  { padding-right: 0; width: 100%; }
          .p-aside { width: 100%; border-left: none; border-top: 1px solid var(--border);
                     padding-left: 0; padding-top: 28px; margin-top: 36px; }
        }
        @media (max-width: 640px) { .p-wrap { padding: 0 16px 80px; } }
      `}</style>

      <main className="p-wrap">

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0 20px', borderBottom: '1px solid var(--border)' }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', color: 'var(--text)', textDecoration: 'none', fontSize: 16, flexShrink: 0 }}>←</Link>
          <h1 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)', letterSpacing: '-0.01em' }}>Perfil</h1>
        </div>

        <div className="p-row">

          {/* ── Columna izquierda ── */}
          <div className="p-main">

            {/* Cabecera del perfil */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
              <div style={{ flexShrink: 0 }}>
                {avatarUrl ? (
                  <Image src={avatarUrl} alt={displayName} width={130} height={130} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 20px rgba(62,94,59,0.2)' }} />
                ) : (
                  <div style={{ width: 130, height: 130, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #c4b5e8, #7c5cbf)', boxShadow: '0 4px 20px rgba(124,92,191,0.25)' }}>
                    {displayName[0]?.toUpperCase()}
                  </div>
                )}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                  <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{displayName}</h2>
                  {isVerified && <VerifiedBadge size={20} title="Perfil verificado" />}
                </div>
                {createdAt && (
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', marginBottom: 8 }}>
                    Usuario desde <em>{formatJoinDate(createdAt)}</em>
                  </p>
                )}
                {bio && (
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 16, maxWidth: 480 }}>{bio}</p>
                )}
                {/* Acciones y seguidores */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                  <FollowButton profileId={profileId} initialIsFollowing={isFollowing} initialFollowersCount={stats?.followers_count ?? 0} />
                  <MessageButton profileId={profileId} />
                  <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-4)' }}>
                    Sigue a <strong style={{ color: 'var(--text)' }}>{followingCount}</strong> {followingCount === 1 ? 'persona' : 'personas'}
                  </span>
                </div>
              </div>
            </div>

            {/* Contadores */}
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
              <StatBadge label="Partidas Jugadas" value={totalPlays} />
              <StatBadge label="Partidas Ganadas" value={totalWins} />
            </div>

            {/* Su colección */}
            {collection.length > 0 && (
              <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Su colección</h2>
                  <span style={{ fontSize: 16, color: 'var(--text-3)' }}>→</span>
                </div>
                <div className="scroll-row" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
                  {collection.map((game: any) => (
                    <Link key={game.id} href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, width: 84 }}>
                      <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                        {game.image_url
                          ? <Image src={game.image_url} alt={game.name} width={84} height={84} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <GamePlaceholderIcon />
                        }
                      </div>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.3, width: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</span>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Juegos valorados */}
            {ratedGames.length > 0 && (
              <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Juegos valorados</h2>
                  <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>★</span>
                </div>
                <div className="scroll-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
                  {ratedGames.map((game: any) => (
                    <Link key={game.id} href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none', flexShrink: 0, width: 130 }}>
                      <div style={{ width: 130, height: 130, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: 'var(--text-4)', position: 'relative' }}>
                        {game.image_url
                          ? <Image src={game.image_url} alt={game.name} width={130} height={130} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <GamePlaceholderIcon />
                        }
                        <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 999 }}>
                          ★ {game.rating}/5
                        </span>
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                    </Link>
                  ))}
                </div>
              </section>
            )}

            {/* Sus partidas */}
            {playsByGame.length > 0 && (
              <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)', paddingBottom: 32 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
                  <h2 style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Sus partidas</h2>
                  <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>✦</span>
                </div>
                <div className="scroll-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
                  {playsByGame.map((item) => (
                    <div key={item.name} style={{ flexShrink: 0, width: 130 }}>
                      <div style={{ width: 130, height: 130, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: 'var(--text-4)' }}>
                        {item.image_url
                          ? <Image src={item.image_url} alt={item.name} width={130} height={130} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          : <GamePlaceholderIcon />
                        }
                      </div>
                      <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>{item.count} Partida{item.count !== 1 ? 's' : ''}</p>
                    </div>
                  ))}
                </div>
              </section>
            )}

          </div>

          {/* ── Columna logros ── */}
          <div className="p-aside">
            <Achievements
              compact
              plays={myPlays as any}
              collectionCount={collection.length}
              userId={profileId}
            />
          </div>

        </div>
      </main>
    </>
  );
}

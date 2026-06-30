import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import Image from 'next/image';
import { Achievements } from './Achievements';
import { EditProfileForm } from './EditProfileForm';
import { ImportBGGCollection } from './ImportBGGCollection';
import { VerificationRequestForm } from './VerificationRequestForm';

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
      <span className="t-card-title">
        {label}: <strong>{value}</strong>
      </span>
    </div>
  );
}

interface Props {
  userId: string;
  isVerified: boolean;
  displayName: string;
  bio: string;
  avatarUrl: string | null;
  socialLinks: any;
  email: string;
  createdAt: string;
}

export async function ProfileContent({ userId, isVerified, displayName, bio, avatarUrl, socialLinks, email, createdAt }: Props) {
  const supabase = await createClient();

  const [
    { data: recentPlays },
    { data: collectionData },
    { data: ratedData },
    { data: wishlistData },
    { data: verificationRequest },
  ] = await Promise.all([
    supabase
      .from('plays')
      .select('id, played_at, games(id, bgg_id, name, image_url), groups(name), play_results!inner(profile_id, is_winner)')
      .eq('play_results.profile_id', userId)
      .order('played_at', { ascending: false })
      .limit(200),
    supabase
      .from('user_games')
      .select('game_id, games(id, bgg_id, name, image_url)')
      .eq('profile_id', userId)
      .eq('in_wishlist', false)
      .limit(50),
    supabase
      .from('user_games')
      .select('rating, games(id, bgg_id, name, image_url)')
      .eq('profile_id', userId)
      .eq('in_wishlist', false)
      .not('rating', 'is', null)
      .gt('rating', 0)
      .order('rating', { ascending: false })
      .limit(30),
    supabase
      .from('user_games')
      .select('game_id, games(id, bgg_id, name, image_url)')
      .eq('profile_id', userId)
      .eq('in_wishlist', true)
      .limit(50),
    supabase
      .from('verification_requests')
      .select('status, reason, category, admin_notes, created_at')
      .eq('user_id', userId)
      .maybeSingle(),
  ]);

  const myPlays = recentPlays ?? [];
  const totalPlays = myPlays.length;
  const totalWins = myPlays.filter((p: any) => p.play_results?.some((r: any) => r.is_winner)).length;

  const gamePlayMap = new Map<string, { name: string; image_url: string | null; bgg_id: number | null; count: number }>();
  for (const play of myPlays) {
    const game = play.games as any;
    if (!game) continue;
    const existing = gamePlayMap.get(game.name);
    if (existing) {
      existing.count++;
    } else {
      gamePlayMap.set(game.name, { name: game.name, image_url: game.image_url ?? null, bgg_id: game.bgg_id ?? null, count: 1 });
    }
  }
  const playsByGame = Array.from(gamePlayMap.values()).sort((a, b) => b.count - a.count);
  const collection = (collectionData ?? []).map((ug: any) => ug.games).filter(Boolean);
  const ratedGames = (ratedData ?? []).map((ug: any) => ({ ...ug.games, rating: ug.rating as number })).filter((g: any) => g?.id);
  const wishlist = (wishlistData ?? []).map((ug: any) => ug.games).filter(Boolean);

  return (
    <>
      <div className="p-main">
        {/* Perfil */}
        <EditProfileForm
          initialName={displayName}
          initialBio={bio}
          initialAvatar={avatarUrl}
          initialSocialLinks={socialLinks}
          email={email}
          createdAt={createdAt}
          isVerified={isVerified}
        />

        {/* Contadores */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 24 }}>
          <StatBadge label="Partidas Jugadas" value={totalPlays} />
          <StatBadge label="Partidas Ganadas" value={totalWins} />
        </div>

        {/* Verificación — solo si no está ya verificado */}
        {!isVerified && (
          <div style={{ marginTop: 20 }}>
            <VerificationRequestForm existingRequest={verificationRequest as any} />
          </div>
        )}

        {/* Explora tus juegos */}
        <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24, gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <h2 className="t-section-title">Explora tus juegos</h2>
              <span style={{ fontSize: 16, color: 'var(--text-3)' }}>→</span>
            </div>
            <ImportBGGCollection />
          </div>
          {collection.length === 0 ? (
            <p className="t-card-sub">
              Tu colección está vacía.{' '}
              <Link href="/buscar" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Añade juegos →</Link>
            </p>
          ) : (
            <div className="scroll-row" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {collection.map((game: any, i: number) => (
                <Link
                  key={game.id}
                  href={`/juegos/${game.bgg_id}`}
                  className="stagger-in"
                  style={{ ['--stagger-i' as any]: i, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, width: 84 }}
                >
                  <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                    {game.image_url
                      ? <Image src={game.image_url} alt={game.name} width={84} height={84} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <GamePlaceholderIcon />
                    }
                  </div>
                  <span className="t-card-sub" style={{ textAlign: 'center', lineHeight: 1.3, width: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Lista de deseos */}
        <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <h2 className="t-section-title">Lista de Deseos</h2>
            <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>♥</span>
          </div>
          {wishlist.length === 0 ? (
            <p className="t-card-sub">
              Tu lista de deseos está vacía.{' '}
              <Link href="/buscar" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Descubre juegos →</Link>
            </p>
          ) : (
            <div className="scroll-row" style={{ display: 'flex', gap: 20, overflowX: 'auto', paddingBottom: 4 }}>
              {wishlist.map((game: any, i: number) => (
                <Link
                  key={game.id}
                  href={`/juegos/${game.bgg_id}`}
                  className="stagger-in"
                  style={{ ['--stagger-i' as any]: i, textDecoration: 'none', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, flexShrink: 0, width: 84 }}
                >
                  <div style={{ width: 84, height: 84, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)', position: 'relative' }}>
                    {game.image_url
                      ? <Image src={game.image_url} alt={game.name} width={84} height={84} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <GamePlaceholderIcon />
                    }
                    <span style={{ position: 'absolute', bottom: 3, right: 3, fontSize: 12, lineHeight: 1 }}>♥</span>
                  </div>
                  <span className="t-card-sub" style={{ textAlign: 'center', lineHeight: 1.3, width: 84, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {game.name}
                  </span>
                </Link>
              ))}
            </div>
          )}
        </section>

        {/* Juegos valorados */}
        {ratedGames.length > 0 && (
          <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
              <h2 className="t-section-title">Juegos valorados</h2>
              <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>★</span>
            </div>
            <div className="scroll-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {ratedGames.map((game: any, i: number) => (
                <Link key={game.id} href={`/juegos/${game.bgg_id}`} className="stagger-in" style={{ ['--stagger-i' as any]: i, textDecoration: 'none', flexShrink: 0, width: 130 }}>
                  <div style={{ width: 130, height: 130, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: 'var(--text-4)', position: 'relative' }}>
                    {game.image_url
                      ? <Image src={game.image_url} alt={game.name} width={130} height={130} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <GamePlaceholderIcon />
                    }
                    <span style={{ position: 'absolute', bottom: 8, right: 8, background: 'rgba(0,0,0,0.65)', color: 'white', fontSize: 11, fontWeight: 800, padding: '3px 7px', borderRadius: 999 }}>
                      ★ {game.rating}/5
                    </span>
                  </div>
                  <p className="t-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{game.name}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Tus partidas */}
        <section style={{ marginTop: 36, paddingTop: 32, borderTop: '1px solid var(--border)', paddingBottom: 32 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 24 }}>
            <h2 className="t-section-title">Tus partidas</h2>
            <span style={{ fontSize: 14, color: 'var(--brand)', fontWeight: 700 }}>✦</span>
          </div>
          {playsByGame.length === 0 ? (
            <p className="t-card-sub">Sin partidas registradas todavía.</p>
          ) : (
            <div className="scroll-row" style={{ display: 'flex', gap: 14, overflowX: 'auto', paddingBottom: 4 }}>
              {playsByGame.map((item, i) => (
                <div key={item.name} className="stagger-in" style={{ ['--stagger-i' as any]: i, flexShrink: 0, width: 130 }}>
                  <div style={{ width: 130, height: 130, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 10, color: 'var(--text-4)' }}>
                    {item.image_url
                      ? <Image src={item.image_url} alt={item.name} width={130} height={130} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : <GamePlaceholderIcon />
                    }
                  </div>
                  <p className="t-card-title" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{item.name}</p>
                  <p className="t-card-sub" style={{ marginTop: 2 }}>{item.count} Partida{item.count !== 1 ? 's' : ''}</p>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

      {/* ── Columna logros ── */}
      <div className="p-aside">
        <Achievements
          compact
          plays={myPlays as any}
          collectionCount={collection.length}
          userId={userId}
        />
      </div>
    </>
  );
}

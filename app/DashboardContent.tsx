import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getTrendingGames } from '@/lib/cached-queries';
import { BeginnerSection } from '@/components/BeginnerSection';

interface Props {
  userId: string;
  beginnerGames: any[];
}

export async function DashboardContent({ userId, beginnerGames }: Props) {
  const supabase = await createClient();

  const [groupsRes, playsRes, userCollectionRes, allPlaysRes, trendingResult] = await Promise.all([
    supabase
      .from('group_members')
      .select('group_id, groups(id, name)')
      .eq('profile_id', userId),
    supabase
      .from('plays')
      .select('id, played_at, group_id, games(name, image_url, bgg_id), groups(name), play_results!inner(profile_id, is_winner)')
      .eq('play_results.profile_id', userId)
      .order('played_at', { ascending: false })
      .limit(6),
    supabase
      .from('user_games')
      .select('games(bgg_id, name, image_url)')
      .eq('profile_id', userId)
      .limit(14),
    supabase
      .from('plays')
      .select('games(bgg_id, name, image_url), play_results!inner(profile_id)')
      .eq('play_results.profile_id', userId)
      .limit(100),
    getTrendingGames(),
  ]);

  const dashboardGroups: any[] = groupsRes.data ?? [];
  const dashboardPlays: any[] = playsRes.data ?? [];

  const userCollectionGames = (userCollectionRes.data ?? [])
    .map((r: any) => r.games)
    .filter((g: any) => g?.image_url);

  const gameMap: Record<string, any> = {};
  (allPlaysRes.data ?? []).forEach((r: any) => {
    const g = r.games;
    if (!g?.bgg_id) return;
    if (!gameMap[g.bgg_id]) gameMap[g.bgg_id] = { bgg_id: g.bgg_id, name: g.name, image_url: g.image_url, count: 0 };
    gameMap[g.bgg_id].count++;
  });
  const playsPerGame = Object.values(gameMap)
    .sort((a: any, b: any) => b.count - a.count)
    .slice(0, 10);

  const trendingGames = (trendingResult ?? []).filter((g: any) => !g.is_expansion);

  const exploreGames = userCollectionGames.length > 0 ? userCollectionGames : trendingGames;
  const totalUserPlays = playsPerGame.reduce((acc: number, g: any) => acc + (g.count ?? 0), 0);

  return (
    <>
      {/* Explora tus juegos */}
      <section>
        <RowHeader title="Explora tus juegos" href={userCollectionGames.length > 0 ? '/perfil' : '/buscar'} />
        <div className="h-scroll">
          {exploreGames.map((game: any, i: number) => (
            <CircleGameItem key={game.bgg_id} game={game} index={i} />
          ))}
          {exploreGames.length === 0 && (
            <Link href="/buscar" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, width: 100 }}>
              <div style={{ width: 88, height: 88, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, color: 'var(--brand)' }}>+</div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center' }}>Añadir</span>
            </Link>
          )}
        </div>
      </section>

      {/* Iníciate en los juegos de mesa — solo para usuarios nuevos */}
      {totalUserPlays < 5 && beginnerGames.length > 0 && (
        <BeginnerSection games={beginnerGames} />
      )}

      {/* Tus Eventos */}
      {dashboardGroups.length > 0 && (
        <section>
          <RowHeader title="Tus Eventos" href="/grupos" />
          <div className="h-scroll">
            {dashboardGroups.slice(0, 6).map((m: any, i: number) => {
              if (!m.groups) return null;
              const lastPlay = dashboardPlays.find((p: any) => p.group_id === m.group_id);
              return (
                <EventCard
                  key={m.group_id}
                  index={i}
                  href={`/grupos/${m.groups.id}`}
                  name={m.groups.name}
                  imageUrl={lastPlay?.games?.image_url}
                  lastPlayDate={lastPlay?.played_at}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Los más jugados esta semana */}
      {trendingGames.length > 0 && (
        <section>
          <RowHeader title="¡Los más jugados esta semana!" href="/buscar" starred />
          <div className="h-scroll">
            {trendingGames.map((game: any, i: number) => (
              <CircleGameItem key={game.bgg_id} game={game} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Tus partidas */}
      <section>
        <RowHeader title="Tus partidas" href="/partidas" starred />
        {playsPerGame.length > 0 ? (
          <div className="h-scroll">
            {playsPerGame.map((item: any, i: number) => (
              <PlayCard key={item.bgg_id} item={item} index={i} />
            ))}
          </div>
        ) : dashboardPlays.length > 0 ? (
          <div className="h-scroll">
            {dashboardPlays.filter((p: any) => p.games).map((play: any, i: number) => (
              <PlayCard
                key={play.id}
                index={i}
                item={{ bgg_id: play.games.bgg_id, name: play.games.name, image_url: play.games.image_url, count: 1 }}
              />
            ))}
          </div>
        ) : (
          <div style={{ borderRadius: 16, padding: '36px 28px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card-hover)' }}>
            <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)', marginBottom: 20 }}>Aún no has registrado partidas.</p>
            <Link href="/grupos" style={{ display: 'inline-block', padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 14, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}>
              Ir a mis grupos →
            </Link>
          </div>
        )}
      </section>
    </>
  );
}

/* ── Section header ─────────────────────────────────── */

function RowHeader({ title, href, starred }: { title: string; href: string; starred?: boolean }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.015em', display: 'flex', alignItems: 'center', gap: 8 }}>
        {title}
        {starred && (
          <svg width="16" height="16" viewBox="0 0 24 24" fill="var(--brand)" stroke="none">
            <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
          </svg>
        )}
      </h2>
      <Link href={href} aria-label={`Ver todo: ${title}`} style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-4)', textDecoration: 'none', lineHeight: 1 }}>→</Link>
    </div>
  );
}

/* ── Circular game item ─────────────────────────────── */

function CircleGameItem({ game, index }: { game: { bgg_id: string; name: string; image_url?: string }; index: number }) {
  return (
    <Link
      href={`/juegos/${game.bgg_id}`}
      className="hover-scale stagger-in"
      style={{ ['--stagger-i' as any]: index, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, width: 104 }}
    >
      <div style={{
        width: 88, height: 88, borderRadius: '50%', overflow: 'hidden', flexShrink: 0,
        background: 'var(--bg-inset)', position: 'relative',
        boxShadow: '0 4px 14px rgba(58,55,47,0.14), 0 0 0 3px var(--bg-card), 0 0 0 4px var(--border)',
      }}>
        {game.image_url ? (
          <Image
            src={game.image_url}
            alt={game.name}
            width={88}
            height={88}
            style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎲</div>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', width: 104, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {game.name}
      </span>
    </Link>
  );
}

/* ── Event card ─────────────────────────────────────── */

function EventCard({ href, name, imageUrl, lastPlayDate, index }: { href: string; name: string; imageUrl?: string; lastPlayDate?: string; index: number }) {
  const dateLabel = lastPlayDate
    ? new Date(lastPlayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Link href={href} className="hover-scale-md stagger-in" style={{
      ['--stagger-i' as any]: index,
      textDecoration: 'none', flexShrink: 0, width: 300, borderRadius: 18, overflow: 'hidden',
      background: 'var(--bg-card)', display: 'block',
      boxShadow: '0 4px 20px rgba(58,55,47,0.13), 0 1px 4px rgba(58,55,47,0.08), 0 0 0 1px rgba(216,203,188,0.7)',
    }}>
      <div style={{ height: 170, background: 'var(--bg-inset)', position: 'relative', overflow: 'hidden' }}>
        {imageUrl ? (
          <>
            <Image src={imageUrl} alt={name} fill sizes="300px" style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(0,0,0,0) 40%, rgba(0,0,0,0.45) 100%)', zIndex: 1 }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <PlaceholderSvg />
          </div>
        )}
        <div style={{
          position: 'absolute', top: 12, right: 12, zIndex: 2,
          width: 34, height: 34, borderRadius: '50%',
          background: 'var(--brand)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 2px 8px rgba(62,94,59,0.4)',
        }}>
          <PlusSvg />
        </div>
      </div>
      <div style={{ padding: '14px 18px 16px' }}>
        <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 4 }}>{name}</p>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>{dateLabel ?? 'Ver grupo →'}</p>
      </div>
    </Link>
  );
}

/* ── Play count card ────────────────────────────────── */

function PlayCard({ item, index }: { item: { bgg_id: string; name: string; image_url?: string; count: number }; index: number }) {
  return (
    <Link href={`/juegos/${item.bgg_id}`} className="hover-scale-md stagger-in" style={{
      ['--stagger-i' as any]: index,
      textDecoration: 'none', flexShrink: 0, width: 128, borderRadius: 14, overflow: 'hidden',
      background: 'var(--bg-card)', display: 'block',
      boxShadow: '0 4px 20px rgba(58,55,47,0.13), 0 1px 4px rgba(58,55,47,0.08), 0 0 0 1px rgba(216,203,188,0.7)',
    }}>
      <div style={{ height: 165, background: 'var(--bg-inset)', overflow: 'hidden', position: 'relative' }}>
        {item.image_url ? (
          <>
            <Image src={item.image_url} alt={item.name} fill sizes="128px" style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)', zIndex: 1 }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}>🎲</div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontWeight: 800, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{item.name}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>{item.count} {item.count === 1 ? 'Partida' : 'Partidas'}</p>
      </div>
    </Link>
  );
}

/* ── SVG Icons ──────────────────────────────────────── */

function PlaceholderSvg() {
  return <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 6 19 18 12 22 5 18 5 6 12 2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="5" y1="6" x2="9.5" y2="9"/><line x1="14.5" y1="15" x2="19" y2="18"/><line x1="19" y1="6" x2="14.5" y2="9"/><line x1="9.5" y1="15" x2="5" y2="18"/></svg>;
}

function PlusSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

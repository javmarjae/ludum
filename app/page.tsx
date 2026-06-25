import Link from 'next/link';
import Image from 'next/image';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Nav, NavLink, NavButton } from '@/components/Nav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getAuthUser, createClient } from '@/lib/supabase/server';
import { BeginnerSection } from '@/components/BeginnerSection';

function getPublicSupabase() {
  return createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

/* getLandingGames: tabla "games" con acceso público (sin RLS).
   La tabla "plays" requiere sesión autenticada → trending se
   resuelve dentro del bloque if(user) con createClient(). */
const getLandingGames = unstable_cache(
  async () => {
    const supabase = getPublicSupabase();
    const [featuredResult, beginnerResult] = await Promise.all([
      supabase
        .from('games')
        .select('bgg_id, name, image_url')
        .not('image_url', 'is', null)
        .not('bgg_rank', 'is', null)
        .order('bgg_rank', { ascending: true })
        .limit(15),
      supabase
        .from('games')
        .select('bgg_id, name, image_url, min_players, max_players, min_playtime, max_playtime')
        .not('bgg_rank', 'is', null)
        .not('image_url', 'is', null)
        .gte('complexity', 1)
        .lte('complexity', 2.5)
        .order('bgg_rank', { ascending: true })
        .limit(16),
    ]);
    return {
      featuredGames: featuredResult.data ?? [],
      beginnerGames: beginnerResult.data ?? [],
    };
  },
  ['home-landing-games'],
  { revalidate: 3600 }
);

export default async function Home() {
  const user = await getAuthUser();
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? null;

  /* getLandingGames usa el cliente público (tabla games, sin RLS).
     Se llama siempre (landing y dashboard necesitan beginnerGames). */
  const { featuredGames, beginnerGames } = await getLandingGames();

  let dashboardGroups: any[] = [];
  let dashboardPlays: any[] = [];
  let userCollectionGames: any[] = [];
  let playsPerGame: any[] = [];
  let trendingGames: any[] = [];

  if (user) {
    const supabase = await createClient();
    const twoWeeksAgo = new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString();

    const [groupsRes, playsRes, userCollectionRes, allPlaysRes, trendingRes] = await Promise.all([
      supabase
        .from('group_members')
        .select('group_id, groups(id, name)')
        .eq('profile_id', user.id),
      supabase
        .from('plays')
        .select('id, played_at, group_id, games(name, image_url, bgg_id), groups(name), play_results!inner(profile_id, is_winner)')
        .eq('play_results.profile_id', user.id)
        .order('played_at', { ascending: false })
        .limit(6),
      supabase
        .from('user_games')
        .select('games(bgg_id, name, image_url)')
        .eq('profile_id', user.id)
        .limit(14),
      supabase
        .from('plays')
        .select('games(bgg_id, name, image_url), play_results!inner(profile_id)')
        .eq('play_results.profile_id', user.id)
        .limit(100),
      supabase
        .from('plays')
        .select('games(bgg_id, name, image_url)')
        .gte('played_at', twoWeeksAgo)
        .limit(150),
    ]);

    dashboardGroups = groupsRes.data ?? [];
    dashboardPlays = playsRes.data ?? [];

    userCollectionGames = (userCollectionRes.data ?? [])
      .map((r: any) => r.games)
      .filter((g: any) => g?.image_url);

    const gameMap: Record<string, any> = {};
    (allPlaysRes.data ?? []).forEach((r: any) => {
      const g = r.games;
      if (!g?.bgg_id) return;
      if (!gameMap[g.bgg_id]) gameMap[g.bgg_id] = { bgg_id: g.bgg_id, name: g.name, image_url: g.image_url, count: 0 };
      gameMap[g.bgg_id].count++;
    });
    playsPerGame = Object.values(gameMap)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 10);

    const trendingFreq: Record<string, any> = {};
    (trendingRes.data ?? []).forEach((r: any) => {
      const g = r.games;
      if (!g?.bgg_id || !g?.image_url) return;
      if (!trendingFreq[g.bgg_id]) trendingFreq[g.bgg_id] = { bgg_id: g.bgg_id, name: g.name, image_url: g.image_url, count: 0 };
      trendingFreq[g.bgg_id].count++;
    });
    trendingGames = Object.values(trendingFreq)
      .sort((a: any, b: any) => b.count - a.count)
      .slice(0, 14);
  }

  const covers = featuredGames;
  const exploreGames = userCollectionGames.length > 0 ? userCollectionGames : trendingGames;
  const beginnerList = beginnerGames;
  const totalUserPlays = playsPerGame.reduce((acc: number, g: any) => acc + (g.count ?? 0), 0);

  /* ──────────────────────────────────────────────────── */

  return (
    <>
      {/* ── NO LOGUEADO ─────────────────────────────────── */}
      {!user && (
        <div style={{ background: 'transparent', minHeight: '100vh' }}>
          <Nav
            right={
              <>
                <NavLink href="/buscar">Buscar</NavLink>
                <NavLink href="/recomendador">Recomendador</NavLink>
                <ThemeToggle />
                <NavButton href="/auth/login" variant="brand">Entrar</NavButton>
              </>
            }
          />

          <section className="home-hero" style={{ maxWidth: 1120, margin: '0 auto', padding: '72px 32px 80px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 64, alignItems: 'center' }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 20 }}>
                Tracker · Recomendador · Comunidad
              </p>
              <h1 style={{ fontSize: 'clamp(36px, 4vw, 56px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.06, color: 'var(--text)', marginBottom: 20 }}>
                Tu historial de<br />
                <span style={{ color: 'var(--brand)' }}>juegos de mesa</span>
              </h1>
              <p style={{ fontSize: 17, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.65, marginBottom: 36, maxWidth: 420 }}>
                Registra partidas, descubre nuevos juegos y compara con tus amigos. Con datos de más de 138.000 títulos de BoardGameGeek.
              </p>
              <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <Link href="/auth/login" style={{ padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}>
                  Empezar gratis
                </Link>
                <Link href="/buscar" style={{ padding: '13px 24px', borderRadius: 8, fontWeight: 700, fontSize: 15, color: 'var(--text-2)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', textDecoration: 'none' }}>
                  Buscar juegos →
                </Link>
              </div>
            </div>
            <div className="home-covers" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 8 }}>
              {covers.slice(0, 15).map((g: any, i: number) => (
                <Link
                  key={g.bgg_id}
                  href={`/juegos/${g.bgg_id}`}
                  className="hover-cover"
                  style={{
                    display: 'block', textDecoration: 'none', position: 'relative',
                    aspectRatio: '2/3', borderRadius: 6, overflow: 'hidden',
                    opacity: i > 9 ? 0.5 : i > 4 ? 0.75 : 1,
                    boxShadow: 'var(--shadow-card)',
                  }}
                >
                  {g.image_url ? (
                    <Image
                      src={g.image_url}
                      alt={g.name}
                      fill
                      sizes="(max-width: 860px) 0px, 9vw"
                      style={{ objectFit: 'cover' }}
                      priority={i < 5}
                    />
                  ) : (
                    <div style={{ width: '100%', height: '100%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎲</div>
                  )}
                </Link>
              ))}
            </div>
          </section>

          <section style={{ borderTop: '1px solid var(--border)', borderBottom: '1px solid var(--border)', background: 'var(--bg-card)' }}>
            <div className="home-steps" style={{ maxWidth: 1120, margin: '0 auto', padding: '64px 32px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 48 }}>
              {[
                { n: '01', title: 'Busca tu juego', desc: 'Más de 138.000 títulos de BoardGameGeek con mecánicas, valoraciones y tiempo de juego.' },
                { n: '02', title: 'Registra partidas', desc: 'Crea un grupo con tus amigos, anota el resultado de cada sesión y lleva el ranking.' },
                { n: '03', title: 'Descubre qué jugar', desc: 'El recomendador analiza tu grupo y sugiere el juego perfecto para la sesión de hoy.' },
              ].map(({ n, title, desc }) => (
                <div key={n}>
                  <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--brand)', opacity: 0.25, letterSpacing: '-0.02em', marginBottom: 12, lineHeight: 1 }}>{n}</p>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 10, letterSpacing: '-0.01em' }}>{title}</h3>
                  <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.65 }}>{desc}</p>
                </div>
              ))}
            </div>
          </section>

          <BeginnerSection games={beginnerList} isLanding />

          <section style={{ maxWidth: 1120, margin: '0 auto', padding: '64px clamp(16px,4vw,32px) 80px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 32, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', gap: 48, flexWrap: 'wrap' }}>
              {[
                { value: '138k+', label: 'juegos en catálogo' },
                { value: '100%', label: 'gratuito' },
                { value: 'BGG', label: 'datos verificados' },
              ].map(s => (
                <div key={s.label}>
                  <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
                  <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</p>
                </div>
              ))}
            </div>
            <Link href="/auth/login" style={{ padding: '13px 28px', borderRadius: 8, fontWeight: 700, fontSize: 15, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none', flexShrink: 0 }}>
              Crear cuenta gratis →
            </Link>
          </section>
        </div>
      )}

      {/* ── LOGUEADO ────────────────────────────────────── */}
      {user && (
        <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

          {/* Top header */}
          <div className="home-dash-header">
            <Link href="/perfil" style={{
              width: 48, height: 48, borderRadius: '50%',
              background: 'var(--bg-card)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              color: 'var(--text-3)', textDecoration: 'none',
              boxShadow: '0 2px 10px rgba(58,55,47,0.10), 0 0 0 1px rgba(216,203,188,0.8)',
              flexShrink: 0,
            }}>
              <ProfileSvg />
            </Link>
            <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', textAlign: 'center' }}>
              Hola, {displayName}
            </h1>
            <div />
          </div>

          <div className="home-dash-content">

            {/* Explora tus juegos */}
            <section>
              <RowHeader title="Explora tus juegos" href={userCollectionGames.length > 0 ? '/perfil' : '/buscar'} />
              <div className="h-scroll">
                {exploreGames.map((game: any) => (
                  <CircleGameItem key={game.bgg_id} game={game} />
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
            {totalUserPlays < 5 && beginnerList.length > 0 && (
              <BeginnerSection games={beginnerList} />
            )}

            {/* Tus Eventos */}
            {dashboardGroups.length > 0 && (
              <section>
                <RowHeader title="Tus Eventos" href="/grupos" />
                <div className="h-scroll">
                  {dashboardGroups.slice(0, 6).map((m: any) => {
                    if (!m.groups) return null;
                    const lastPlay = dashboardPlays.find((p: any) => p.group_id === m.group_id);
                    return (
                      <EventCard
                        key={m.group_id}
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
                  {trendingGames.map((game: any) => (
                    <CircleGameItem key={game.bgg_id} game={game} />
                  ))}
                </div>
              </section>
            )}

            {/* Tus partidas */}
            <section>
              <RowHeader title="Tus partidas" href="/partidas" starred />
              {playsPerGame.length > 0 ? (
                <div className="h-scroll">
                  {playsPerGame.map((item: any) => (
                    <PlayCard key={item.bgg_id} item={item} />
                  ))}
                </div>
              ) : dashboardPlays.length > 0 ? (
                <div className="h-scroll">
                  {dashboardPlays.filter((p: any) => p.games).map((play: any) => (
                    <PlayCard
                      key={play.id}
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

          </div>
        </div>
      )}
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
      <Link href={href} style={{ fontSize: 20, fontWeight: 700, color: 'var(--text-4)', textDecoration: 'none', lineHeight: 1 }}>→</Link>
    </div>
  );
}

/* ── Circular game item ─────────────────────────────── */

function CircleGameItem({ game }: { game: { bgg_id: string; name: string; image_url?: string } }) {
  return (
    <Link href={`/juegos/${game.bgg_id}`} className="hover-scale" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, textDecoration: 'none', flexShrink: 0, width: 104 }}>
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

function EventCard({ href, name, imageUrl, lastPlayDate }: { href: string; name: string; imageUrl?: string; lastPlayDate?: string }) {
  const dateLabel = lastPlayDate
    ? new Date(lastPlayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Link href={href} className="hover-scale-md" style={{
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

function PlayCard({ item }: { item: { bgg_id: string; name: string; image_url?: string; count: number } }) {
  return (
    <Link href={`/juegos/${item.bgg_id}`} className="hover-scale-md" style={{
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

function ProfileSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

function PlaceholderSvg() {
  return <svg width="56" height="56" viewBox="0 0 24 24" fill="none" stroke="var(--sand)" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 6 19 18 12 22 5 18 5 6 12 2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="5" y1="6" x2="9.5" y2="9"/><line x1="14.5" y1="15" x2="19" y2="18"/><line x1="19" y1="6" x2="14.5" y2="9"/><line x1="9.5" y1="15" x2="5" y2="18"/></svg>;
}

function PlusSvg() {
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}

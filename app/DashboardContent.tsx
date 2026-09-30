import Link from 'next/link';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/server';
import { getTrendingGames } from '@/lib/cached-queries';
import { BeginnerSection } from '@/components/BeginnerSection';
import { Picto } from '@/components/Picto';

interface Props {
  userId: string;
  beginnerGames: any[];
}

export async function DashboardContent({ userId, beginnerGames }: Props) {
  const supabase = await createClient();

  const [groupsRes, playsRes, userCollectionRes, allPlaysRes, trendingResult, playCountRes, winCountRes] = await Promise.all([
    supabase
      .from('group_members')
      .select('group_id, groups(id, name, image_url)')
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
    supabase
      .from('play_results')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId),
    supabase
      .from('play_results')
      .select('id', { count: 'exact', head: true })
      .eq('profile_id', userId)
      .eq('is_winner', true),
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
  const totalUserPlays = playCountRes.count ?? 0;
  const totalWins = winCountRes.count ?? 0;
  const winRate = totalUserPlays > 0 ? Math.round((totalWins / totalUserPlays) * 100) : 0;

  return (
    <>
      {/* Acciones rápidas: los dos momentos clave del producto
          (decidir qué jugar / registrar lo jugado) a un clic */}
      <section aria-label="Acciones rápidas">
        <div className="dash-quick-actions">
          <QuickAction
            href="/recomendador"
            primary
            title="¿Qué jugamos hoy?"
            sub="Recomendación para tu grupo"
            icon={<StarSvg />}
          />
          <QuickAction
            href={dashboardGroups.length === 1 ? `/grupos/${dashboardGroups[0].group_id}/partidas/nueva` : '/grupos'}
            title="Registrar partida"
            sub="Anota quién ganó"
            icon={<DiceSvg />}
          />
          <QuickAction
            href="/buscar"
            title="Buscar juegos"
            sub="Más de 138.000 títulos"
            icon={<SearchSvg />}
          />
          <QuickAction
            href="/partidas"
            title="Tus estadísticas"
            sub="Historial y ranking"
            icon={<ChartSvg />}
          />
        </div>
      </section>

      {/* Resumen del jugador */}
      {totalUserPlays > 0 && (
        <section aria-label="Tu resumen">
          <div className="dash-stats">
            <StatTile value={totalUserPlays} label={totalUserPlays === 1 ? 'Partida jugada' : 'Partidas jugadas'} />
            <StatTile value={totalWins} label={totalWins === 1 ? 'Victoria' : 'Victorias'} />
            <StatTile value={`${winRate}%`} label="Ratio de victoria" />
            <StatTile value={dashboardGroups.length} label={dashboardGroups.length === 1 ? 'Grupo' : 'Grupos'} />
          </div>
        </section>
      )}

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

      {/* Tus grupos */}
      {dashboardGroups.length > 0 && (
        <section>
          <RowHeader title="Tus grupos" href="/grupos" />
          <div className="h-scroll">
            {dashboardGroups.slice(0, 6).map((m: any, i: number) => {
              if (!m.groups) return null;
              const lastPlay = dashboardPlays.find((p: any) => p.group_id === m.group_id);
              return (
                <GroupCard
                  key={m.group_id}
                  index={i}
                  href={`/grupos/${m.groups.id}`}
                  name={m.groups.name}
                  imageUrl={m.groups.image_url ?? lastPlay?.games?.image_url}
                  lastPlayDate={lastPlay?.played_at}
                />
              );
            })}
          </div>
        </section>
      )}

      {/* Los más jugados esta semana — si no hay colección, "Explora tus
          juegos" ya muestra el trending y esta sección sería un duplicado */}
      {trendingGames.length > 0 && userCollectionGames.length > 0 && (
        <section>
          <RowHeader title="Los más jugados esta semana" href="/buscar" />
          <div className="h-scroll">
            {trendingGames.map((game: any, i: number) => (
              <CoverGameItem key={game.bgg_id} game={game} index={i} />
            ))}
          </div>
        </section>
      )}

      {/* Tus partidas */}
      <section>
        <RowHeader title="Tus partidas" href="/partidas" />
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

/* ── Acción rápida ──────────────────────────────────── */

function QuickAction({ href, title, sub, icon, primary }: { href: string; title: string; sub: string; icon: React.ReactNode; primary?: boolean }) {
  return (
    <Link href={href} className="hover-lift dash-qa" style={{
      background: primary ? 'var(--brand)' : 'var(--bg-card)',
      boxShadow: primary ? 'var(--shadow-btn-brand)' : 'var(--shadow-card)',
    }}>
      <div className="dash-qa-icon" style={{
        background: primary ? 'color-mix(in srgb, var(--on-brand) 16%, transparent)' : 'var(--brand-tint)',
        color: primary ? 'var(--on-brand)' : 'var(--brand)',
      }}>
        {icon}
      </div>
      <div style={{ minWidth: 0 }}>
        <p className="dash-qa-title" style={{ color: primary ? 'var(--on-brand)' : 'var(--text)' }}>{title}</p>
        <p className="dash-qa-sub" style={{ color: primary ? 'var(--on-brand)' : 'var(--text-3)', opacity: primary ? 0.82 : 1 }}>{sub}</p>
      </div>
    </Link>
  );
}

/* ── Stat tile ──────────────────────────────────────── */

function StatTile({ value, label }: { value: number | string; label: string }) {
  return (
    <div className="dash-stat">
      <p className="dash-stat-value">{value}</p>
      <p className="dash-stat-label">{label}</p>
    </div>
  );
}

/* ── Section header ─────────────────────────────────── */

function RowHeader({ title, href }: { title: string; href: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, marginBottom: 16 }}>
      <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.015em', minWidth: 0 }}>
        {title}
      </h2>
      <Link href={href} aria-label={`Ver todo: ${title}`} className="hover-ghost dash-see-all">Ver todo</Link>
    </div>
  );
}

/* ── Circular game item ─────────────────────────────── */

function CircleGameItem({ game, index }: { game: { bgg_id: string; name: string; image_url?: string }; index: number }) {
  return (
    <Link
      href={`/juegos/${game.bgg_id}`}
      prefetch={false}
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
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}><Picto emoji="🎲" /></div>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', textAlign: 'center', width: 104, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {game.name}
      </span>
    </Link>
  );
}

/* ── Group card ── */

function GroupCard({ href, name, imageUrl, lastPlayDate, index }: { href: string; name: string; imageUrl?: string; lastPlayDate?: string; index: number }) {
  const dateLabel = lastPlayDate
    ? new Date(lastPlayDate).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })
    : null;

  return (
    <Link href={href} className="hover-scale-md stagger-in" style={{
      ['--stagger-i' as any]: index,
      textDecoration: 'none', flexShrink: 0, width: 264, borderRadius: 16,
      background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
      display: 'flex', alignItems: 'center', gap: 14, padding: 12,
    }}>
      <div style={{ position: 'relative', width: 60, height: 60, flexShrink: 0, borderRadius: 12, overflow: 'hidden', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {imageUrl ? (
          <Image src={imageUrl} alt="" fill sizes="60px" style={{ objectFit: 'cover' }} />
        ) : (
          <PlaceholderSvg />
        )}
      </div>
      <div style={{ minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{name}</p>
        <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)' }}>
          {dateLabel ? `Última partida · ${dateLabel}` : 'Sin partidas aún'}
        </p>
      </div>
    </Link>
  );
}

function CoverGameItem({ game, index }: { game: { bgg_id: string; name: string; image_url?: string }; index: number }) {
  return (
    <Link
      href={`/juegos/${game.bgg_id}`}
      prefetch={false}
      className="hover-scale stagger-in"
      style={{ ['--stagger-i' as any]: index, display: 'flex', flexDirection: 'column', gap: 8, textDecoration: 'none', flexShrink: 0, width: 100 }}
    >
      <div style={{ position: 'relative', width: 100, aspectRatio: '2 / 3', borderRadius: 10, overflow: 'hidden', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-card)' }}>
        {game.image_url ? (
          <Image src={game.image_url} alt={game.name} fill sizes="100px" style={{ objectFit: 'cover' }} />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}><Picto emoji="🎲" /></div>
        )}
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-2)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
        {game.name}
      </span>
    </Link>
  );
}

/* ── Play count card ────────────────────────────────── */

function PlayCard({ item, index }: { item: { bgg_id: string; name: string; image_url?: string; count: number }; index: number }) {
  return (
    <Link href={`/juegos/${item.bgg_id}`} prefetch={false} className="hover-scale-md stagger-in" style={{
      ['--stagger-i' as any]: index,
      textDecoration: 'none', flexShrink: 0, width: 128, borderRadius: 14, overflow: 'hidden',
      background: 'var(--bg-card)', display: 'block',
      boxShadow: 'var(--shadow-card)',
    }}>
      <div style={{ height: 165, background: 'var(--bg-inset)', overflow: 'hidden', position: 'relative' }}>
        {item.image_url ? (
          <>
            <Image src={item.image_url} alt={item.name} fill sizes="128px" style={{ objectFit: 'cover' }} />
            <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 50%, rgba(0,0,0,0.3) 100%)', zIndex: 1 }} />
          </>
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 36 }}><Picto emoji="🎲" /></div>
        )}
      </div>
      <div style={{ padding: '10px 12px 12px' }}>
        <p style={{ fontWeight: 800, fontSize: 12, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{item.name}</p>
        <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-3)' }}>{item.count} {item.count === 1 ? 'Partida' : 'Partidas'}</p>
      </div>
    </Link>
  );
}

/* ── SVG Icons ──────────────────────────────────────── */

function PlaceholderSvg() {
  return <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 19 6 19 18 12 22 5 18 5 6 12 2"/><circle cx="12" cy="12" r="3"/><line x1="12" y1="2" x2="12" y2="9"/><line x1="12" y1="15" x2="12" y2="22"/><line x1="5" y1="6" x2="9.5" y2="9"/><line x1="14.5" y1="15" x2="19" y2="18"/><line x1="19" y1="6" x2="14.5" y2="9"/><line x1="9.5" y1="15" x2="5" y2="18"/></svg>;
}

function StarSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}

function DiceSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="18" height="18" rx="4"/><circle cx="8.5" cy="8.5" r="0.5" fill="currentColor"/><circle cx="15.5" cy="8.5" r="0.5" fill="currentColor"/><circle cx="8.5" cy="15.5" r="0.5" fill="currentColor"/><circle cx="15.5" cy="15.5" r="0.5" fill="currentColor"/></svg>;
}

function SearchSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}

function ChartSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
}

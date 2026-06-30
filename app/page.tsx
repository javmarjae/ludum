import { Suspense } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import { Nav, NavLink, NavButton } from '@/components/Nav';
import { ThemeToggle } from '@/components/ThemeToggle';
import { getAuthUser } from '@/lib/supabase/server';
import { BeginnerSection } from '@/components/BeginnerSection';
import { DashboardContent } from './DashboardContent';
import { HomeDashboardSkeleton } from './HomeDashboardSkeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  alternates: { canonical: 'https://ludumgames.es' },
};

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

  const covers = featuredGames;

  /* ──────────────────────────────────────────────────── */

  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebSite',
        name: 'Ludum',
        url: 'https://ludumgames.es',
        description: 'Recomendador y tracker de juegos de mesa con más de 138.000 títulos.',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://ludumgames.es/buscar?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
      },
      {
        '@type': 'Organization',
        name: 'Ludum',
        url: 'https://ludumgames.es',
        logo: 'https://ludumgames.es/logo.svg',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
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
            mobileItems={[
              { href: '/buscar',        label: 'Buscar' },
              { href: '/recomendador',  label: 'Recomendador' },
              { href: '/auth/login',    label: 'Entrar', variant: 'brand' },
            ]}
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
                  aria-label={g.name}
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

          <BeginnerSection games={beginnerGames} isLanding />

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
            <Suspense fallback={<HomeDashboardSkeleton />}>
              <DashboardContent userId={user.id} beginnerGames={beginnerGames} />
            </Suspense>
          </div>
        </div>
      )}
    </>
  );
}

/* ── SVG Icons ──────────────────────────────────────── */

function ProfileSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}

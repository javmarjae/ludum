import Link from 'next/link';
import { Nav, NavLink, NavButton } from '@/components/Nav';
import { RecommenderFeatureCard } from '@/components/FeatureCard';
import { createClient } from '@/lib/supabase/server';

export default async function Home() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user ?? null;
  const displayName = user?.user_metadata?.display_name ?? user?.email?.split('@')[0] ?? null;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav
        right={
          user ? (
            <>
              <NavLink href="/buscar">Buscar</NavLink>
              <NavLink href="/recomendador">Recomendador</NavLink>
              <NavLink href="/grupos">Mis grupos</NavLink>
              <NavButton href="/perfil" variant="brand">Perfil</NavButton>
            </>
          ) : (
            <>
              <NavLink href="/buscar">Buscar</NavLink>
              <NavLink href="/recomendador">Recomendador</NavLink>
              <NavButton href="/auth/login" variant="brand">Entrar</NavButton>
            </>
          )
        }
      />

      <main style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px' }}>

        {/* Hero */}
        <section style={{ padding: '80px 0 64px', textAlign: 'center' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', borderRadius: 8, background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', marginBottom: 32 }}>
            <span style={{ width: 8, height: 8, borderRadius: '50%', background: 'var(--brand)', flexShrink: 0, boxShadow: '0 0 8px var(--brand)' }} />
            <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>+138.000 juegos de mesa</span>
          </div>

          <h1 style={{ fontSize: 'clamp(40px, 6vw, 72px)', fontWeight: 800, letterSpacing: '-0.03em', lineHeight: 1.08, color: 'var(--text)', marginBottom: 20, maxWidth: 800, margin: '0 auto 20px' }}>
            {user ? (
              <>
                <span style={{ color: 'var(--brand)' }}>Bienvenido a Ludum,</span><br />
                {displayName}
              </>
            ) : (
              <>
                Tu próximo juego favorito<br />
                <span style={{ color: 'var(--brand)' }}>te espera</span>
              </>
            )}
          </h1>

          <p style={{ fontSize: 18, fontWeight: 500, color: 'var(--text-3)', maxWidth: 480, margin: '0 auto 36px', lineHeight: 1.6 }}>
            {user
              ? 'Explora recomendaciones, gestiona tus grupos y registra tus partidas.'
              : 'Responde unas preguntas y te recomendamos los mejores juegos según tus preferencias.'}
          </p>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 12, flexWrap: 'wrap' }}>
            <Link href="/recomendador" style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              padding: '14px 28px', borderRadius: 999, fontWeight: 700, fontSize: 16,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              textDecoration: 'none',
            }}>
              {user ? 'Buscar juegos →' : 'Empezar cuestionario →'}
            </Link>
            {user ? (
              <Link href="/grupos" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 999, fontWeight: 700, fontSize: 16,
                color: 'var(--text)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)',
                textDecoration: 'none',
              }}>
                Mis grupos
              </Link>
            ) : (
              <Link href="/auth/signup" style={{
                display: 'inline-flex', alignItems: 'center', gap: 8,
                padding: '14px 28px', borderRadius: 999, fontWeight: 700, fontSize: 16,
                color: 'var(--text)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)',
                textDecoration: 'none',
              }}>
                Crear cuenta gratis
              </Link>
            )}
          </div>
          {!user && (
            <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginTop: 12 }}>
              Gratis · Sin registro · Resultados al instante
            </p>
          )}
        </section>

        {/* Feature cards */}
        <section style={{ paddingBottom: 80 }}>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: 20, alignItems: 'stretch' }}>
            <RecommenderFeatureCard />

            <div style={{ background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderRadius: 32, padding: 32, opacity: 0.55 }}>
              <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, marginBottom: 24 }}>
                📊
              </div>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
                <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text-3)', letterSpacing: '-0.01em' }}>Tracker</h2>
                <span style={{ fontSize: 11, fontWeight: 700, padding: '4px 10px', borderRadius: 999, background: 'var(--bg-inset)', color: 'var(--text-4)' }}>
                  Próximamente
                </span>
              </div>
              <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-4)', lineHeight: 1.6 }}>
                Registra partidas y sigue las estadísticas de tu grupo: ranking, juego más jugado, win rate por jugador.
              </p>
            </div>
          </div>
        </section>

        {/* Stats bar */}
        <section style={{ borderTop: '1px solid var(--border)', padding: '32px 0' }}>
          <div style={{ display: 'flex', justifyContent: 'center', gap: 64, flexWrap: 'wrap' }}>
            {[{ value: '138k+', label: 'juegos en catálogo' }, { value: '100%', label: 'gratis' }, { value: 'BGG', label: 'datos verificados' }].map((s) => (
              <div key={s.label} style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</div>
                <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</div>
              </div>
            ))}
          </div>
          <p style={{ textAlign: 'center', fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 20 }}>
            Datos de{' '}
            <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--brand)', textDecoration: 'none', fontWeight: 700 }}>
              BoardGameGeek
            </a>
          </p>
        </section>
      </main>
    </div>
  );
}

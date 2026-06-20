import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { logout } from '@/app/auth/actions';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mi perfil — Ludum' };

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/perfil');

  const [
    { data: profile },
    { data: groups },
    { data: recentPlays },
  ] = await Promise.all([
    supabase.from('profiles').select('display_name').eq('id', user.id).single(),
    supabase
      .from('group_members')
      .select('group_id, groups(id, name, owner_id)')
      .eq('profile_id', user.id),
    supabase
      .from('plays')
      .select('id, played_at, group_id, games(name, image_url), groups(name), play_results!inner(profile_id, is_winner)')
      .eq('play_results.profile_id', user.id)
      .order('played_at', { ascending: false })
      .limit(10),
  ]);

  const displayName = profile?.display_name ?? user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Usuario';

  const myPlays = recentPlays ?? [];
  const totalPlays = myPlays.length;
  const totalWins = myPlays.filter((p: any) =>
    p.play_results?.some((r: any) => r.is_winner)
  ).length;

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav
        back={{ href: '/', label: 'Inicio' }}
        right={
          <form action={logout}>
            <button type="submit" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Cerrar sesión
            </button>
          </form>
        }
      />

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Profile header */}
        <div style={{ borderRadius: 32, padding: 28, marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', gap: 20 }}>
          <div style={{
            width: 64, height: 64, borderRadius: '50%', flexShrink: 0,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 26, fontWeight: 800, color: 'white',
            background: 'linear-gradient(135deg, #89BA86, #3E5E3B)',
            boxShadow: '0 4px 16px rgba(62,94,59,0.25)',
          }}>
            {displayName[0].toUpperCase()}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 4 }}>{displayName}</h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>{user.email}</p>
          </div>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12, marginBottom: 20 }}>
          {[
            { value: groups?.length ?? 0, label: 'grupos' },
            { value: totalPlays, label: 'partidas' },
            { value: totalWins, label: 'victorias' },
          ].map((s) => (
            <div key={s.label} style={{ borderRadius: 24, padding: '18px 12px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em' }}>{s.value}</p>
              <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{s.label}</p>
            </div>
          ))}
        </div>

        {/* Groups */}
        <section style={{ marginBottom: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>Mis grupos</h2>
            <Link href="/grupos" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Ver todos →</Link>
          </div>
          {!groups || groups.length === 0 ? (
            <div style={{ borderRadius: 24, padding: 32, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🎲</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin grupos todavía</p>
              <Link href="/grupos" style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Crear o unirse a un grupo →</Link>
            </div>
          ) : (
            <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              {(groups as any[]).slice(0, 5).map((m, i) => {
                const g = m.groups;
                if (!g) return null;
                const isOwner = g.owner_id === user.id;
                return (
                  <Link
                    key={g.id}
                    href={`/grupos/${g.id}`}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      padding: '14px 16px', textDecoration: 'none',
                      borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                    }}
                  >
                    <div style={{
                      width: 36, height: 36, borderRadius: 12, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 18, background: 'var(--bg-inset)',
                    }}>
                      🎲
                    </div>
                    <span style={{ flex: 1, fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{g.name}</span>
                    {isOwner && (
                      <span style={{ fontSize: 11, fontWeight: 600, padding: '3px 8px', borderRadius: 999, background: 'var(--brand-tint)', color: 'var(--brand)' }}>Admin</span>
                    )}
                    <span style={{ color: 'var(--text-4)', fontSize: 16 }}>›</span>
                  </Link>
                );
              })}
            </div>
          )}
        </section>

        {/* Recent activity */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Actividad reciente</h2>
          {myPlays.length === 0 ? (
            <div style={{ borderRadius: 24, padding: 32, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>📊</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin partidas todavía</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Registra tu primera partida en un grupo.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {myPlays.slice(0, 8).map((play: any) => {
                const isWinner = play.play_results?.some((r: any) => r.is_winner);
                return (
                  <div key={play.id} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                    {play.games?.image_url
                      ? <img src={play.games.image_url} alt={play.games.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {play.games?.name ?? 'Juego desconocido'}
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                        {play.groups?.name} · {new Date(play.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      </p>
                    </div>
                    {isWinner && (
                      <span style={{ fontSize: 18, flexShrink: 0 }} title="Ganaste">🏆</span>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </section>

      </main>
    </div>
  );
}

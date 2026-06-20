import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { Nav } from '@/components/Nav';
import { logout } from '@/app/auth/actions';

interface Props { params: Promise<{ id: string }>; }

export default async function GrupoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: group } = await supabase.from('groups').select('id, name, invite_code, owner_id').eq('id', id).single();
  if (!group) notFound();

  const { data: membership } = await supabase.from('group_members').select('group_id').eq('group_id', id).eq('profile_id', user.id).single();
  if (!membership) redirect('/grupos');

  const [{ data: members }, { data: recentPlays }, { data: collection }] = await Promise.all([
    supabase.from('group_members').select('profile_id, profiles(display_name)').eq('group_id', id),
    supabase.from('plays').select('id, played_at, games(name, image_url), play_results(is_winner, profiles(display_name), guest_name)').eq('group_id', id).order('played_at', { ascending: false }).limit(5),
    supabase.from('group_games').select('game_id').eq('group_id', id),
  ]);

  const isOwner = group.owner_id === user.id;
  const collectionCount = collection?.length ?? 0;

  const quickActions = [
    { href: `/grupos/${id}/partidas/nueva`, icon: '🎮', label: 'Nueva partida', accent: true },
    { href: `/grupos/${id}/coleccion`, icon: '📦', label: 'Colección', sub: `${collectionCount} juegos`, accent: false },
    { href: `/grupos/${id}/stats`, icon: '📊', label: 'Estadísticas', accent: false },
  ];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <Nav
        back={{ href: '/grupos', label: 'Mis grupos' }}
        right={
          <form action={logout}>
            <button type="submit" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
              Salir
            </button>
          </form>
        }
      />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ borderRadius: 32, padding: 24, marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
            <div>
              <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 10 }}>{group.name}</h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Código:</span>
                <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 14, padding: '4px 10px', borderRadius: 8, letterSpacing: '0.15em', background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(92,140,42,0.2)' }}>
                  {group.invite_code}
                </span>
              </div>
            </div>
            {isOwner && (
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 999, fontWeight: 700, background: 'var(--brand-tint)', color: 'var(--brand)' }}>Admin</span>
            )}
          </div>
        </div>

        {/* Quick actions */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href} style={{
              borderRadius: 24, padding: '18px 12px', textAlign: 'center', textDecoration: 'none',
              background: action.accent ? 'linear-gradient(135deg, #89BA86, #3E5E3B)' : 'var(--bg-card)',
              boxShadow: action.accent ? 'var(--shadow-btn-brand)' : 'var(--shadow-card)',
              transition: 'transform 0.15s',
            }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1.04)'; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.transform = 'scale(1)'; }}
            >
              <div style={{ fontSize: 24, marginBottom: 4 }}>{action.icon}</div>
              <div style={{ fontSize: 12, fontWeight: 700, color: action.accent ? 'white' : 'var(--text)' }}>{action.label}</div>
              {action.sub && <div style={{ fontSize: 11, fontWeight: 500, marginTop: 2, color: action.accent ? 'rgba(255,255,255,0.7)' : 'var(--text-4)' }}>{action.sub}</div>}
            </Link>
          ))}
        </div>

        {/* Recent plays */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Partidas recientes</h2>
          {!recentPlays || recentPlays.length === 0 ? (
            <div style={{ borderRadius: 24, padding: 32, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 28, marginBottom: 8 }}>🎲</p>
              <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin partidas todavía</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Registrad vuestra primera partida.</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {(recentPlays as any[]).map((play) => {
                const winner = play.play_results?.find((r: any) => r.is_winner);
                const winnerName = winner?.profiles?.display_name ?? winner?.guest_name ?? null;
                return (
                  <div key={play.id} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 20, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                    {play.games?.image_url
                      ? <img src={play.games.image_url} alt={play.games.name} style={{ width: 40, height: 40, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                    }
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{play.games?.name ?? 'Juego desconocido'}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                        {new Date(play.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                        {winnerName && <span> · 🏆 {winnerName}</span>}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </section>

        {/* Members */}
        <section>
          <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Miembros ({members?.length ?? 0})</h2>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            {(members as any[])?.map((m, i) => (
              <div key={m.profile_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #89BA86, #3E5E3B)', boxShadow: '0 2px 8px rgba(62,94,59,0.2)', flexShrink: 0 }}>
                  {(m.profiles?.display_name ?? '?')[0].toUpperCase()}
                </div>
                <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)' }}>{m.profiles?.display_name ?? 'Usuario'}</span>
                {m.profile_id === group.owner_id && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginLeft: 'auto' }}>Admin</span>}
              </div>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Nav, NavButton } from '@/components/Nav';
import { logout } from '@/app/auth/actions';

export default async function GruposPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase.from('profiles').select('display_name').eq('id', user.id).single();
  const { data: memberships } = await supabase.from('group_members').select('group_id, groups(id, name, invite_code, owner_id)').eq('profile_id', user.id);
  const groups = memberships?.map((m) => m.groups).filter(Boolean) ?? [];
  const displayName = profile?.display_name ?? user.email?.split('@')[0] ?? 'Usuario';

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav
        right={
          <>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>{displayName}</span>
            <form action={logout}>
              <button type="submit" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
                Salir
              </button>
            </form>
          </>
        }
      />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 32 }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Mis grupos</h1>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
              {groups.length === 0 ? 'Sin grupos todavía' : `${groups.length} grupo${groups.length > 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <NavButton href="/grupos/unirse" variant="ghost">Unirse</NavButton>
            <NavButton href="/grupos/nuevo" variant="brand">+ Crear</NavButton>
          </div>
        </div>

        {groups.length === 0 ? (
          <div style={{ borderRadius: 32, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 40, marginBottom: 16 }}>👥</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Sin grupos todavía</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>Crea un grupo o únete con un código de invitación.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
              <Link href="/grupos/unirse" style={{
                display: 'inline-flex', padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)', color: 'var(--text-2)', textDecoration: 'none',
              }}>
                Tengo un código
              </Link>
              <Link href="/grupos/nuevo" style={{
                display: 'inline-flex', padding: '10px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', color: 'white', textDecoration: 'none',
              }}>
                Crear grupo
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {(groups as any[]).map((group) => (
              <Link key={group.id} href={`/grupos/${group.id}`} style={{ textDecoration: 'none' }}>
                <div style={{
                  borderRadius: 24, padding: '18px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', transition: 'transform 0.15s',
                }}
                  onMouseEnter={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1.01)'; }}
                  onMouseLeave={(e) => { (e.currentTarget as HTMLDivElement).style.transform = 'scale(1)'; }}
                >
                  <div>
                    <h3 style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>{group.name}</h3>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                      Código:{' '}
                      <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)' }}>{group.invite_code}</span>
                      {group.owner_id === user.id && (
                        <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, fontSize: 11, fontWeight: 700, background: 'var(--brand-tint)', color: 'var(--brand)' }}>Admin</span>
                      )}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-4)', fontSize: 18 }}>→</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}

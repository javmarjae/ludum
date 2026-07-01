import { Suspense } from 'react';
import { createClient, getAuthUser } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminUserCard } from './AdminUserCard';
import OrgRequestsSection from './OrgRequestsSection';
import VerificationRequestsSection from './VerificationRequestsSection';

export const metadata = { title: 'Admin — Ludum' };

function RequestsSkeleton() {
  return (
    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', padding: '16px 0' }}>
      Cargando…
    </p>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  // Reuses cached auth from layout — no extra network call
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');

  const supabase = await createClient();
  const { data: selfProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!selfProfile?.is_admin) redirect('/');

  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const admin = createAdminClient();

  const [
    { data: authData },
    { count: totalUsers },
    { count: adminCount },
    { count: blogCount },
    { count: eventsCount },
    { count: pendingOrgs },
    { count: pendingVerifs },
  ] = await Promise.all([
    admin.auth.admin.listUsers({ page: 1, perPage: 200 }),
    admin.from('profiles').select('*', { count: 'exact', head: true }),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('is_admin', true),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('can_write_blog', true),
    admin.from('profiles').select('*', { count: 'exact', head: true }).eq('can_create_events', true),
    admin.from('organization_requests').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
    admin.from('verification_requests').select('*', { count: 'exact', head: true }).eq('status', 'pendiente'),
  ]);

  const authUsers = authData?.users ?? [];
  const emailMap: Record<string, string> = Object.fromEntries(authUsers.map(u => [u.id, u.email ?? '']));

  let userIds: string[];
  if (query) {
    const ql = query.toLowerCase();
    const emailHits = authUsers.filter(u => u.email?.toLowerCase().includes(ql)).map(u => u.id);
    const { data: nameHits } = await admin
      .from('profiles')
      .select('id')
      .ilike('display_name', `%${query}%`)
      .limit(50);
    userIds = [...new Set([...emailHits, ...(nameHits ?? []).map(p => p.id)])].slice(0, 30);
  } else {
    userIds = [...authUsers]
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 30)
      .map(u => u.id);
  }

  const safeIds = userIds.length ? userIds : ['00000000-0000-0000-0000-000000000000'];
  const { data: profiles } = await admin
    .from('profiles')
    .select('id, display_name, avatar_url, is_admin, can_write_blog, can_create_events')
    .in('id', safeIds);

  const users = (profiles ?? []).map(p => ({
    ...p,
    email: emailMap[p.id] ?? '',
  }));

  const stats = [
    { label: 'Usuarios',          value: totalUsers ?? authUsers.length, icon: '👥' },
    { label: 'Admins',            value: adminCount ?? 0,                icon: '🔑' },
    { label: 'Blog',              value: blogCount ?? 0,                 icon: '✍️' },
    { label: 'Orgs pendientes',   value: pendingOrgs ?? 0,               icon: '🏢', alert: (pendingOrgs ?? 0) > 0 },
    { label: 'Verificaciones',    value: pendingVerifs ?? 0,             icon: '✅', alert: (pendingVerifs ?? 0) > 0 },
  ];

  const hasPending = (pendingOrgs ?? 0) > 0 || (pendingVerifs ?? 0) > 0;

  return (
    <div className="admin-page" style={{ maxWidth: 1320, margin: '0 auto', padding: '40px 28px 80px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
          Panel de administración
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14 }}>
          Gestiona usuarios, permisos y solicitudes de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div className="admin-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, minmax(0, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)',
            border: `1px solid ${(s as any).alert ? 'rgba(220,38,38,0.35)' : 'var(--border)'}`,
            borderRadius: 12,
            padding: '16px 20px',
            display: 'flex',
            alignItems: 'center',
            gap: 14,
          }}>
            <span style={{ fontSize: 22, lineHeight: 1, flexShrink: 0 }}>{s.icon}</span>
            <div>
              <div style={{ fontSize: 22, fontWeight: 800, color: (s as any).alert ? '#dc2626' : 'var(--brand)', lineHeight: 1 }}>{s.value}</div>
              <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginTop: 3 }}>{s.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Main two-column layout: users + sidebar when there are pending items */}
      <div className="admin-main-grid" style={{ display: 'grid', gridTemplateColumns: hasPending ? 'minmax(0, 1fr) 360px' : '1fr', gap: 28, alignItems: 'start' }}>

        {/* Left — users */}
        <div>
          <h2 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.01em', marginBottom: 16 }}>
            Usuarios
            <span style={{ marginLeft: 8, fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>
              {query ? `resultados de "${query}"` : 'más recientes'}
            </span>
          </h2>

          {/* Search */}
          <form method="GET" style={{ marginBottom: 16 }}>
            <input
              name="q"
              defaultValue={query}
              placeholder="Buscar por nombre o email…"
              autoComplete="off"
              style={{
                width: '100%', padding: '10px 16px', fontSize: 14,
                borderRadius: 10, border: '1px solid var(--border)',
                background: 'var(--bg-card)', color: 'var(--text)', outline: 'none',
              }}
            />
          </form>

          {/* Column headers */}
          <div className="admin-col-headers" style={{ display: 'flex', paddingRight: 18, paddingLeft: 70, marginBottom: 6 }}>
            <div style={{ flex: 1 }} />
            <div style={{ display: 'flex', gap: 16 }}>
              {['BLOG', 'EVENTOS', 'ADMIN'].map(h => (
                <span key={h} style={{ width: 40, textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.06em' }}>
                  {h}
                </span>
              ))}
            </div>
          </div>

          {/* User list */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {users.length === 0 ? (
              <p style={{ textAlign: 'center', color: 'var(--text-4)', padding: '48px 0', fontSize: 14 }}>
                {query ? `Sin resultados para "${query}"` : 'No hay usuarios'}
              </p>
            ) : (
              users.map((u, i) => (
                <AdminUserCard key={u.id} user={u} currentUserId={user.id} index={i} />
              ))
            )}
          </div>
        </div>

        {/* Right sidebar — requests (only when pending) */}
        {hasPending && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {(pendingOrgs ?? 0) > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Organizaciones
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#dc2626', borderRadius: 20, padding: '2px 8px' }}>
                    {pendingOrgs}
                  </span>
                </h2>
                <Suspense fallback={<RequestsSkeleton />}>
                  <OrgRequestsSection />
                </Suspense>
              </div>
            )}

            {(pendingVerifs ?? 0) > 0 && (
              <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 8 }}>
                  Verificaciones
                  <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: '#dc2626', borderRadius: 20, padding: '2px 8px' }}>
                    {pendingVerifs}
                  </span>
                </h2>
                <Suspense fallback={<RequestsSkeleton />}>
                  <VerificationRequestsSection />
                </Suspense>
              </div>
            )}
          </div>
        )}
      </div>

      {/* When nothing is pending, show requests below users in 2 columns */}
      {!hasPending && (
        <div className="admin-requests-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, marginTop: 28 }}>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
              Solicitudes de organizaciones
            </h2>
            <Suspense fallback={<RequestsSkeleton />}>
              <OrgRequestsSection />
            </Suspense>
          </div>
          <div style={{ background: 'var(--bg-card)', border: '1px solid var(--border)', borderRadius: 14, padding: '20px 22px' }}>
            <h2 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
              Solicitudes de verificación
            </h2>
            <Suspense fallback={<RequestsSkeleton />}>
              <VerificationRequestsSection />
            </Suspense>
          </div>
        </div>
      )}
    </div>
  );
}

import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { AdminUserCard } from './AdminUserCard';
import OrgRequestsSection from './OrgRequestsSection';
import VerificationRequestsSection from './VerificationRequestsSection';

export const metadata = { title: 'Admin — Ludum' };

function RequestsSkeleton() {
  return (
    <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', padding: '20px 0' }}>
      Cargando…
    </p>
  );
}

export default async function AdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: selfProfile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!selfProfile?.is_admin) redirect('/');

  const { q } = await searchParams;
  const query = q?.trim() ?? '';

  const admin = createAdminClient();

  // Fetch auth users (capped at 200) + count-only queries in parallel.
  // Org/verif full data is deferred to Suspense sections below.
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

  // Determine which user IDs to show
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

  // Sentinel UUID so .in() never returns all rows when list is empty
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
    { label: 'Usuarios totales', value: totalUsers ?? authUsers.length },
    { label: 'Admins',           value: adminCount ?? 0 },
    { label: 'Blog',             value: blogCount ?? 0 },
    { label: 'Orgs pendientes',  value: pendingOrgs ?? 0,   alert: (pendingOrgs ?? 0) > 0 },
    { label: 'Verificaciones',   value: pendingVerifs ?? 0, alert: (pendingVerifs ?? 0) > 0 },
  ];

  return (
    <div style={{ maxWidth: 860, margin: '0 auto', padding: '40px 20px 80px' }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
          Panel de administración
        </h1>
        <p style={{ color: 'var(--text-3)', fontSize: 14, margin: 0 }}>
          Gestiona usuarios y permisos de la plataforma
        </p>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 12, marginBottom: 32 }}>
        {stats.map(s => (
          <div key={s.label} style={{
            background: 'var(--bg-card)', border: `1px solid ${(s as any).alert ? 'rgba(220,38,38,0.3)' : 'var(--border)'}`,
            borderRadius: 12, padding: '14px 16px',
          }}>
            <div style={{ fontSize: 24, fontWeight: 800, color: (s as any).alert ? '#dc2626' : 'var(--brand)', lineHeight: 1 }}>{s.value}</div>
            <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginTop: 4 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Org requests — streamed independently */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          Solicitudes de organizaciones
          {(pendingOrgs ?? 0) > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white', background: '#dc2626', borderRadius: 20, padding: '2px 8px' }}>
              {pendingOrgs}
            </span>
          )}
        </h2>
        <Suspense fallback={<RequestsSkeleton />}>
          <OrgRequestsSection />
        </Suspense>
      </div>

      {/* Verification requests — streamed independently */}
      <div style={{ marginBottom: 36 }}>
        <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
          Solicitudes de verificación
          {(pendingVerifs ?? 0) > 0 && (
            <span style={{ fontSize: 12, fontWeight: 700, color: 'white', background: '#dc2626', borderRadius: 20, padding: '2px 8px' }}>
              {pendingVerifs}
            </span>
          )}
        </h2>
        <Suspense fallback={<RequestsSkeleton />}>
          <VerificationRequestsSection />
        </Suspense>
      </div>

      {/* Search */}
      <form method="GET" style={{ marginBottom: 20 }}>
        <input
          name="q"
          defaultValue={query}
          placeholder="Buscar por nombre o email..."
          autoComplete="off"
          style={{
            width: '100%', padding: '10px 16px', fontSize: 14, boxSizing: 'border-box',
            borderRadius: 10, border: '1px solid var(--border)',
            background: 'var(--bg-card)', color: 'var(--text)', outline: 'none',
          }}
        />
      </form>

      {/* Column headers */}
      <div style={{
        display: 'flex', justifyContent: 'flex-end', paddingRight: 18,
        gap: 16, marginBottom: 8,
      }}>
        {['BLOG', 'EVENTOS', 'ADMIN'].map(h => (
          <span key={h} style={{ width: 40, textAlign: 'center', fontSize: 9, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
            {h}
          </span>
        ))}
      </div>

      {/* Users */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {users.length === 0 ? (
          <p style={{ textAlign: 'center', color: 'var(--text-4)', padding: '40px 0' }}>
            {query ? `Sin resultados para "${query}"` : 'No hay usuarios'}
          </p>
        ) : (
          users.map(u => (
            <AdminUserCard key={u.id} user={u} currentUserId={user.id} />
          ))
        )}
      </div>
    </div>
  );
}

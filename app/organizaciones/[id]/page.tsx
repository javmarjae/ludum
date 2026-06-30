import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { ManageStaff } from './ManageStaff';
import { EditOrgForm } from './EditOrgForm';

interface Props { params: Promise<{ id: string }> }

const STATUS_COLOR: Record<string, string> = {
  en_curso: '#16a34a', inscripciones: '#2563eb', finalizado: '#6b7280', borrador: '#9ca3af',
};
const STATUS_LABEL: Record<string, string> = {
  en_curso: 'En curso', inscripciones: 'Inscripciones', finalizado: 'Finalizado', borrador: 'Próximamente',
};

export default async function OrgPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: org }, { data: tournaments }, { data: membersRaw }, { data: selfProfile }] = await Promise.all([
    supabase.from('organizations').select('*').eq('id', id).single(),
    supabase
      .from('tournaments')
      .select('id, name, format, status, start_date, location, games(name, image_url), tournament_participants(count)')
      .eq('organization_id', id)
      .eq('is_public', true)
      .neq('status', 'cancelado')
      .order('created_at', { ascending: false }),
    supabase
      .from('organization_members')
      .select('profile_id, role, profiles(display_name, avatar_url)')
      .eq('organization_id', id),
    user
      ? supabase.from('profiles').select('is_admin').eq('id', user.id).single()
      : Promise.resolve({ data: null }),
  ]);

  if (!org) notFound();

  const isLudumAdmin = (selfProfile as any)?.is_admin ?? false;
  const isAdmin = user?.id === org.owner_id || isLudumAdmin;
  const isStaff = isAdmin || (membersRaw ?? []).some((m: any) => m.profile_id === user?.id);

  const members = (membersRaw ?? []) as {
    profile_id: string;
    role: string;
    profiles: { display_name: string | null; avatar_url: string | null } | null;
  }[];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/grupos', label: 'Grupos' }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* ── Header ─────────────────────────────────── */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, marginBottom: 36, flexWrap: 'wrap' }}>
          {org.logo_url
            ? <img src={org.logo_url} alt={org.name} style={{ width: 80, height: 80, borderRadius: 20, objectFit: 'cover', flexShrink: 0, boxShadow: 'var(--shadow-card)' }} />
            : <div style={{ width: 80, height: 80, borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40, flexShrink: 0 }}>
                {org.type === 'tienda' ? '🏪' : '🎲'}
              </div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6, flexWrap: 'wrap' }}>
              <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)' }}>{org.name}</h1>
              {org.verified && (
                <span style={{ fontSize: 11, fontWeight: 700, color: '#2563eb', background: '#dbeafe', padding: '3px 10px', borderRadius: 20 }}>✓ Verificado</span>
              )}
              {isAdmin && (
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '3px 10px', borderRadius: 20 }}>Admin</span>
              )}
            </div>
            <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>
              {org.type === 'tienda' ? '🏪 Tienda' : '🎲 Asociación'}
              {org.location && (
                org.maps_url
                  ? <> · <a href={org.maps_url} target="_blank" rel="noopener noreferrer" style={{ color: 'inherit', textDecoration: 'underline' }}>📍 {org.location}</a></>
                  : ` · 📍 ${org.location}`
              )}
            </p>
            {org.description && (
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6 }}>{org.description}</p>
            )}
            {org.website && (
              <a href={org.website} target="_blank" rel="noopener noreferrer" style={{ display: 'inline-block', marginTop: 8, fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
                🌐 {org.website.replace(/^https?:\/\//, '')}
              </a>
            )}
          </div>
        </div>

        {/* ── Acciones rápidas (staff) ────────────────── */}
        {isStaff && (
          <div style={{ display: 'flex', gap: 10, marginBottom: 40, flexWrap: 'wrap' }}>
            <Link
              href={`/organizaciones/${id}/catalogo`}
              style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: 'var(--bg-card)', color: 'var(--text-2)', textDecoration: 'none', boxShadow: 'var(--shadow-card)' }}
            >
              📦 Catálogo
            </Link>
            {isStaff && (
              <Link
                href="/torneos/nuevo"
                style={{ padding: '9px 20px', borderRadius: 10, fontWeight: 700, fontSize: 14, background: 'var(--brand)', color: 'white', textDecoration: 'none', boxShadow: 'var(--shadow-btn-brand)' }}
              >
                + Nuevo torneo
              </Link>
            )}
          </div>
        )}

        <div
          className={isAdmin ? 'org-admin-cols' : undefined}
          style={{ display: 'grid', gridTemplateColumns: isAdmin ? undefined : '1fr', gap: isAdmin ? undefined : 40, alignItems: 'start' }}
        >

          {/* ── Torneos ──────────────────────────────── */}
          <section>
            <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
              Torneos <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-4)' }}>({tournaments?.length ?? 0})</span>
            </h2>

            {!tournaments || tournaments.length === 0 ? (
              <div style={{ borderRadius: 20, padding: '36px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <p style={{ fontSize: 32, marginBottom: 10 }}>🏆</p>
                <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin torneos todavía</p>
                {isAdmin && (
                  <Link href="/torneos/nuevo" style={{ display: 'inline-block', marginTop: 12, padding: '10px 22px', borderRadius: 10, background: 'var(--brand)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 14 }}>
                    Crear primer torneo
                  </Link>
                )}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {(tournaments as any[]).map(t => {
                  const game = t.games;
                  const count = t.tournament_participants?.[0]?.count ?? 0;
                  return (
                    <Link key={t.id} href={`/torneos/${t.id}`} style={{ textDecoration: 'none' }}>
                      <div className="hover-ghost" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 18px', borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                        {game?.image_url
                          ? <img src={game.image_url} alt={game.name} loading="lazy" decoding="async" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                          : <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, flexShrink: 0 }}>🏆</div>
                        }
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{t.name}</p>
                          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                            {game?.name}
                            {t.start_date && ` · ${new Date(t.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' })}`}
                            {count > 0 && ` · ${count} jugadores`}
                          </p>
                        </div>
                        <span style={{ fontSize: 11, fontWeight: 700, color: STATUS_COLOR[t.status] ?? '#9ca3af', flexShrink: 0 }}>
                          ● {STATUS_LABEL[t.status] ?? t.status}
                        </span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </section>

          {/* ── Equipo + Edición ─────────────────────── */}
          {isAdmin && (
            <section>
              <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>
                Equipo
              </h2>

              {/* Admin */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 12, background: 'var(--brand-tint)', marginBottom: 10 }}>
                <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, color: 'white', fontWeight: 800, flexShrink: 0 }}>
                  A
                </div>
                <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Administrador</span>
                <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'white', padding: '2px 8px', borderRadius: 20 }}>Admin</span>
              </div>

              <ManageStaff orgId={id} members={members} isAdmin={isAdmin} />

              <div style={{ marginTop: 20 }}>
                <EditOrgForm
                  orgId={id}
                  initialDescription={org.description ?? ''}
                  initialLocation={org.location ?? ''}
                  initialMapsUrl={(org as any).maps_url ?? ''}
                  initialLogo={org.logo_url ?? null}
                  orgType={org.type}
                />
              </div>
            </section>
          )}

        </div>
      </main>
    </div>
  );
}

import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

const CATEGORY_ICONS: Record<string, string> = {
  'Estrategia': '♟️',
  'Temático':   '🗺️',
  'Guerra':     '⚔️',
  'Familiar':   '👨‍👩‍👧',
  'Cartas':     '🃏',
  'Abstracto':  '🔷',
  'Fiesta':     '🎉',
  'Infantil':   '🧸',
};

export async function GruposContent({ userId }: { userId: string }) {
  const supabase = await createClient();

  const [
    { data: memberships },
    { data: communities },
    { data: myMemberships },
    { data: allOrgsRaw },
    { data: myOrgMemberships },
  ] = await Promise.all([
    supabase
      .from('group_members')
      .select('group_id, groups(id, name, invite_code, owner_id, image_url)')
      .eq('profile_id', userId),
    supabase
      .from('communities')
      .select('id, name, slug, description, is_official, image_url, categories(name)')
      .order('is_official', { ascending: false })
      .order('created_at', { ascending: true }),
    supabase
      .from('community_members')
      .select('community_id')
      .eq('profile_id', userId),
    supabase
      .from('organizations')
      .select('id, name, type, location, logo_url, owner_id')
      .order('name', { ascending: true }),
    supabase
      .from('organization_members')
      .select('organization_id')
      .eq('profile_id', userId),
  ]);

  const groups = (memberships ?? []).map((m) => m.groups).filter(Boolean) as any[];

  const ownedOrgIds = new Set((allOrgsRaw ?? []).filter(o => o.owner_id === userId).map(o => o.id));
  const staffOrgIds = new Set((myOrgMemberships ?? []).map((m: any) => m.organization_id));
  const allOrgs = allOrgsRaw ?? [];

  const communityIds = (communities ?? []).map(c => c.id);
  let memberCounts: Record<string, number> = {};
  if (communityIds.length > 0) {
    const { data: counts } = await supabase
      .from('community_members')
      .select('community_id')
      .in('community_id', communityIds);
    (counts ?? []).forEach(row => {
      memberCounts[row.community_id] = (memberCounts[row.community_id] ?? 0) + 1;
    });
  }

  const myIds = new Set((myMemberships ?? []).map(m => m.community_id));
  const official = (communities ?? []).filter(c => c.is_official);
  const userCreated = (communities ?? []).filter(c => !c.is_official);

  return (
    <>
      {/* ── Mis Grupos ─────────────────────────────── */}
      <section style={{ marginBottom: 56 }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Mis Grupos
            </h1>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
              {groups.length === 0
                ? 'Sin grupos todavía'
                : `${groups.length} grupo${groups.length !== 1 ? 's' : ''}`}
            </p>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <Link
              href="/grupos/unirse"
              style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'var(--text-2)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', textDecoration: 'none' }}
            >
              Unirse
            </Link>
            <Link
              href="/grupos/nuevo"
              style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}
            >
              + Crear
            </Link>
          </div>
        </div>

        {groups.length === 0 ? (
          <div style={{ borderRadius: 20, padding: '36px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>👥</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Sin grupos todavía</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 20 }}>
              Crea un grupo con tus amigos o únete con un código de invitación.
            </p>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'center' }}>
              <Link href="/grupos/unirse" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)', color: 'var(--text-2)', textDecoration: 'none' }}>
                Tengo un código
              </Link>
              <Link href="/grupos/nuevo" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', color: 'white', textDecoration: 'none' }}>
                Crear grupo
              </Link>
            </div>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {groups.map((group, i) => (
              <Link key={group.id} href={`/grupos/${group.id}`} className="stagger-in" style={{ ['--stagger-i' as any]: i, textDecoration: 'none' }}>
                <div className="hover-ghost" style={{
                  borderRadius: 16, padding: '14px 20px',
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14, minWidth: 0 }}>
                    {group.image_url ? (
                      <img src={group.image_url} alt={group.name} loading="lazy" decoding="async" style={{ width: 48, height: 48, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 48, height: 48, borderRadius: 12, flexShrink: 0, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>🎲</div>
                    )}
                    <div style={{ minWidth: 0 }}>
                      <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', marginBottom: 3, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{group.name}</p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                        Código:{' '}
                        <span style={{ fontWeight: 700, fontFamily: 'monospace', color: 'var(--brand)' }}>{group.invite_code}</span>
                        {group.owner_id === userId && (
                          <span style={{ marginLeft: 8, padding: '2px 6px', borderRadius: 6, fontSize: 10, fontWeight: 700, background: 'var(--brand-tint)', color: 'var(--brand)' }}>
                            Admin
                          </span>
                        )}
                      </p>
                    </div>
                  </div>
                  <span style={{ color: 'var(--text-4)', fontSize: 20, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* ── Comunidades ────────────────────────────── */}
      <section style={{ paddingTop: 40, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Comunidades
            </h2>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
              Únete según tu género favorito o crea la tuya.
            </p>
          </div>
          <Link
            href="/comunidades/nueva"
            style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none', flexShrink: 0 }}
          >
            + Nueva
          </Link>
        </div>

        {official.length > 0 && (
          <div style={{ marginBottom: 36 }}>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 14 }}>
              Oficiales · Por categoría
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {official.map((c, i) => (
                <CommunityCard
                  key={c.id}
                  index={i}
                  community={c}
                  memberCount={memberCounts[c.id] ?? 0}
                  isMember={myIds.has(c.id)}
                  icon={CATEGORY_ICONS[(c.categories as any)?.name ?? ''] ?? '🎲'}
                />
              ))}
            </div>
          </div>
        )}

        {userCreated.length > 0 && (
          <div>
            <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-4)', marginBottom: 14 }}>
              Creadas por usuarios
            </p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(240px, 1fr))', gap: 12 }}>
              {userCreated.map((c, i) => (
                <CommunityCard
                  key={c.id}
                  index={i}
                  community={c}
                  memberCount={memberCounts[c.id] ?? 0}
                  isMember={myIds.has(c.id)}
                  icon={CATEGORY_ICONS[(c.categories as any)?.name ?? ''] ?? '🧩'}
                />
              ))}
            </div>
          </div>
        )}

        {(communities ?? []).length === 0 && (
          <div style={{ borderRadius: 20, padding: '36px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>💬</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Sin comunidades todavía</p>
            <Link href="/comunidades/nueva" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', color: 'white', textDecoration: 'none', display: 'inline-block' }}>
              Crear comunidad
            </Link>
          </div>
        )}
      </section>

      {/* ── Organizaciones ─────────────────────────── */}
      <section style={{ marginTop: 52, paddingTop: 40, borderTop: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <div>
            <h2 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 4 }}>
              Organizaciones
            </h2>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
              Tiendas y asociaciones que organizan torneos.
            </p>
          </div>
          <Link
            href="/organizaciones/nueva"
            style={{ padding: '9px 18px', borderRadius: 10, fontWeight: 700, fontSize: 13, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none', flexShrink: 0 }}
          >
            + Nueva
          </Link>
        </div>

        {allOrgs.length === 0 ? (
          <div style={{ borderRadius: 20, padding: '36px 24px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 36, marginBottom: 12 }}>🏪</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Sin organizaciones todavía</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 18 }}>
              ¿Tienes una tienda o asociación lúdica? Regístrala para organizar torneos.
            </p>
            <Link href="/organizaciones/nueva" style={{ padding: '9px 20px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', color: 'white', textDecoration: 'none', display: 'inline-block' }}>
              Crear organización
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allOrgs.map((org: any, i: number) => (
              <Link key={org.id} href={`/organizaciones/${org.id}`} className="stagger-in" style={{ ['--stagger-i' as any]: i, textDecoration: 'none' }}>
                <div className="hover-ghost" style={{
                  borderRadius: 16, padding: '14px 20px',
                  display: 'flex', alignItems: 'center', gap: 14,
                  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
                }}>
                  {org.logo_url ? (
                    <img src={org.logo_url} alt={org.name} loading="lazy" decoding="async" style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                  ) : (
                    <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22 }}>
                      {org.type === 'tienda' ? '🏪' : '🎲'}
                    </div>
                  )}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{org.name}</p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>
                      {org.type === 'tienda' ? 'Tienda' : 'Asociación'}
                      {org.location ? ` · ${org.location}` : ''}
                    </p>
                  </div>
                  {ownedOrgIds.has(org.id) && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                      Admin
                    </span>
                  )}
                  {!ownedOrgIds.has(org.id) && staffOrgIds.has(org.id) && (
                    <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-inset)', padding: '2px 8px', borderRadius: 20, flexShrink: 0 }}>
                      Staff
                    </span>
                  )}
                  <span style={{ color: 'var(--text-4)', fontSize: 20, flexShrink: 0 }}>›</span>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function CommunityCard({
  community,
  memberCount,
  isMember,
  icon,
  index,
}: {
  community: any;
  memberCount: number;
  isMember: boolean;
  icon: string;
  index: number;
}) {
  const categoryName = (community.categories as any)?.name ?? null;
  return (
    <Link href={`/comunidades/${community.slug}`} className="stagger-in" style={{ ['--stagger-i' as any]: index, textDecoration: 'none' }}>
      <div
        className="hover-ghost"
        style={{
          borderRadius: 16, padding: '18px 18px 16px',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
          display: 'flex', flexDirection: 'column', gap: 8,
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 42, height: 42, borderRadius: 12, flexShrink: 0,
            background: 'var(--brand-tint)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 20,
          }}>
            {icon}
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontWeight: 800, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              {community.name}
            </p>
            {categoryName && (
              <p style={{ fontSize: 11, fontWeight: 600, color: 'var(--brand)', marginTop: 1 }}>{categoryName}</p>
            )}
          </div>
          {community.is_official && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '2px 7px', borderRadius: 20, flexShrink: 0 }}>
              Oficial
            </span>
          )}
        </div>

        {community.description && (
          <p style={{
            fontSize: 12, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.5,
            display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden',
          } as React.CSSProperties}>
            {community.description}
          </p>
        )}

        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto', paddingTop: 4 }}>
          <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)' }}>
            {memberCount} {memberCount === 1 ? 'miembro' : 'miembros'}
          </span>
          {isMember && (
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '2px 8px', borderRadius: 20 }}>
              Unido
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}

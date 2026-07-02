import Link from 'next/link';
import Image from 'next/image';
import { unstable_cache } from 'next/cache';
import { createClient as createSupabaseClient } from '@supabase/supabase-js';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Organizaciones',
  description: 'Asociaciones y tiendas de juegos de mesa que organizan torneos y eventos en Ludum.',
  alternates: { canonical: 'https://ludumgames.es/organizaciones' },
};

interface Org {
  id: string;
  name: string;
  type: 'asociacion' | 'tienda';
  description: string | null;
  logo_url: string | null;
  location: string | null;
  verified: boolean;
}

/* Lectura pública (RLS org_select = true) — cacheada y compartida entre usuarios */
const getOrganizations = unstable_cache(
  async () => {
    const supabase = createSupabaseClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { data } = await supabase
      .from('organizations')
      .select('id, name, type, description, logo_url, location, verified')
      .order('verified', { ascending: false })
      .order('name', { ascending: true })
      .limit(60);
    return (data ?? []) as Org[];
  },
  ['organizations-list'],
  { revalidate: 1800 }
);

const TYPE_LABEL: Record<Org['type'], string> = {
  asociacion: 'Asociación',
  tienda: 'Tienda',
};

export default async function OrganizacionesPage() {
  const orgs = await getOrganizations();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 960, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>

        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16, flexWrap: 'wrap', marginBottom: 32 }}>
          <div>
            <h1 className="t-page-title" style={{ marginBottom: 6 }}>Organizaciones</h1>
            <p className="t-body" style={{ maxWidth: 480 }}>
              Asociaciones y tiendas que organizan torneos y eventos de juegos de mesa.
            </p>
          </div>
          <Link
            href="/organizaciones/nueva"
            style={{
              padding: '11px 20px', borderRadius: 10, fontSize: 14, fontWeight: 700,
              background: 'var(--brand)', color: 'white', textDecoration: 'none',
              boxShadow: 'var(--shadow-btn-brand)', flexShrink: 0,
            }}
          >
            + Registrar la tuya
          </Link>
        </div>

        {orgs.length === 0 ? (
          <div style={{ borderRadius: 20, padding: '56px 32px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 40, marginBottom: 14 }}>🏛️</p>
            <p className="t-section-title" style={{ marginBottom: 8 }}>Aún no hay organizaciones</p>
            <p className="t-body" style={{ maxWidth: 380, margin: '0 auto' }}>
              ¿Llevas una asociación o tienda de juegos de mesa? Regístrala y organiza torneos y eventos en Ludum.
            </p>
          </div>
        ) : (
          <div className="org-list-grid">
            {orgs.map((org, i) => (
              <Link
                key={org.id}
                href={`/organizaciones/${org.id}`}
                className="hover-lift stagger-in"
                style={{
                  ['--stagger-i' as any]: i,
                  display: 'flex', alignItems: 'center', gap: 16, minWidth: 0,
                  padding: '18px 20px', borderRadius: 16, textDecoration: 'none',
                  background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
                }}
              >
                <div style={{
                  width: 52, height: 52, borderRadius: 12, flexShrink: 0, overflow: 'hidden',
                  background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {org.logo_url ? (
                    <Image src={org.logo_url} alt={org.name} width={52} height={52} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  ) : (
                    <span style={{ fontSize: 22 }}>{org.type === 'tienda' ? '🏪' : '🏛️'}</span>
                  )}
                </div>
                <div style={{ minWidth: 0, flex: 1 }}>
                  <p className="t-card-title" style={{ display: 'flex', alignItems: 'center', gap: 6, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {org.name}
                    {org.verified && (
                      <svg width="15" height="15" viewBox="0 0 24 24" fill="var(--brand)" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }} aria-label="Verificada">
                        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
                        <polyline points="9 12 11 14 15 10" fill="none" />
                      </svg>
                    )}
                  </p>
                  <p className="t-card-sub" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {TYPE_LABEL[org.type]}{org.location ? ` · ${org.location}` : ''}
                  </p>
                </div>
                <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--text-4)', flexShrink: 0 }}>→</span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

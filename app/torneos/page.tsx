import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';

const FORMAT_LABEL: Record<string, string> = {
  libre: 'Libre',
  round_robin: 'Round Robin',
  swiss: 'Sistema Suizo',
  eliminacion: 'Eliminación directa',
};

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  borrador:      { label: 'Próximamente', color: '#aaa' },
  inscripciones: { label: 'Inscripciones', color: '#2563eb' },
  en_curso:      { label: 'En curso', color: '#16a34a' },
  finalizado:    { label: 'Finalizado', color: '#6b7280' },
  cancelado:     { label: 'Cancelado', color: '#dc2626' },
};

export const metadata = { title: 'Torneos' };

export default async function TorneosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tournaments } = await supabase
    .from('tournaments')
    .select(`
      id, name, format, status, start_date, end_date, location, max_participants,
      organizations(id, name, type, logo_url),
      games(name, image_url),
      tournament_participants(count)
    `)
    .eq('is_public', true)
    .neq('status', 'cancelado')
    .order('created_at', { ascending: false })
    .limit(50);

  // Fetch user's organizations to show "crear torneo" button
  const { data: myOrgs } = user
    ? await supabase.from('organizations').select('id').eq('owner_id', user.id).limit(1)
    : { data: null };

  const hasOrg = (myOrgs?.length ?? 0) > 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav />
      <main style={{ maxWidth: 900, margin: '0 auto', padding: '48px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 32, gap: 16, flexWrap: 'wrap' }}>
          <div>
            <h1 style={{ fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Torneos</h1>
            <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)' }}>
              Eventos organizados por asociaciones y tiendas
            </p>
          </div>
          <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
            {user && !hasOrg && (
              <Link href="/organizaciones/nueva" className="btn-outline" style={{ borderRadius: 14, padding: '10px 18px', fontSize: 14, fontWeight: 700, textDecoration: 'none', border: '1.5px solid var(--border)', color: 'var(--text-3)', display: 'inline-block' }}>
                + Mi organización
              </Link>
            )}
            {user && hasOrg && (
              <Link href="/torneos/nuevo" className="btn-hero" style={{ borderRadius: 14, padding: '10px 18px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block' }}>
                + Nuevo torneo
              </Link>
            )}
            {!user && (
              <Link href="/auth/login" style={{ borderRadius: 14, padding: '10px 18px', fontSize: 14, fontWeight: 700, textDecoration: 'none', display: 'inline-block', background: 'var(--brand)', color: 'white' }}>
                Accede para organizar
              </Link>
            )}
          </div>
        </div>

        {/* Tournament grid */}
        {!tournaments || tournaments.length === 0 ? (
          <div style={{ borderRadius: 24, padding: '56px 32px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 40, marginBottom: 12 }}>🏆</p>
            <p style={{ fontWeight: 700, fontSize: 18, color: 'var(--text)', marginBottom: 8 }}>Aún no hay torneos</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
              Las asociaciones y tiendas pueden crear torneos aquí.
            </p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
            {(tournaments as any[]).map(t => {
              const org = t.organizations;
              const game = t.games;
              const participantCount = t.tournament_participants?.[0]?.count ?? 0;
              const st = STATUS_LABEL[t.status] ?? STATUS_LABEL.borrador;

              return (
                <Link key={t.id} href={`/torneos/${t.id}`} style={{ textDecoration: 'none' }}>
                  <div className="hover-scale" style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {/* Game banner */}
                    <div style={{ height: 100, background: game?.image_url ? `url(${game.image_url}) center/cover` : 'var(--bg-inset)', display: 'flex', alignItems: 'flex-end', padding: '0 16px 12px', position: 'relative' }}>
                      {!game?.image_url && (
                        <span style={{ fontSize: 40, position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%,-50%)' }}>🏆</span>
                      )}
                      {/* Status badge */}
                      <span style={{ fontSize: 11, fontWeight: 700, color: 'white', background: st.color, padding: '3px 10px', borderRadius: 20, zIndex: 1, backdropFilter: 'blur(4px)' }}>
                        {st.label}
                      </span>
                    </div>

                    <div style={{ padding: '14px 18px 18px', flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <p style={{ fontWeight: 800, fontSize: 16, color: 'var(--text)', lineHeight: 1.3 }}>{t.name}</p>
                      {game && <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>{game.name}</p>}

                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', background: 'var(--bg-inset)', padding: '3px 10px', borderRadius: 20 }}>
                          {FORMAT_LABEL[t.format] ?? t.format}
                        </span>
                        {participantCount > 0 && (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>
                            {participantCount} {participantCount === 1 ? 'jugador' : 'jugadores'}
                          </span>
                        )}
                      </div>

                      {t.start_date && (
                        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 4 }}>
                          {new Date(t.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                          {t.location && ` · ${t.location}`}
                        </p>
                      )}

                      {/* Org footer */}
                      {org && (
                        <div style={{ marginTop: 'auto', paddingTop: 10, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8 }}>
                          {org.logo_url
                            ? <img src={org.logo_url} alt={org.name} loading="lazy" decoding="async" style={{ width: 24, height: 24, borderRadius: 6, objectFit: 'cover' }} />
                            : <span style={{ fontSize: 16 }}>{org.type === 'tienda' ? '🏪' : '🎲'}</span>
                          }
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)' }}>{org.name}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}

        {/* CTA for orgs */}
        {user && !hasOrg && (
          <div style={{ marginTop: 40, borderRadius: 24, padding: '32px 28px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
            <p style={{ fontSize: 28, marginBottom: 10 }}>🏪</p>
            <p style={{ fontWeight: 700, fontSize: 17, color: 'var(--text)', marginBottom: 6 }}>¿Tienes una asociación o tienda?</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 20 }}>
              Registra tu organización y empieza a organizar torneos gratis.
            </p>
            <Link href="/organizaciones/nueva" style={{ display: 'inline-block', background: 'var(--brand)', color: 'white', padding: '12px 28px', borderRadius: 16, fontWeight: 700, fontSize: 15, textDecoration: 'none' }}>
              Crear organización
            </Link>
          </div>
        )}
      </main>
    </div>
  );
}

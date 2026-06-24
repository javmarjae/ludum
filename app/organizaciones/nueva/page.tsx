import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/AppNav';
import { submitOrgRequest } from '../actions';
import OrgRequestForm from './OrgRequestForm';

export const metadata = { title: 'Solicitar organización' };

export default async function NuevaOrganizacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  // Check if user already has a pending request
  const { data: existing } = await supabase
    .from('organization_requests')
    .select('id, name, status, created_at')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(1)
    .single();

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/grupos', label: 'Grupos' }} />

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
            Solicitar organización
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)' }}>
            Las organizaciones pasan por un proceso de verificación. Revisaremos tu solicitud y te notificaremos cuando sea aprobada.
          </p>
        </div>

        {existing && existing.status === 'pendiente' ? (
          <div style={{ borderRadius: 20, padding: '28px 24px', background: 'var(--brand-tint)', border: '1.5px solid rgba(62,94,59,0.2)' }}>
            <p style={{ fontSize: 22, marginBottom: 12 }}>⏳</p>
            <p style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>
              Ya tienes una solicitud pendiente
            </p>
            <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', marginBottom: 4 }}>
              {existing.name}
            </p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
              Enviada el {new Date(existing.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
            </p>
          </div>
        ) : existing && existing.status === 'rechazada' ? (
          <>
            <div style={{ borderRadius: 16, padding: '16px 20px', background: 'rgba(220,38,38,0.07)', border: '1.5px solid rgba(220,38,38,0.15)', marginBottom: 24 }}>
              <p style={{ fontSize: 14, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>
                Tu solicitud anterior para "{existing.name}" fue rechazada.
              </p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                Puedes enviar una nueva solicitud con la información corregida.
              </p>
            </div>
            <OrgRequestForm action={submitOrgRequest} />
          </>
        ) : (
          <OrgRequestForm action={submitOrgRequest} />
        )}
      </main>
    </div>
  );
}


import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { TorneoForm } from './TorneoForm';

export const metadata = { title: 'Nuevo torneo' };

export default async function NuevoTorneoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: orgs } = await supabase
    .from('organizations')
    .select('id, name, type')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (!orgs || orgs.length === 0) {
    return (
      <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
        <AppNav back={{ href: '/torneos', label: 'Torneos' }} />
        <main style={{ maxWidth: 520, margin: '0 auto', padding: '80px 24px', textAlign: 'center' }}>
          <p style={{ fontSize: 48, marginBottom: 16 }}>🏪</p>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 10 }}>
            Primero crea tu organización
          </h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28, lineHeight: 1.6 }}>
            Para organizar torneos necesitas registrar tu asociación o tienda.
          </p>
          <Link href="/organizaciones/nueva" style={{ display: 'inline-block', background: 'var(--brand)', color: 'white', padding: '13px 28px', borderRadius: 16, fontWeight: 700, fontSize: 16, textDecoration: 'none' }}>
            Crear organización
          </Link>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/torneos', label: 'Torneos' }} />
      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 6 }}>Nuevo torneo</h1>
          <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)' }}>
            Organizado por{' '}
            <Link href={`/organizaciones/${orgs[0].id}`} style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
              {orgs[0].name}
            </Link>
          </p>
        </div>
        <TorneoForm orgs={orgs} />
      </main>
    </div>
  );
}

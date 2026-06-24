import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { NuevaComunidadForm } from './NuevaComunidadForm';
import Link from 'next/link';

export default async function NuevaComunidadPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: categories } = await supabase
    .from('categories')
    .select('id, name')
    .order('name');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/comunidades" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}>
          ← Comunidades
        </Link>
      </div>

      <main style={{ maxWidth: 540, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6 }}>
          Nueva comunidad
        </h1>
        <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 32 }}>
          Crea una comunidad temática para conectar con otros jugadores.
        </p>

        <NuevaComunidadForm categories={categories ?? []} />
      </main>
    </div>
  );
}

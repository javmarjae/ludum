import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/AppNav';
import { NuevoEventoForm } from './NuevoEventoForm';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Crear evento' };

export default async function NuevoEventoPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/eventos/nuevo');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_event_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_event_creator) redirect('/eventos');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/eventos', label: 'Eventos' }} />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '48px 32px 80px' }}>
        <h1 style={{ margin: '0 0 32px', fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>
          Crear evento
        </h1>
        <NuevoEventoForm />
      </main>
    </div>
  );
}

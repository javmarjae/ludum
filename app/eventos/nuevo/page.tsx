import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { AppNav } from '@/components/AppNav';
import { NuevoEventoForm } from './NuevoEventoForm';
import type { Metadata } from 'next';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

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
      <div style={{ maxWidth: 640, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <h1 style={{ margin: '0 0 32px', fontSize: 24, fontWeight: 800, color: 'var(--text-1)' }}>
          Crear evento
        </h1>
        <NuevoEventoForm />
      </div>
    </div>
  );
}

import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { AppNav } from '@/components/AppNav';
import { NuevoPostForm } from './NuevoPostForm';

export const metadata = { title: 'Nueva entrada | Blog | Ludum' };

export default async function NuevoPostPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  return (
    <>
      <AppNav back={{ href: '/blog', label: 'Blog' }} />
      <main style={{ maxWidth: 760, margin: '0 auto', padding: '40px 24px 80px' }}>
        <div style={{ marginBottom: 32 }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontSize: 30, fontWeight: 800, color: 'var(--text-1)', marginBottom: 6 }}>
            Nueva entrada
          </h1>
          <p style={{ fontSize: 14, color: 'var(--text-4)' }}>
            El contenido se escribe en Markdown. Los posts sin "Publicar ahora" se guardan como borradores.
          </p>
        </div>
        <NuevoPostForm />
      </main>
    </>
  );
}

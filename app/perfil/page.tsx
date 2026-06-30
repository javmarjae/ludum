import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ProfileContent } from './ProfileContent';
import { ProfileSkeleton } from './ProfileSkeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mi perfil' };

export default async function PerfilPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/perfil');

  const { data: profile } = await supabase
    .from('profiles')
    .select('display_name, bio, avatar_url, social_links, is_verified')
    .eq('id', user.id)
    .single();

  const displayName = profile?.display_name ?? user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? 'Usuario';
  const bio = profile?.bio ?? '';
  const avatarUrl = profile?.avatar_url ?? null;
  const socialLinks = profile?.social_links ?? {};
  const isVerified = (profile as any)?.is_verified ?? false;

  return (
    <>
      <style>{`
        .p-wrap  { padding: 0 48px 80px; }
        .p-row   { display: flex; align-items: flex-start; gap: 0; padding-top: 32px; }
        .p-main  { flex: 1; min-width: 0; padding-right: 48px; }
        .p-aside { width: 280px; flex-shrink: 0; border-left: 1px solid var(--border); padding-left: 36px; }
        @media (max-width: 1000px) {
          .p-wrap  { padding: 0 28px 80px; }
          .p-row   { flex-direction: column; padding-top: 24px; }
          .p-main  { padding-right: 0; width: 100%; }
          .p-aside { width: 100%; border-left: none; border-top: 1px solid var(--border);
                     padding-left: 0; padding-top: 28px; margin-top: 36px; }
        }
        @media (max-width: 640px) {
          .p-wrap { padding: 0 16px 80px; }
        }
      `}</style>

      <main className="p-wrap">

        {/* Cabecera */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '24px 0 20px', borderBottom: '1px solid var(--border)' }}>
          <Link
            href="/"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', color: 'var(--text)', textDecoration: 'none', fontSize: 16, flexShrink: 0 }}
          >
            ←
          </Link>
          <h1 className="t-section-title" style={{ letterSpacing: '-0.01em' }}>Tu Perfil</h1>
        </div>

        {/* Fila principal: columna izquierda + columna logros */}
        <div className="p-row">
          <Suspense fallback={<ProfileSkeleton />}>
            <ProfileContent
              userId={user.id}
              isVerified={isVerified}
              displayName={displayName}
              bio={bio}
              avatarUrl={avatarUrl}
              socialLinks={socialLinks}
              email={user.email ?? ''}
              createdAt={user.created_at}
            />
          </Suspense>
        </div>

      </main>
    </>
  );
}

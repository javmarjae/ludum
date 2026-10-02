import { Suspense } from 'react';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { getAuthUserLite, createClient } from '@/lib/supabase/server';
import { Avatar } from '@/components/Avatar';
import { DashboardContent } from '../DashboardContent';
import { HomeDashboardSkeleton } from '../HomeDashboardSkeleton';
import { getBeginnerGames } from '../home-queries';

export const instant = false;

export const metadata: Metadata = {
  robots: { index: false },
  alternates: { canonical: 'https://ludumgames.es' },
};

// Dashboard de la home: proxy.ts reescribe "/" aquí cuando hay sesión, para que la landing pública sea estática.
export default async function HomeDashboard() {
  const user = await getAuthUserLite();
  if (!user) redirect('/');

  const profilePromise = createClient().then(sb => sb.from('profiles').select('display_name, avatar_url').eq('id', user.id).single());
  const todayRaw = new Date().toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' });
  const today = todayRaw.charAt(0).toUpperCase() + todayRaw.slice(1);

  const [beginnerGames, { data: profile }] = await Promise.all([getBeginnerGames(), profilePromise]);
  const displayName = profile?.display_name ?? user.user_metadata?.display_name ?? user.email?.split('@')[0] ?? null;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <div className="home-dash-header">
        <Link href="/perfil" aria-label="Tu perfil" className="home-dash-avatar">
          <Avatar name={displayName ?? '?'} src={profile?.avatar_url} size={44} />
        </Link>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 'clamp(22px, 2.5vw, 32px)', fontWeight: 800, letterSpacing: '-0.025em', color: 'var(--text)', lineHeight: 1.15, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            Hola, {displayName}
          </h1>
          <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>
            {today}
          </p>
        </div>
      </div>

      <div className="home-dash-content">
        <Suspense fallback={<HomeDashboardSkeleton />}>
          <DashboardContent userId={user.id} beginnerGames={beginnerGames} />
        </Suspense>
      </div>
    </div>
  );
}

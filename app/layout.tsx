import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { cache } from 'react';
import { Urbanist, Playfair } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { getAuthUserLite, createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/SidebarNav';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TutorialModal } from '@/components/TutorialModal';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Footer } from '@/components/Footer';
import { BetaBanner } from '@/components/BetaBanner';
import { AuthFlag } from '@/components/AuthFlag';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const playfair = Playfair({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://ludumgames.es'),
  title: {
    default: 'Ludum — Recomendador de Juegos de Mesa',
    template: '%s — Ludum',
  },
  description: 'Descubre tu próximo juego de mesa favorito. Recomendaciones personalizadas y seguimiento de partidas.',
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/icons/icon-192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Ludum',
  },
  openGraph: {
    title: 'Ludum — Recomendador de Juegos de Mesa',
    description: 'Descubre tu próximo juego de mesa favorito. Registra partidas, compara con amigos y encuentra el juego perfecto entre más de 138.000 títulos.',
    type: 'website',
    url: 'https://ludumgames.es',
    locale: 'es_ES',
    siteName: 'Ludum',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ludum — Recomendador de Juegos de Mesa',
    description: 'Descubre tu próximo juego de mesa favorito. Registra partidas, compara con amigos y encuentra el juego perfecto entre más de 138.000 títulos.',
  },
};

export const viewport: Viewport = {
  themeColor: '#3E5E3B',
  width: 'device-width',
  initialScale: 1,
};

// Cached per-request: shared between SidebarWithProfile and MobileNavWithProfile
const getProfile = cache(async (userId: string) => {
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('onboarding_completed, is_admin, display_name, avatar_url')
    .eq('id', userId)
    .single();
  return data;
});

// Async server component: renders sidebar + tutorial once profile loads
async function SidebarWithProfile({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  return (
    <>
      <SidebarNav
        isAdmin={profile?.is_admin ?? false}
        userId={userId}
        profileName={profile?.display_name ?? null}
        avatarUrl={profile?.avatar_url ?? null}
      />
      {!profile?.onboarding_completed && <TutorialModal />}
    </>
  );
}

// Async server component: renders mobile nav once profile loads (reuses same query via cache)
async function MobileNavWithProfile({ userId }: { userId: string }) {
  const supabase = await createClient();
  const [profile, { data: memberships }] = await Promise.all([
    getProfile(userId),
    supabase.from('group_members').select('group_id').eq('profile_id', userId).limit(2),
  ]);
  // Con un solo grupo, "Registrar" salta directo al formulario; si no, hay que elegir grupo
  const registerHref = memberships?.length === 1
    ? `/grupos/${memberships[0].group_id}/partidas/nueva`
    : '/grupos';
  return <MobileBottomNav isAdmin={profile?.is_admin ?? false} registerHref={registerHref} />;
}

async function AuthSidebar() {
  const user = await getAuthUserLite();
  if (!user) return <AuthFlag authed={false} />;
  return (
    <>
      <AuthFlag authed />
      <Suspense fallback={<SidebarNav isAdmin={false} userId={user.id} />}>
        <SidebarWithProfile userId={user.id} />
      </Suspense>
    </>
  );
}

async function AuthMobileNav() {
  const user = await getAuthUserLite();
  if (!user) return null;
  return (
    <Suspense fallback={<MobileBottomNav isAdmin={false} />}>
      <MobileNavWithProfile userId={user.id} />
    </Suspense>
  );
}

// La sesión se lee dentro de Suspense para que el resto del layout se prerenderice como shell estático.
export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es" suppressHydrationWarning>
      <body className={`${urbanist.variable} ${playfair.variable} ${urbanist.className}`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){var d=document.documentElement;try{var t=localStorage.getItem('ludum-theme');if(t==='dark')d.setAttribute('data-theme','dark');}catch(e){}if(/(?:^|; )sb-[^=]*-auth-token(?:\\.0)?=/.test(document.cookie))d.setAttribute('data-authed','true');})();` }}
        />
        <a href="#contenido" className="skip-link">Saltar al contenido</a>
        <div className="app-shell">
          <Suspense fallback={<div className="app-sidebar-slot" aria-hidden="true" />}>
            <AuthSidebar />
          </Suspense>
          <div className="app-shell-main">
            <main id="contenido" className="app-main">
              {children}
            </main>
            <Footer />
          </div>
        </div>
        <Suspense fallback={null}>
          <AuthMobileNav />
        </Suspense>
        <BetaBanner />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

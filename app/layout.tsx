import type { Metadata, Viewport } from 'next';
import { Suspense } from 'react';
import { cache } from 'react';
import { Urbanist, Playfair } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { getAuthUser, createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/SidebarNav';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TutorialModal } from '@/components/TutorialModal';
import { SpeedInsights } from '@vercel/speed-insights/next';
import { Analytics } from '@vercel/analytics/next';
import { Footer } from '@/components/Footer';
import { BetaBanner } from '@/components/BetaBanner';

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
    icon: '/logo.svg',
    shortcut: '/logo.svg',
    apple: '/icons/icon-192.png',
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
    .select('onboarding_completed, is_admin')
    .eq('id', userId)
    .single();
  return data;
});

// Async server component: renders sidebar + tutorial once profile loads
async function SidebarWithProfile({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  return (
    <>
      <SidebarNav isAdmin={profile?.is_admin ?? false} />
      {!profile?.onboarding_completed && <TutorialModal />}
    </>
  );
}

// Async server component: renders mobile nav once profile loads (reuses same query via cache)
async function MobileNavWithProfile({ userId }: { userId: string }) {
  const profile = await getProfile(userId);
  return <MobileBottomNav isAdmin={profile?.is_admin ?? false} />;
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Only 1 blocking call: auth. Profile query runs non-blocking in Suspense.
  const user = await getAuthUser();

  return (
    <html lang="es" suppressHydrationWarning data-authed={user ? 'true' : undefined}>
      <body className={`${urbanist.variable} ${playfair.variable} ${urbanist.className}`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ludum-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }}
        />
        <div className="app-shell">
          {user && (
            <Suspense fallback={<SidebarNav isAdmin={false} />}>
              <SidebarWithProfile userId={user.id} />
            </Suspense>
          )}
          <div className="app-shell-main">
            {children}
            <Footer />
          </div>
        </div>
        {user && (
          <Suspense fallback={<MobileBottomNav isAdmin={false} />}>
            <MobileNavWithProfile userId={user.id} />
          </Suspense>
        )}
        <BetaBanner />
        <SpeedInsights />
        <Analytics />
      </body>
    </html>
  );
}

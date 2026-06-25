import type { Metadata, Viewport } from 'next';
import { Urbanist, Playfair } from 'next/font/google';
import Script from 'next/script';
import './globals.css';
import { getAuthUser, createClient } from '@/lib/supabase/server';
import { SidebarNav } from '@/components/SidebarNav';
import { MobileBottomNav } from '@/components/MobileBottomNav';
import { TutorialModal } from '@/components/TutorialModal';
import { SpeedInsights } from '@vercel/speed-insights/next';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const playfair = Playfair({ subsets: ['latin'], weight: ['700', '800'], variable: '--font-display' });

export const metadata: Metadata = {
  metadataBase: new URL('https://ludum.es'),
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
    description: 'Descubre tu próximo juego de mesa favorito.',
    type: 'website',
    locale: 'es_ES',
    siteName: 'Ludum',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Ludum — Recomendador de Juegos de Mesa',
    description: 'Descubre tu próximo juego de mesa favorito.',
  },
};

export const viewport: Viewport = {
  themeColor: '#3E5E3B',
  width: 'device-width',
  initialScale: 1,
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const user = await getAuthUser();

  let showTutorial = false;
  let isAdmin = false;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from('profiles')
      .select('onboarding_completed, is_admin')
      .eq('id', user.id)
      .single();
    showTutorial = !profile?.onboarding_completed;
    isAdmin = profile?.is_admin ?? false;
  }

  return (
    <html lang="es" suppressHydrationWarning data-authed={user ? 'true' : undefined}>
      <body className={`${urbanist.variable} ${playfair.variable} ${urbanist.className}`}>
        <Script
          id="theme-init"
          strategy="beforeInteractive"
          dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem('ludum-theme');if(t==='dark')document.documentElement.setAttribute('data-theme','dark');}catch(e){}})();` }}
        />
        <div className="app-shell">
          {user && <SidebarNav isAdmin={isAdmin} />}
          <div className="app-shell-main">
            {children}
          </div>
        </div>
        {user && <MobileBottomNav isAdmin={isAdmin} />}
        {showTutorial && <TutorialModal />}
        <SpeedInsights />
      </body>
    </html>
  );
}

import type { Metadata } from 'next';
import { Urbanist, Playfair } from 'next/font/google';
import './globals.css';

const urbanist = Urbanist({ subsets: ['latin'], weight: ['400', '500', '600', '700'], variable: '--font-sans' });
const playfair = Playfair({ subsets: ['latin'], variable: '--font-display' });

export const metadata: Metadata = {
  title: 'Ludum — Recomendador de Juegos de Mesa',
  description: 'Descubre tu próximo juego de mesa favorito. Recomendaciones personalizadas y seguimiento de partidas.',
  icons: { icon: '/logo.svg', shortcut: '/logo.svg' },
  openGraph: {
    title: 'Ludum — Recomendador de Juegos de Mesa',
    description: 'Descubre tu próximo juego de mesa favorito.',
    type: 'website',
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="es">
      <body className={`${urbanist.variable} ${playfair.variable} ${urbanist.className}`}>{children}</body>
    </html>
  );
}

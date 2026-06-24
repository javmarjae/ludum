import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Ludum — Juegos de Mesa',
    short_name: 'Ludum',
    description: 'Recomendador y tracker de juegos de mesa',
    start_url: '/',
    display: 'standalone',
    background_color: '#F5F0E8',
    theme_color: '#3E5E3B',
    orientation: 'portrait',
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any maskable' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
    ],
  };
}

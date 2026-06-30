/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },
  images: {
    formats: ['image/avif', 'image/webp'],
    // Las portadas de BGG son inmutables y las subidas a Supabase Storage cambian
    // raramente → cacheamos la versión optimizada 31 días. Reduce drásticamente
    // las re-optimizaciones bajo carga (cada optimización es CPU + ancho de banda).
    minimumCacheTTL: 2678400,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
      },
      {
        // Avatares, logos de grupos/orgs, portadas de eventos/comunidades/blog
        protocol: 'https',
        hostname: 'xymugovvmeexsbjragxi.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;

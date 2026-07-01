import type { MetadataRoute } from 'next';
import { unstable_cache } from 'next/cache';
import { supabase } from '@/lib/supabase';
import { getBlogPosts } from '@/lib/blog';

const BASE = 'https://ludumgames.es';

/* games es una tabla pública sin RLS → se cachea entre requests para que el
   sitemap responda desde caché en vez de repetir la query en cada rastreo
   de Googlebot (revalidate coincide con la sincronización diaria de BGG). */
const getRankedGames = unstable_cache(
  async () => {
    const { data } = await supabase
      .from('games')
      .select('bgg_id, name')
      .not('bgg_rank', 'is', null)
      .order('bgg_rank', { ascending: true })
      .limit(5000);
    return data ?? [];
  },
  ['sitemap-ranked-games'],
  { revalidate: 3600 }
);

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const games = await getRankedGames();
  const blogPosts = await getBlogPosts();

  const staticRoutes: MetadataRoute.Sitemap = [
    { url: BASE, lastModified: new Date(), changeFrequency: 'daily', priority: 1 },
    { url: `${BASE}/buscar`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.8 },
    { url: `${BASE}/recomendador`, lastModified: new Date(), changeFrequency: 'monthly', priority: 0.8 },
    { url: `${BASE}/blog`, lastModified: new Date(), changeFrequency: 'weekly', priority: 0.7 },
  ];

  const gameRoutes: MetadataRoute.Sitemap = (games ?? []).map((g) => ({
    url: `${BASE}/juegos/${g.bgg_id}`,
    changeFrequency: 'monthly',
    priority: 0.6,
  }));

  const blogRoutes: MetadataRoute.Sitemap = blogPosts.map((p) => ({
    url: `${BASE}/blog/${p.slug}`,
    lastModified: new Date(p.published_at),
    changeFrequency: 'monthly',
    priority: 0.7,
  }));

  return [...staticRoutes, ...gameRoutes, ...blogRoutes];
}

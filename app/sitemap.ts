import type { MetadataRoute } from 'next';
import { createClient } from '@/lib/supabase/server';
import { getBlogPosts } from '@/lib/blog';

const BASE = 'https://ludum.es';

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = await createClient();

  const { data: games } = await supabase
    .from('games')
    .select('bgg_id, name')
    .not('bgg_rank', 'is', null)
    .order('bgg_rank', { ascending: true })
    .limit(5000);

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

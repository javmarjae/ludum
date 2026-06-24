import { supabase } from '@/lib/supabase';

export interface BlogPost {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  content: string;
  cover_image: string | null;
  author_name: string;
  published_at: string;
  is_sponsored: boolean;
  sponsor_name: string | null;
  sponsor_logo: string | null;
  sponsor_url: string | null;
  tags: string[];
  seo_title: string | null;
  seo_description: string | null;
  view_count: number;
}

export async function getBlogPosts(): Promise<BlogPost[]> {
  const db = supabase;
  const { data, error } = await db
    .from('blog_posts')
    .select('id, slug, title, excerpt, cover_image, author_name, published_at, is_sponsored, sponsor_name, sponsor_logo, tags, view_count')
    .eq('is_published', true)
    .order('published_at', { ascending: false });

  if (error) return [];
  return data ?? [];
}

export async function getBlogPost(slug: string): Promise<BlogPost | null> {
  const db = supabase;
  const { data, error } = await db
    .from('blog_posts')
    .select('*')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  if (error || !data) return null;
  return data;
}

export async function getBlogSlugs(): Promise<string[]> {
  const db = supabase;
  const { data } = await db
    .from('blog_posts')
    .select('slug')
    .eq('is_published', true);

  return (data ?? []).map((p) => p.slug);
}

export function formatBlogDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('es-ES', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

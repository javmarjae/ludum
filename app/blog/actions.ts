'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export async function createBlogPost(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const title = (formData.get('title') as string)?.trim();
  const slugRaw = (formData.get('slug') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();

  if (!title || !content) return { error: 'El título y el contenido son obligatorios.' };

  const slug = slugRaw ? slugify(slugRaw) : slugify(title);
  const excerpt = (formData.get('excerpt') as string)?.trim() || null;
  const coverImage = (formData.get('cover_image') as string)?.trim() || null;
  const tagsRaw = (formData.get('tags') as string)?.trim();
  const tags = tagsRaw ? tagsRaw.split(',').map(t => t.trim()).filter(Boolean) : [];
  const isPublished = formData.get('is_published') === 'on';
  const publishedAt = isPublished
    ? ((formData.get('published_at') as string) || new Date().toISOString())
    : null;
  const isSponsored = formData.get('is_sponsored') === 'on';
  const sponsorName = (formData.get('sponsor_name') as string)?.trim() || null;
  const sponsorLogo = (formData.get('sponsor_logo') as string)?.trim() || null;
  const sponsorUrl = (formData.get('sponsor_url') as string)?.trim() || null;
  const seoTitle = (formData.get('seo_title') as string)?.trim() || null;
  const seoDescription = (formData.get('seo_description') as string)?.trim() || null;
  const authorName = (formData.get('author_name') as string)?.trim() || 'Equipo Ludum';

  const admin = createServiceRoleClient();
  const { data, error } = await admin
    .from('blog_posts')
    .insert({
      slug,
      title,
      excerpt,
      content,
      cover_image: coverImage,
      author_name: authorName,
      published_at: publishedAt,
      is_published: isPublished,
      is_sponsored: isSponsored,
      sponsor_name: sponsorName,
      sponsor_logo: sponsorLogo,
      sponsor_url: sponsorUrl,
      tags,
      seo_title: seoTitle,
      seo_description: seoDescription,
    })
    .select('slug')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe un artículo con ese slug. Cambia el slug e inténtalo de nuevo.' };
    return { error: `Error al guardar: ${error.message}` };
  }

  revalidatePath('/blog');
  redirect(`/blog/${data.slug}`);
}

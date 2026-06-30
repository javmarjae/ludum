'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function toSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[áàä]/g, 'a').replace(/[éèë]/g, 'e')
    .replace(/[íìï]/g, 'i').replace(/[óòö]/g, 'o')
    .replace(/[úùü]/g, 'u').replace(/ñ/g, 'n')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export async function joinCommunity(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase
    .from('community_members')
    .insert({ community_id: communityId, profile_id: user.id });

  if (error && error.code !== '23505') return { error: error.message };

  revalidatePath('/comunidades');
  return { ok: true };
}

export async function leaveCommunity(communityId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await supabase
    .from('community_members')
    .delete()
    .eq('community_id', communityId)
    .eq('profile_id', user.id);

  revalidatePath('/comunidades');
  return { ok: true };
}

export async function createCommunity(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const name = (formData.get('name') as string)?.trim();
  const description = (formData.get('description') as string)?.trim() || null;
  const category_id = (formData.get('category_id') as string) || null;

  if (!name) return { error: 'El nombre es obligatorio.' };

  const slug = toSlug(name);

  const { data: community, error } = await supabase
    .from('communities')
    .insert({ name, description, slug, category_id, created_by: user.id, is_official: false })
    .select('id, slug')
    .single();

  if (error) {
    if (error.code === '23505') return { error: 'Ya existe una comunidad con ese nombre o slug.' };
    return { error: error.message };
  }

  await supabase
    .from('community_members')
    .insert({ community_id: community.id, profile_id: user.id });

  revalidatePath('/comunidades');
  return { slug: community.slug };
}

export async function createPost(communityId: string, communitySlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const title = (formData.get('title') as string)?.trim();
  const content = (formData.get('content') as string)?.trim();

  if (!title || !content) return { error: 'El título y el contenido son obligatorios.' };

  const { data: post, error } = await supabase
    .from('community_posts')
    .insert({ community_id: communityId, author_id: user.id, title, content })
    .select('id')
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/comunidades/${communitySlug}`);
  return { postId: post.id };
}

export async function createComment(postId: string, communitySlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const content = (formData.get('content') as string)?.trim();
  if (!content) return { error: 'El comentario no puede estar vacío.' };

  const { error } = await supabase
    .from('community_comments')
    .insert({ post_id: postId, author_id: user.id, content });

  if (error) return { error: error.message };

  revalidatePath(`/comunidades/${communitySlug}/posts/${postId}`);
  return { ok: true };
}

export async function deletePost(postId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await supabase
    .from('community_posts')
    .delete()
    .eq('id', postId)
    .eq('author_id', user.id);

  revalidatePath(`/comunidades/${communitySlug}`);
  redirect(`/comunidades/${communitySlug}`);
}

export async function deleteComment(commentId: string, postId: string, communitySlug: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await supabase
    .from('community_comments')
    .delete()
    .eq('id', commentId)
    .eq('author_id', user.id);

  revalidatePath(`/comunidades/${communitySlug}/posts/${postId}`);
  return { ok: true };
}

export async function updateCommunity(
  communityId: string,
  communitySlug: string,
  data: { description?: string; location?: string; maps_url?: string }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: community } = await supabase
    .from('communities')
    .select('created_by')
    .eq('id', communityId)
    .single();

  if (!community || community.created_by !== user.id) return { error: 'Sin permiso' };

  const { error } = await supabase.from('communities').update(data).eq('id', communityId);
  if (error) return { error: error.message };

  revalidatePath(`/comunidades/${communitySlug}`);
  return { ok: true };
}

export async function uploadCommunityImage(communityId: string, communitySlug: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: community } = await supabase
    .from('communities')
    .select('created_by')
    .eq('id', communityId)
    .single();

  if (!community || community.created_by !== user.id) return { error: 'Sin permiso' };

  const file = formData.get('image') as File;
  if (!file || file.size === 0) return { error: 'Sin archivo' };

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${communityId}/cover.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('community-images')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('community-images').getPublicUrl(path);
  const imageUrl = `${publicUrl}?v=${Date.now()}`;

  await supabase.from('communities').update({ image_url: imageUrl }).eq('id', communityId);
  revalidatePath(`/comunidades/${communitySlug}`);
  revalidatePath('/comunidades'); // el listado también muestra la imagen
  return { url: imageUrl };
}

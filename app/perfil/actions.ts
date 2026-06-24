'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function followUser(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };
  if (user.id === profileId) return { error: 'No puedes seguirte a ti mismo' };
  await supabase.from('follows').insert({ follower_id: user.id, following_id: profileId });
  revalidatePath(`/perfil/${profileId}`);
  return { ok: true };
}

export async function unfollowUser(profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };
  await supabase.from('follows').delete().eq('follower_id', user.id).eq('following_id', profileId);
  revalidatePath(`/perfil/${profileId}`);
  return { ok: true };
}

export async function addGameToUserCollection(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  // Upsert so that moving from wishlist → collection works
  await supabase.from('user_games').upsert(
    { profile_id: user.id, game_id: gameId, in_wishlist: false },
    { onConflict: 'profile_id,game_id' }
  );
  revalidatePath('/perfil');
}

export async function removeGameFromUserCollection(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_games').delete()
    .eq('profile_id', user.id)
    .eq('game_id', gameId)
    .eq('in_wishlist', false);
  revalidatePath('/perfil');
}

export async function addToWishlist(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_games').insert({ profile_id: user.id, game_id: gameId, in_wishlist: true });
  revalidatePath('/perfil');
}

export async function removeFromWishlist(gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('user_games').delete()
    .eq('profile_id', user.id)
    .eq('game_id', gameId)
    .eq('in_wishlist', true);
  revalidatePath('/perfil');
}

export async function rateGame(gameId: string, rating: number | null) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  if (rating === null) {
    await supabase.from('user_games').update({ rating: null }).eq('profile_id', user.id).eq('game_id', gameId);
  } else {
    await supabase.from('user_games').upsert({ profile_id: user.id, game_id: gameId, rating }, { onConflict: 'profile_id,game_id' });
  }
  revalidatePath('/perfil');
}

export async function updateProfile(data: {
  display_name?: string;
  bio?: string;
  social_links?: Record<string, string>;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };
  const { error } = await supabase.from('profiles').update(data).eq('id', user.id);
  if (error) return { error: error.message };
  revalidatePath('/perfil');
  return { ok: true };
}

export async function completeOnboarding() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;
  await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', user.id);
}

export async function requestVerification(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const reason = (formData.get('reason') as string)?.trim();
  const category = (formData.get('category') as string) ?? 'otro';
  const socialLinks: Record<string, string> = {};
  for (const key of ['instagram', 'twitter', 'youtube', 'website', 'bgg']) {
    const val = (formData.get(key) as string)?.trim();
    if (val) socialLinks[key] = val;
  }

  if (!reason || reason.length < 20) {
    return { error: 'Explica tu motivo con al menos 20 caracteres.' };
  }

  // Check if already verified
  const { data: profile } = await supabase
    .from('profiles')
    .select('is_verified')
    .eq('id', user.id)
    .single();

  if (profile?.is_verified) return { error: 'Tu perfil ya está verificado.' };

  // Upsert: insert or update if previous request exists (allows resubmit after rejection)
  const { error } = await supabase
    .from('verification_requests')
    .upsert(
      { user_id: user.id, reason, category, social_links: socialLinks, status: 'pendiente', admin_notes: null, reviewed_at: null },
      { onConflict: 'user_id' }
    );

  if (error) return { error: error.message };

  revalidatePath('/perfil');
  return { ok: true };
}

export async function uploadAvatar(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const file = formData.get('avatar') as File;
  if (!file || file.size === 0) return { error: 'Sin archivo' };

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${user.id}/avatar.${ext}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabase.storage
    .from('avatars')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(path);
  const avatarUrl = `${publicUrl}?v=${Date.now()}`;

  await supabase.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
  revalidatePath('/perfil');
  return { url: avatarUrl };
}

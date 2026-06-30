'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function addGameToCollection(groupId: string, gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { error } = await supabase
    .from('group_games')
    .insert({ group_id: groupId, game_id: gameId });

  if (error && error.code !== '23505') return { error: 'Error al añadir el juego.' };

  revalidatePath(`/grupos/${groupId}`);
  return { success: true };
}

export async function removeGameFromCollection(groupId: string, gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await supabase
    .from('group_games')
    .delete()
    .eq('group_id', groupId)
    .eq('game_id', gameId);

  revalidatePath(`/grupos/${groupId}`);
}

export interface PlayResult {
  profile_id: string | null;
  guest_name: string | null;
  score: number | null;
  is_winner: boolean;
}

export async function createPlay(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const groupId = formData.get('group_id') as string;
  const gameId = formData.get('game_id') as string;
  const playedAt = formData.get('played_at') as string;
  const notes = (formData.get('notes') as string) || null;
  const resultsJson = formData.get('results') as string;
  const isPublic = formData.get('is_public') === 'true';
  const durationStr = formData.get('duration_minutes') as string | null;
  const durationMinutes = durationStr ? parseInt(durationStr, 10) || null : null;

  if (!groupId || !gameId || !playedAt) return { error: 'Faltan datos obligatorios.' };

  let results: PlayResult[] = [];
  try {
    results = JSON.parse(resultsJson);
  } catch {
    return { error: 'Error en los datos de jugadores.' };
  }

  const { data: play, error: playError } = await supabase
    .from('plays')
    .insert({ group_id: groupId, game_id: gameId, played_at: playedAt, notes, created_by: user.id, is_public: isPublic, duration_minutes: durationMinutes })
    .select()
    .single();

  if (playError) return { error: 'Error al registrar la partida.' };

  // Guard: una misma persona no puede aparecer dos veces en la misma partida.
  // Deduplicamos por profile_id (los invitados sin profile_id se mantienen).
  const seenProfiles = new Set<string>();
  const dedupedResults = results.filter((r) => {
    if (!r.profile_id) return true;
    if (seenProfiles.has(r.profile_id)) return false;
    seenProfiles.add(r.profile_id);
    return true;
  });

  if (dedupedResults.length > 0) {
    const playResults = dedupedResults.map((r) => ({
      play_id: play.id,
      profile_id: r.profile_id,
      guest_name: r.guest_name,
      score: r.score,
      is_winner: r.is_winner,
    }));

    const { error: resultsError } = await supabase.from('play_results').insert(playResults);
    if (resultsError) return { error: 'Partida creada pero error en resultados.' };
  }

  revalidatePath(`/grupos/${groupId}`);
  redirect(`/grupos/${groupId}`);
}

export async function deletePlay(playId: string, groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: play } = await supabase
    .from('plays').select('created_by, groups(owner_id)')
    .eq('id', playId).eq('group_id', groupId).single();

  if (!play) return { error: 'Partida no encontrada.' };
  const isCreator = play.created_by === user.id;
  const isOwner = (play.groups as any)?.owner_id === user.id;
  if (!isCreator && !isOwner) return { error: 'No tienes permiso para eliminar esta partida.' };

  await supabase.from('play_results').delete().eq('play_id', playId);
  await supabase.from('plays').delete().eq('id', playId);

  revalidatePath(`/grupos/${groupId}`);
  redirect(`/grupos/${groupId}`);
}

export async function updatePlayNotes(playId: string, groupId: string, notes: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: play } = await supabase
    .from('plays').select('created_by, groups(owner_id)')
    .eq('id', playId).eq('group_id', groupId).single();

  if (!play) return { error: 'Partida no encontrada.' };
  const isCreator = play.created_by === user.id;
  const isOwner = (play.groups as any)?.owner_id === user.id;
  if (!isCreator && !isOwner) return { error: 'Sin permiso.' };

  await supabase.from('plays').update({ notes: notes || null }).eq('id', playId);
  revalidatePath(`/grupos/${groupId}/partidas/${playId}`);
  return { success: true };
}

export async function updatePlayVisibility(playId: string, groupId: string, isPublic: boolean) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: play } = await supabase
    .from('plays').select('created_by, groups(owner_id)')
    .eq('id', playId).eq('group_id', groupId).single();

  if (!play) return { error: 'Partida no encontrada.' };
  const isCreator = play.created_by === user.id;
  const isOwner = (play.groups as any)?.owner_id === user.id;
  if (!isCreator && !isOwner) return { error: 'Sin permiso.' };

  await supabase.from('plays').update({ is_public: isPublic }).eq('id', playId);
  revalidatePath(`/grupos/${groupId}/partidas/${playId}`);
  return { success: true };
}

export async function trackGroupVisit(groupId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return;

  await supabase
    .from('group_members')
    .update({ last_visited_at: new Date().toISOString() })
    .eq('group_id', groupId)
    .eq('profile_id', user.id);
}

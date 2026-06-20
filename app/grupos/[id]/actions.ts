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

  if (!groupId || !gameId || !playedAt) return { error: 'Faltan datos obligatorios.' };

  let results: PlayResult[] = [];
  try {
    results = JSON.parse(resultsJson);
  } catch {
    return { error: 'Error en los datos de jugadores.' };
  }

  const { data: play, error: playError } = await supabase
    .from('plays')
    .insert({ group_id: groupId, game_id: gameId, played_at: playedAt, notes, created_by: user.id })
    .select()
    .single();

  if (playError) return { error: 'Error al registrar la partida.' };

  if (results.length > 0) {
    const playResults = results.map((r) => ({
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

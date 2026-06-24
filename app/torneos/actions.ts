'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

export async function createTournament(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const name = (formData.get('name') as string)?.trim();
  const organizationId = formData.get('organization_id') as string;
  const gameId = (formData.get('game_id') as string) || null;
  const format = (formData.get('format') as string) || 'libre';
  const maxParticipants = formData.get('max_participants') ? parseInt(formData.get('max_participants') as string) : null;
  const startDate = (formData.get('start_date') as string) || null;
  const endDate = (formData.get('end_date') as string) || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const description = (formData.get('description') as string)?.trim() || null;
  const prizeInfo = (formData.get('prize_info') as string)?.trim() || null;

  if (!name) return { error: 'El nombre es obligatorio.' };
  if (!organizationId) return { error: 'Selecciona una organización.' };

  const { data: tournament, error } = await supabase
    .from('tournaments')
    .insert({
      name, organization_id: organizationId, game_id: gameId, format,
      max_participants: maxParticipants, start_date: startDate, end_date: endDate,
      location, description, prize_info: prizeInfo,
      created_by: user.id, status: 'borrador', is_public: true,
    })
    .select()
    .single();

  if (error) return { error: `Error: ${error.message}` };

  revalidatePath('/torneos');
  redirect(`/torneos/${tournament.id}/admin`);
}

export async function updateTournamentStatus(tournamentId: string, status: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase
    .from('tournaments')
    .update({ status, updated_at: new Date().toISOString() })
    .eq('id', tournamentId);

  if (error) return { error: error.message };

  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath(`/torneos/${tournamentId}/admin`);
  revalidatePath('/torneos');
  return { ok: true };
}

export async function addParticipant(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const tournamentId = formData.get('tournament_id') as string;
  const profileId = (formData.get('profile_id') as string) || null;
  const guestName = (formData.get('guest_name') as string)?.trim() || null;

  if (!profileId && !guestName) return { error: 'Introduce un nombre.' };

  const { error } = await supabase.from('tournament_participants').insert({
    tournament_id: tournamentId,
    profile_id: profileId,
    guest_name: profileId ? null : guestName,
  });

  if (error) {
    if (error.code === '23505') return { error: 'Este participante ya está inscrito.' };
    return { error: error.message };
  }

  revalidatePath(`/torneos/${tournamentId}/admin`);
  return { ok: true };
}

export async function removeParticipant(participantId: string, tournamentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('tournament_participants').delete().eq('id', participantId);
  if (error) return { error: error.message };

  revalidatePath(`/torneos/${tournamentId}/admin`);
  return { ok: true };
}

export async function createRound(tournamentId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: existing } = await supabase
    .from('tournament_rounds')
    .select('round_number')
    .eq('tournament_id', tournamentId)
    .order('round_number', { ascending: false })
    .limit(1)
    .maybeSingle();

  const nextNumber = (existing?.round_number ?? 0) + 1;

  const { data: round, error } = await supabase
    .from('tournament_rounds')
    .insert({ tournament_id: tournamentId, round_number: nextNumber, name: `Ronda ${nextNumber}`, status: 'en_curso' })
    .select()
    .single();

  if (error) return { error: error.message };

  revalidatePath(`/torneos/${tournamentId}/admin`);
  return { roundId: round.id };
}

export async function addMatch(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const roundId = formData.get('round_id') as string;
  const tournamentId = formData.get('tournament_id') as string;
  const participantIds = formData.getAll('participant_ids') as string[];
  const tableNumber = (formData.get('table_number') as string) ? parseInt(formData.get('table_number') as string) : null;

  if (participantIds.length < 2) return { error: 'Selecciona al menos 2 participantes.' };

  const { data: match, error: matchError } = await supabase
    .from('tournament_matches')
    .insert({ round_id: roundId, table_number: tableNumber, status: 'pendiente' })
    .select()
    .single();

  if (matchError) return { error: matchError.message };

  const resultRows = participantIds.map(pid => ({
    match_id: match.id,
    participant_id: pid,
    is_winner: false,
  }));

  const { error: resultsError } = await supabase.from('match_results').insert(resultRows);
  if (resultsError) return { error: resultsError.message };

  revalidatePath(`/torneos/${tournamentId}/admin`);
  return { matchId: match.id };
}

export async function recordResult(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const matchId = formData.get('match_id') as string;
  const tournamentId = formData.get('tournament_id') as string;
  const winnerId = formData.get('winner_id') as string;
  const participantIds = formData.getAll('participant_ids') as string[];

  // Delete existing results
  await supabase.from('match_results').delete().eq('match_id', matchId);

  // Insert new results
  const results = participantIds.map(pid => {
    const score = (formData.get(`score_${pid}`) as string);
    return {
      match_id: matchId,
      participant_id: pid,
      score: score ? parseFloat(score) : null,
      is_winner: pid === winnerId,
    };
  });

  const { error } = await supabase.from('match_results').insert(results);
  if (error) return { error: error.message };

  await supabase
    .from('tournament_matches')
    .update({ status: 'completada', completed_at: new Date().toISOString() })
    .eq('id', matchId);

  revalidatePath(`/torneos/${tournamentId}`);
  revalidatePath(`/torneos/${tournamentId}/admin`);
  return { ok: true };
}

export async function searchProfiles(query: string) {
  if (!query || query.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('profiles')
    .select('id, display_name, avatar_url')
    .ilike('display_name', `%${query}%`)
    .limit(8);
  return data ?? [];
}

export async function searchGames(query: string) {
  if (!query || query.length < 2) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from('games')
    .select('id, name, image_url, year_published')
    .ilike('name', `%${query}%`)
    .not('bgg_rank', 'is', null)
    .order('bgg_rank', { ascending: true })
    .limit(8);
  return data ?? [];
}

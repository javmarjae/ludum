'use server';

import { createClient } from '@/lib/supabase/server';
import { createServiceRoleClient } from '@/lib/supabase';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

function generateInviteCode(): string {
  return Math.random().toString(36).substring(2, 8).toUpperCase();
}

async function ensureProfile(userId: string, email: string | undefined, displayName: string | undefined) {
  try {
    const admin = createServiceRoleClient();
    await admin.from('profiles').upsert(
      { id: userId, display_name: displayName ?? email?.split('@')[0] ?? null },
      { onConflict: 'id', ignoreDuplicates: true }
    );
  } catch (e) {
    console.error('[ensureProfile] error:', e);
  }
}

export async function createGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await ensureProfile(user.id, user.email, user.user_metadata?.display_name);

  const name = (formData.get('name') as string)?.trim();
  if (!name) return { error: 'El nombre es obligatorio.' };

  const inviteCode = generateInviteCode();

  const { data: group, error } = await supabase
    .from('groups')
    .insert({ name, owner_id: user.id, invite_code: inviteCode })
    .select()
    .single();

  if (error) {
    console.error('[createGroup] Supabase error:', error);
    return { error: `Error al crear el grupo: ${error.message}` };
  }

  // Add creator as member
  await supabase.from('group_members').insert({ group_id: group.id, profile_id: user.id });

  revalidatePath('/grupos');
  return { groupId: group.id };
}

export async function joinGroup(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  await ensureProfile(user.id, user.email, user.user_metadata?.display_name);

  const code = (formData.get('code') as string)?.trim().toUpperCase();
  if (!code) return { error: 'Introduce un código.' };

  const { data: group, error } = await supabase
    .from('groups')
    .select('id, name')
    .eq('invite_code', code)
    .single();

  if (error || !group) return { error: 'Código de invitación no válido.' };

  // Check if already a member
  const { data: existing } = await supabase
    .from('group_members')
    .select('group_id')
    .eq('group_id', group.id)
    .eq('profile_id', user.id)
    .single();

  if (existing) return { groupId: group.id };

  const { error: joinError } = await supabase
    .from('group_members')
    .insert({ group_id: group.id, profile_id: user.id });

  if (joinError) return { error: 'Error al unirse al grupo.' };

  revalidatePath('/grupos');
  return { groupId: group.id };
}

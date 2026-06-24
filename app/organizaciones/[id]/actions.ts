'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function addStaffMember(orgId: string, displayName: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', orgId).single();
  if (!org || org.owner_id !== user.id) return { error: 'Sin permisos' };

  const { data: profile } = await supabase
    .from('profiles')
    .select('id')
    .eq('display_name', displayName)
    .single();

  if (!profile) return { error: `No se encontró el usuario "${displayName}"` };
  if (profile.id === user.id) return { error: 'No puedes añadirte a ti mismo' };

  const { error } = await supabase
    .from('organization_members')
    .upsert({ organization_id: orgId, profile_id: profile.id, role: 'empleado' }, { onConflict: 'organization_id,profile_id' });

  if (error) return { error: error.message };
  revalidatePath(`/organizaciones/${orgId}`);
  return { ok: true };
}

export async function removeStaffMember(orgId: string, profileId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', orgId).single();
  if (!org || org.owner_id !== user.id) return { error: 'Sin permisos' };

  await supabase
    .from('organization_members')
    .delete()
    .eq('organization_id', orgId)
    .eq('profile_id', profileId);

  revalidatePath(`/organizaciones/${orgId}`);
  return { ok: true };
}

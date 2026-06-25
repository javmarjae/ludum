'use server';

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

// ── Helpers ──────────────────────────────────────────────────────────────────

async function getOrgMembership(supabase: Awaited<ReturnType<typeof createClient>>, orgId: string, userId: string) {
  const { data: org } = await supabase.from('organizations').select('owner_id').eq('id', orgId).single();
  if (!org) return null;
  if (org.owner_id === userId) return 'owner';
  const { data: member } = await supabase
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('profile_id', userId)
    .single();
  return member?.role ?? null;
}

// ── Catálogo ──────────────────────────────────────────────────────────────────

export async function addGameToCatalog(orgId: string, gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const role = await getOrgMembership(supabase, orgId, user.id);
  if (!role) return { error: 'Sin permisos' };

  const { error } = await supabase
    .from('organization_catalog')
    .insert({ organization_id: orgId, game_id: gameId, status: 'disponible' });

  if (error) return { error: error.message };
  revalidatePath(`/organizaciones/${orgId}/catalogo`);
  return { ok: true };
}

export async function removeGameFromCatalog(orgId: string, gameId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const role = await getOrgMembership(supabase, orgId, user.id);
  if (!role) return { error: 'Sin permisos' };

  const { error } = await supabase
    .from('organization_catalog')
    .delete()
    .eq('organization_id', orgId)
    .eq('game_id', gameId);

  if (error) return { error: error.message };
  revalidatePath(`/organizaciones/${orgId}/catalogo`);
  return { ok: true };
}

export async function updateCatalogEntry(
  orgId: string,
  gameId: string,
  data: { status: 'disponible' | 'en_venta' | 'en_prestamo'; price?: number | null; notes?: string | null }
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const role = await getOrgMembership(supabase, orgId, user.id);
  if (!role) return { error: 'Sin permisos' };

  const patch: Record<string, unknown> = { status: data.status };
  if (data.status === 'en_venta') {
    patch.price = data.price ?? null;
  } else {
    patch.price = null;
  }
  patch.notes = data.notes ?? null;

  const { error } = await supabase
    .from('organization_catalog')
    .update(patch)
    .eq('organization_id', orgId)
    .eq('game_id', gameId);

  if (error) return { error: error.message };
  revalidatePath(`/organizaciones/${orgId}/catalogo`);
  return { ok: true };
}

export async function submitOrgRequest(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const name = (formData.get('name') as string)?.trim();
  const type = formData.get('type') as string;
  const description = (formData.get('description') as string)?.trim() || null;
  const location = (formData.get('location') as string)?.trim() || null;
  const website = (formData.get('website') as string)?.trim() || null;

  if (!name) return { error: 'El nombre es obligatorio.' };
  if (!location) return { error: 'La ubicación es obligatoria.' };
  if (!['asociacion', 'tienda'].includes(type)) return { error: 'Tipo no válido.' };

  const { error } = await supabase
    .from('organization_requests')
    .insert({ user_id: user.id, name, type, description, location, website });

  if (error) return { error: `Error al enviar: ${error.message}` };

  redirect('/grupos?org_request=sent');
}

export async function updateOrganization(orgId: string, data: {
  name?: string; description?: string; location?: string; maps_url?: string; website?: string;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const { error } = await supabase.from('organizations').update(data).eq('id', orgId);
  if (error) return { error: error.message };

  revalidatePath(`/organizaciones/${orgId}`);
  return { ok: true };
}

export async function uploadOrgLogo(orgId: string, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado' };

  const file = formData.get('logo') as File;
  if (!file || file.size === 0) return { error: 'Sin archivo' };

  const ext = file.name.split('.').pop() ?? 'jpg';
  const path = `${orgId}/logo.${ext}`;
  const arrayBuffer = await file.arrayBuffer();

  const { error: uploadError } = await supabase.storage
    .from('org-logos')
    .upload(path, arrayBuffer, { contentType: file.type, upsert: true });

  if (uploadError) return { error: uploadError.message };

  const { data: { publicUrl } } = supabase.storage.from('org-logos').getPublicUrl(path);
  const logoUrl = `${publicUrl}?v=${Date.now()}`;

  await supabase.from('organizations').update({ logo_url: logoUrl }).eq('id', orgId);
  revalidatePath(`/organizaciones/${orgId}`);
  return { url: logoUrl };
}

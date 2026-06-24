'use server';

import { createClient } from '@/lib/supabase/server';
import { createAdminClient } from '@/lib/supabase/admin';
import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single();

  if (!profile?.is_admin) redirect('/');
  return user;
}

export async function setUserPermission(
  userId: string,
  field: 'can_write_blog' | 'can_create_events' | 'is_admin',
  value: boolean,
) {
  await requireAdmin();
  const admin = createAdminClient();
  const { error } = await admin.from('profiles').update({ [field]: value }).eq('id', userId);
  if (error) throw new Error(error.message);
  revalidatePath('/admin');
}

export async function approveOrgRequest(requestId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from('organization_requests')
    .select('*')
    .eq('id', requestId)
    .single();

  if (!req) return { error: 'Solicitud no encontrada' };

  const { data: org, error } = await admin
    .from('organizations')
    .insert({
      name: req.name,
      type: req.type,
      description: req.description ?? null,
      location: req.location ?? null,
      website: req.website ?? null,
      owner_id: req.user_id,
    })
    .select()
    .single();

  if (error) return { error: error.message };

  await admin
    .from('organization_requests')
    .update({ status: 'aprobada' })
    .eq('id', requestId);

  // Notify the user (best-effort)
  try {
    await admin.from('notifications').insert({
      user_id: req.user_id,
      type: 'org_request_approved',
      reference_id: org.id,
    });
  } catch (_) {}

  revalidatePath('/admin');
  return { ok: true };
}

export async function approveVerification(requestId: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from('verification_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (!req) return { error: 'Solicitud no encontrada' };

  // Mark profile as verified
  await admin.from('profiles').update({ is_verified: true }).eq('id', req.user_id);

  // Update request status
  await admin
    .from('verification_requests')
    .update({ status: 'aprobada', reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  // Notify the user (best-effort)
  try {
    await admin.from('notifications').insert({
      user_id: req.user_id,
      type: 'verification_approved',
      reference_id: req.user_id,
    });
  } catch (_) {}

  revalidatePath('/admin');
  return { ok: true };
}

export async function rejectVerification(requestId: string, notes?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from('verification_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  if (!req) return { error: 'Solicitud no encontrada' };

  await admin
    .from('verification_requests')
    .update({ status: 'rechazada', admin_notes: notes ?? null, reviewed_at: new Date().toISOString() })
    .eq('id', requestId);

  try {
    await admin.from('notifications').insert({
      user_id: req.user_id,
      type: 'verification_rejected',
      reference_id: requestId,
    });
  } catch (_) {}

  revalidatePath('/admin');
  return { ok: true };
}

export async function rejectOrgRequest(requestId: string, notes?: string) {
  await requireAdmin();
  const admin = createAdminClient();

  const { data: req } = await admin
    .from('organization_requests')
    .select('user_id')
    .eq('id', requestId)
    .single();

  await admin
    .from('organization_requests')
    .update({ status: 'rechazada', admin_notes: notes ?? null })
    .eq('id', requestId);

  if (req) {
    try {
      await admin.from('notifications').insert({
        user_id: req.user_id,
        type: 'org_request_rejected',
        reference_id: requestId,
      });
    } catch (_) {}
  }

  revalidatePath('/admin');
  return { ok: true };
}

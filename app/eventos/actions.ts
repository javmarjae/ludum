'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function createEvent(formData: FormData): Promise<string> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_event_creator')
    .eq('id', user.id)
    .single();

  if (!profile?.is_event_creator) throw new Error('Sin permiso para crear eventos');

  const latStr = (formData.get('lat') as string)?.trim();
  const lonStr = (formData.get('lon') as string)?.trim();
  const capacityStr = (formData.get('capacity') as string)?.trim();
  const endsAt = (formData.get('ends_at') as string)?.trim();

  const { data, error } = await supabase
    .from('events')
    .insert({
      created_by: user.id,
      title: formData.get('title') as string,
      description: (formData.get('description') as string) || null,
      type: formData.get('type') as string,
      location_name: formData.get('location_name') as string,
      city: formData.get('city') as string,
      address: (formData.get('address') as string) || null,
      starts_at: formData.get('starts_at') as string,
      ends_at: endsAt || null,
      image_url: (formData.get('image_url') as string) || null,
      capacity: capacityStr ? parseInt(capacityStr) : null,
      registration_url: (formData.get('registration_url') as string) || null,
      lat: latStr ? parseFloat(latStr) : null,
      lon: lonStr ? parseFloat(lonStr) : null,
    })
    .select('id')
    .single();

  if (error) throw new Error(error.message);

  // Si el usuario adjuntó una imagen editada, la subimos ahora que ya tenemos el
  // id del evento (la carpeta {eventId}/ es lo que valida la policy del bucket).
  const imageFile = formData.get('image_file') as File | null;
  if (imageFile && imageFile.size > 0) {
    try {
      const path = `${data.id}/cover.webp`;
      const arrayBuffer = await imageFile.arrayBuffer();
      const { error: uploadError } = await supabase.storage
        .from('event-images')
        .upload(path, arrayBuffer, { contentType: 'image/webp', upsert: true });
      if (!uploadError) {
        const { data: { publicUrl } } = supabase.storage.from('event-images').getPublicUrl(path);
        await supabase.from('events').update({ image_url: `${publicUrl}?v=${Date.now()}` }).eq('id', data.id);
      }
    } catch {
      // Si falla la subida, el evento ya está creado sin imagen — no bloqueamos.
    }
  }

  revalidatePath('/eventos');
  return data.id;
}

export async function toggleAttendance(eventId: string, status: 'interested' | 'going') {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autenticado');

  const { data: existing } = await supabase
    .from('event_attendees')
    .select('status')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .single();

  if (existing?.status === status) {
    await supabase
      .from('event_attendees')
      .delete()
      .eq('event_id', eventId)
      .eq('user_id', user.id);
  } else {
    await supabase
      .from('event_attendees')
      .upsert({ event_id: eventId, user_id: user.id, status });
  }

  revalidatePath(`/eventos/${eventId}`);
}

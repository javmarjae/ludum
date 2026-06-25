import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { EventsClient } from './EventsClient';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Eventos cerca de ti',
  description: 'Torneos y ferias de juegos de mesa cerca de ti.',
};

export default async function EventosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/eventos');

  const [{ data: profile }, { data: events }] = await Promise.all([
    supabase
      .from('profiles')
      .select('is_event_creator, city')
      .eq('id', user.id)
      .single(),
    supabase
      .from('events')
      .select('id, title, description, type, location_name, city, starts_at, ends_at, image_url, capacity, registration_url, lat, lon, event_attendees(count)')
      .eq('is_published', true)
      .gte('starts_at', new Date().toISOString())
      .order('starts_at', { ascending: true })
      .limit(60),
  ]);

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <EventsClient
          initialEvents={(events ?? []) as any[]}
          userCity={profile?.city ?? null}
          isEventCreator={profile?.is_event_creator ?? false}
        />
      </main>
    </div>
  );
}

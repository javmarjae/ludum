import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { AttendanceButtons } from './AttendanceButtons';
import type { Metadata } from 'next';

interface Props { params: Promise<{ id: string }>; }

const TYPE_LABEL: Record<string, string> = { tournament: 'Torneo', fair: 'Feria' };
const TYPE_COLOR: Record<string, string> = { tournament: '#3E5E3B', fair: '#7C3AED' };

function formatDateFull(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('events').select('title').eq('id', id).single();
  return { title: data?.title ?? 'Evento' };
}

export default async function EventoDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect(`/auth/login?next=/eventos/${id}`);

  const [{ data: event }, { data: attendees }, { data: myAttendance }] = await Promise.all([
    supabase
      .from('events')
      .select('id, title, description, type, location_name, city, address, starts_at, ends_at, image_url, capacity, registration_url, lat, lon, created_by, profiles!created_by(display_name)')
      .eq('id', id)
      .eq('is_published', true)
      .single(),
    supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', id),
    supabase
      .from('event_attendees')
      .select('status')
      .eq('event_id', id)
      .eq('user_id', user.id)
      .single(),
  ]);

  if (!event) notFound();

  const typeColor = TYPE_COLOR[event.type] ?? '#3E5E3B';
  const goingCount = attendees?.filter(a => a.status === 'going').length ?? 0;
  const interestedCount = attendees?.filter(a => a.status === 'interested').length ?? 0;
  const organizer = (event as any).profiles?.display_name ?? 'Organizador';

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/eventos', label: 'Eventos' }} />

      <main style={{ maxWidth: 720, margin: '0 auto', padding: '40px clamp(16px,4vw,32px) 80px' }}>
        {/* Image header */}
        <div style={{
          width: '100%', height: 240, borderRadius: 16, overflow: 'hidden',
          background: 'var(--bg-inset)', marginBottom: 28, position: 'relative',
        }}>
          {event.image_url ? (
            <Image src={event.image_url} alt={event.title} fill sizes="(max-width: 720px) 100vw, 720px" style={{ objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 80 }}>
              {event.type === 'tournament' ? '🏆' : '🎪'}
            </div>
          )}
          <span style={{
            position: 'absolute', top: 14, left: 14,
            padding: '5px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
            background: typeColor, color: 'white',
          }}>
            {TYPE_LABEL[event.type] ?? event.type}
          </span>
        </div>

        {/* Title */}
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: 'var(--text-1)', lineHeight: 1.2 }}>
          {event.title}
        </h1>
        <p style={{ margin: '0 0 24px', fontSize: 13, color: 'var(--text-4)' }}>
          Organizado por <strong>{organizer}</strong>
        </p>

        {/* Info cards */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
          <InfoCard icon="📅" label="Inicio" value={formatDateFull(event.starts_at)} />
          {event.ends_at && <InfoCard icon="🏁" label="Fin" value={formatDateFull(event.ends_at)} />}
          <InfoCard icon="📍" label="Lugar" value={`${event.location_name}, ${event.city}`} />
          {event.address && <InfoCard icon="🗺️" label="Dirección" value={event.address} />}
          {event.capacity && <InfoCard icon="👥" label="Aforo" value={`${event.capacity} personas`} />}
        </div>

        {/* Attendance summary */}
        <div style={{
          display: 'flex', gap: 20, padding: '14px 18px', borderRadius: 12,
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: 24,
        }}>
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>
            <strong style={{ fontWeight: 800 }}>{goingCount}</strong> asistirán
          </span>
          <span style={{ fontSize: 14, color: 'var(--text-2)' }}>
            <strong style={{ fontWeight: 800 }}>{interestedCount}</strong> interesados
          </span>
        </div>

        {/* Attendance buttons */}
        <AttendanceButtons
          eventId={id}
          myStatus={(myAttendance as any)?.status ?? null}
          goingCount={goingCount}
          interestedCount={interestedCount}
        />

        {/* Registration link */}
        {event.registration_url && (
          <a
            href={event.registration_url}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'block', marginTop: 16, padding: '12px 20px', borderRadius: 12,
              background: 'var(--bg-inset)', color: 'var(--text-2)', textDecoration: 'none',
              fontSize: 14, fontWeight: 600, textAlign: 'center', boxShadow: 'var(--shadow-btn)',
            }}
          >
            Inscripción oficial →
          </a>
        )}

        {/* Description */}
        {event.description && (
          <div style={{ marginTop: 28 }}>
            <h2 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: 'var(--text-1)' }}>
              Descripción
            </h2>
            <p style={{ margin: 0, fontSize: 15, color: 'var(--text-2)', lineHeight: 1.65, whiteSpace: 'pre-line' }}>
              {event.description}
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  return (
    <div style={{
      padding: '12px 14px', borderRadius: 12, background: 'var(--bg-card)',
      boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 3,
    }}>
      <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {icon} {label}
      </span>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)' }}>
        {value}
      </span>
    </div>
  );
}

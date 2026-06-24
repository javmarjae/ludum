'use client';

import { useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

interface EventRow {
  id: string;
  title: string;
  description: string | null;
  type: 'tournament' | 'fair';
  location_name: string;
  city: string;
  starts_at: string;
  ends_at: string | null;
  image_url: string | null;
  capacity: number | null;
  registration_url: string | null;
  lat: number | null;
  lon: number | null;
  event_attendees: { count: number }[];
  distance_km?: number;
}

type FilterType = 'all' | 'tournament' | 'fair';

const TYPE_LABEL: Record<string, string> = { tournament: 'Torneo', fair: 'Feria' };
const TYPE_COLOR: Record<string, string> = { tournament: '#3E5E3B', fair: '#7C3AED' };

function formatDate(iso: string) {
  return new Intl.DateTimeFormat('es-ES', {
    weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
  }).format(new Date(iso));
}

function attendeeCount(event: EventRow) {
  const arr = event.event_attendees;
  if (!arr?.length) return 0;
  return typeof arr[0] === 'object' && 'count' in arr[0] ? (arr[0] as any).count : arr.length;
}

function EventCard({ event }: { event: EventRow }) {
  const typeColor = TYPE_COLOR[event.type] ?? '#3E5E3B';
  const count = attendeeCount(event);

  return (
    <Link href={`/eventos/${event.id}`} style={{ textDecoration: 'none', display: 'block' }}>
      <div
        className="hover-scale-md"
        style={{
          background: 'var(--bg-card)', borderRadius: 14, overflow: 'hidden',
          boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column',
        }}
      >
        {/* Image */}
        <div style={{ position: 'relative', width: '100%', height: 140, background: 'var(--bg-inset)', flexShrink: 0 }}>
          {event.image_url ? (
            <img src={event.image_url} alt={event.title} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          ) : (
            <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48 }}>
              {event.type === 'tournament' ? '🏆' : '🎪'}
            </div>
          )}
          {/* Type badge */}
          <span style={{
            position: 'absolute', top: 10, left: 10, padding: '3px 10px', borderRadius: 8,
            fontSize: 11, fontWeight: 700, letterSpacing: '0.04em',
            background: typeColor, color: 'white',
          }}>
            {TYPE_LABEL[event.type] ?? event.type}
          </span>
          {event.distance_km !== undefined && (
            <span style={{
              position: 'absolute', top: 10, right: 10, padding: '3px 10px', borderRadius: 8,
              fontSize: 11, fontWeight: 700, background: 'rgba(0,0,0,0.55)', color: 'white',
            }}>
              {event.distance_km < 1
                ? `${Math.round(event.distance_km * 1000)} m`
                : `${event.distance_km.toFixed(0)} km`}
            </span>
          )}
        </div>

        {/* Content */}
        <div style={{ padding: '14px 16px 16px', display: 'flex', flexDirection: 'column', gap: 6, flex: 1 }}>
          <h3 style={{ margin: 0, fontSize: 15, fontWeight: 700, color: 'var(--text-1)', lineHeight: 1.3 }}>
            {event.title}
          </h3>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
            📅 {formatDate(event.starts_at)}
          </p>
          <p style={{ margin: 0, fontSize: 12, color: 'var(--text-3)' }}>
            📍 {event.location_name}, {event.city}
          </p>
          {count > 0 && (
            <p style={{ margin: 0, fontSize: 12, color: 'var(--text-4)' }}>
              👥 {count} {count === 1 ? 'persona' : 'personas'}
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}

export function EventsClient({
  initialEvents,
  userCity,
  isEventCreator,
}: {
  initialEvents: EventRow[];
  userCity: string | null;
  isEventCreator: boolean;
}) {
  const [events, setEvents] = useState<EventRow[]>(initialEvents);
  const [filter, setFilter] = useState<FilterType>('all');
  const [geoLoading, setGeoLoading] = useState(false);
  const [geoError, setGeoError] = useState<string | null>(null);
  const [geoActive, setGeoActive] = useState(false);

  const filtered = filter === 'all' ? events : events.filter(e => e.type === filter);

  async function handleGeoSearch() {
    if (!navigator.geolocation) {
      setGeoError('Tu navegador no soporta geolocalización.');
      return;
    }
    setGeoLoading(true);
    setGeoError(null);

    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const supabase = createClient();
          const { data, error } = await supabase.rpc('events_near', {
            user_lat: pos.coords.latitude,
            user_lon: pos.coords.longitude,
            radius_km: 100,
          });
          if (error) throw error;
          setEvents((data ?? []) as EventRow[]);
          setGeoActive(true);
        } catch {
          setGeoError('Error al buscar eventos cercanos.');
        } finally {
          setGeoLoading(false);
        }
      },
      () => {
        setGeoError('No se pudo obtener tu ubicación. Comprueba los permisos del navegador.');
        setGeoLoading(false);
      },
      { timeout: 8000 }
    );
  }

  function handleReset() {
    setEvents(initialEvents);
    setGeoActive(false);
    setGeoError(null);
  }

  const filterBtn = (type: FilterType, label: string) => {
    const active = filter === type;
    return (
      <button
        onClick={() => setFilter(type)}
        style={{
          padding: '7px 16px', borderRadius: 20, border: 'none', cursor: 'pointer',
          fontSize: 13, fontWeight: 700, transition: 'background 0.15s, color 0.15s',
          background: active ? 'var(--brand)' : 'var(--bg-inset)',
          color: active ? 'white' : 'var(--text-3)',
          boxShadow: active ? '0 3px 10px rgba(62,94,59,0.30)' : 'var(--shadow-btn)',
        }}
      >
        {label}
      </button>
    );
  };

  return (
    <>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 26, fontWeight: 800, color: 'var(--text-1)' }}>
            Eventos cerca de ti
          </h1>
          {userCity && !geoActive && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--text-4)' }}>
              Mostrando eventos próximos{userCity ? ` · ${userCity}` : ''}
            </p>
          )}
          {geoActive && (
            <p style={{ margin: '4px 0 0', fontSize: 13, color: 'var(--brand)' }}>
              Ordenados por distancia · radio 100 km
            </p>
          )}
        </div>
        {isEventCreator && (
          <Link
            href="/eventos/nuevo"
            style={{
              padding: '9px 18px', borderRadius: 10, background: 'var(--brand)', color: 'white',
              textDecoration: 'none', fontSize: 13, fontWeight: 700,
              boxShadow: '0 3px 10px rgba(62,94,59,0.30)',
            }}
          >
            + Crear evento
          </Link>
        )}
      </div>

      {/* Controls */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 20, alignItems: 'center' }}>
        {filterBtn('all', 'Todos')}
        {filterBtn('tournament', '🏆 Torneos')}
        {filterBtn('fair', '🎪 Ferias')}

        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
          {geoActive && (
            <button
              onClick={handleReset}
              style={{
                padding: '7px 14px', borderRadius: 20, border: '1px solid var(--border)',
                background: 'transparent', cursor: 'pointer', fontSize: 12,
                color: 'var(--text-3)', fontWeight: 600,
              }}
            >
              Quitar filtro GPS
            </button>
          )}
          <button
            onClick={handleGeoSearch}
            disabled={geoLoading}
            style={{
              padding: '7px 16px', borderRadius: 20, border: 'none', cursor: geoLoading ? 'wait' : 'pointer',
              fontSize: 13, fontWeight: 700,
              background: geoActive ? 'var(--brand)' : 'var(--bg-inset)',
              color: geoActive ? 'white' : 'var(--text-2)',
              boxShadow: 'var(--shadow-btn)',
              opacity: geoLoading ? 0.7 : 1,
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            {geoLoading ? 'Buscando…' : '📍 Cerca de mí'}
          </button>
        </div>
      </div>

      {geoError && (
        <p style={{ margin: '0 0 16px', fontSize: 13, color: '#DC2626', background: '#FEF2F2', padding: '10px 14px', borderRadius: 10 }}>
          {geoError}
        </p>
      )}

      {/* Event grid */}
      {filtered.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '60px 0', color: 'var(--text-4)' }}>
          <div style={{ fontSize: 48, marginBottom: 12 }}>🗓️</div>
          <p style={{ margin: 0, fontWeight: 600 }}>
            {geoActive ? 'No hay eventos en 100 km a tu alrededor.' : 'No hay eventos próximos.'}
          </p>
          {isEventCreator && (
            <Link href="/eventos/nuevo" style={{ display: 'inline-block', marginTop: 16, color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>
              Crear el primero →
            </Link>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 18 }}>
          {filtered.map(event => <EventCard key={event.id} event={event} />)}
        </div>
      )}
    </>
  );
}

'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '../actions';

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '10px 14px', borderRadius: 12, fontSize: 14, fontWeight: 500,
  background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text)',
  boxShadow: 'var(--shadow-input)', outline: 'none', fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 6,
};

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div style={{ marginBottom: 18 }}>
      <label style={labelStyle}>{label}{required && ' *'}</label>
      {children}
    </div>
  );
}

export function NuevoEventoForm() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [useGeo, setUseGeo] = useState(false);
  const [lat, setLat] = useState('');
  const [lon, setLon] = useState('');

  function handleGetGeo() {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLat(pos.coords.latitude.toFixed(6));
        setLon(pos.coords.longitude.toFixed(6));
        setUseGeo(true);
      },
      () => alert('No se pudo obtener la ubicación.'),
      { timeout: 8000 }
    );
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const fd = new FormData(e.currentTarget);
      if (lat) fd.set('lat', lat);
      if (lon) fd.set('lon', lon);
      const newId = await createEvent(fd);
      router.push(`/eventos/${newId}`);
    } catch (err: any) {
      setError(err.message ?? 'Error al crear el evento.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <Field label="Título del evento" required>
        <input name="title" required style={inputStyle} placeholder="Gran Torneo de Catan 2026" />
      </Field>

      <Field label="Tipo" required>
        <select name="type" required style={inputStyle}>
          <option value="tournament">🏆 Torneo</option>
          <option value="fair">🎪 Feria / Convención</option>
        </select>
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Nombre del lugar" required>
          <input name="location_name" required style={inputStyle} placeholder="Tienda El Dado" />
        </Field>
        <Field label="Ciudad" required>
          <input name="city" required style={inputStyle} placeholder="Madrid" />
        </Field>
      </div>

      <Field label="Dirección (opcional)">
        <input name="address" style={inputStyle} placeholder="Calle Mayor 1" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Inicio" required>
          <input name="starts_at" type="datetime-local" required style={inputStyle} />
        </Field>
        <Field label="Fin (opcional)">
          <input name="ends_at" type="datetime-local" style={inputStyle} />
        </Field>
      </div>

      <Field label="Descripción (opcional)">
        <textarea
          name="description"
          rows={4}
          style={{ ...inputStyle, resize: 'vertical' }}
          placeholder="Detalla el formato, juegos, premios…"
        />
      </Field>

      <Field label="URL de imagen (opcional)">
        <input name="image_url" type="url" style={inputStyle} placeholder="https://…" />
      </Field>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
        <Field label="Aforo máximo (opcional)">
          <input name="capacity" type="number" min={1} style={inputStyle} placeholder="32" />
        </Field>
        <Field label="URL de inscripción (opcional)">
          <input name="registration_url" type="url" style={inputStyle} placeholder="https://…" />
        </Field>
      </div>

      {/* Coordinates for GPS search */}
      <div style={{ marginBottom: 18, padding: '14px', borderRadius: 12, background: 'var(--bg-inset)', border: '1px solid var(--border)' }}>
        <p style={{ margin: '0 0 10px', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Coordenadas GPS (para búsqueda "cerca de mí")
        </p>
        <div style={{ display: 'flex', gap: 10, alignItems: 'flex-end' }}>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Latitud</label>
            <input value={lat} onChange={e => setLat(e.target.value)} style={inputStyle} placeholder="40.416775" />
          </div>
          <div style={{ flex: 1 }}>
            <label style={{ ...labelStyle, marginBottom: 4 }}>Longitud</label>
            <input value={lon} onChange={e => setLon(e.target.value)} style={inputStyle} placeholder="-3.703790" />
          </div>
          <button
            type="button"
            onClick={handleGetGeo}
            style={{
              padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: useGeo ? 'var(--brand)' : 'var(--bg-card)', color: useGeo ? 'white' : 'var(--text-2)',
              fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: 'var(--shadow-btn)',
              flexShrink: 0,
            }}
          >
            📍 {useGeo ? 'Obtenido' : 'Usar mi ubicación'}
          </button>
        </div>
      </div>

      {error && (
        <p style={{ margin: '0 0 16px', padding: '10px 14px', borderRadius: 10, background: '#FEF2F2', color: '#DC2626', fontSize: 14 }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={submitting}
        style={{
          width: '100%', padding: '14px 0', borderRadius: 14, border: 'none',
          background: 'var(--brand)', color: 'white', fontSize: 16, fontWeight: 700,
          cursor: submitting ? 'wait' : 'pointer', opacity: submitting ? 0.7 : 1,
          boxShadow: '0 4px 14px rgba(62,94,59,0.30)',
          transition: 'opacity 0.15s',
        }}
      >
        {submitting ? 'Creando…' : 'Publicar evento'}
      </button>
    </form>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createEvent } from '../actions';
import { ImageEditor } from '@/components/ImageEditor';

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

const pillBtn: React.CSSProperties = {
  padding: '6px 12px', borderRadius: 999, border: 'none', cursor: 'pointer',
  fontFamily: 'inherit', fontSize: 12, fontWeight: 700,
  background: 'rgba(0,0,0,0.55)', color: 'white', backdropFilter: 'blur(4px)',
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
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [editorFile, setEditorFile] = useState<File | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  function handleImagePick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    e.target.value = '';
    if (f) setEditorFile(f);
  }
  function handleImageConfirmed(f: File) {
    setEditorFile(null);
    setImageFile(f);
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return URL.createObjectURL(f); });
  }
  function removeImage() {
    setImageFile(null);
    setImagePreview((prev) => { if (prev) URL.revokeObjectURL(prev); return null; });
  }

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
      if (imageFile) fd.set('image_file', imageFile);
      const newId = await createEvent(fd);
      router.push(`/eventos/${newId}`);
    } catch (err: any) {
      setError(err.message ?? 'Error al crear el evento.');
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {editorFile && (
        <ImageEditor
          file={editorFile}
          aspect={16 / 9}
          circular={false}
          outputSize={1280}
          outputFileName="cover.webp"
          title="Ajusta la imagen del evento"
          onCancel={() => setEditorFile(null)}
          onConfirm={handleImageConfirmed}
        />
      )}
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

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))', gap: 14 }}>
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

      <Field label="Imagen del evento (opcional)">
        <input ref={fileInputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImagePick} />
        {imagePreview ? (
          <div style={{ position: 'relative', width: '100%', aspectRatio: '16 / 9', borderRadius: 12, overflow: 'hidden', background: 'var(--bg-inset)' }}>
            <img src={imagePreview} alt="Vista previa del evento" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            <div style={{ position: 'absolute', top: 8, right: 8, display: 'flex', gap: 8 }}>
              <button type="button" onClick={() => fileInputRef.current?.click()} style={pillBtn}>Cambiar</button>
              <button type="button" onClick={removeImage} style={pillBtn}>Quitar</button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            style={{ width: '100%', padding: '22px', borderRadius: 12, border: '1.5px dashed var(--border)', background: 'var(--bg-inset)', color: 'var(--text-3)', cursor: 'pointer', fontFamily: 'inherit', fontSize: 14, fontWeight: 600 }}
          >
            📷 Subir imagen del evento
          </button>
        )}
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 6 }}>Formato banner 16:9 · podrás recortar y girar antes de subir</p>
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

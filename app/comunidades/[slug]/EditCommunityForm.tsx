'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateCommunity, uploadCommunityImage } from '../actions';
import { ImageEditor } from '@/components/ImageEditor';

interface Props {
  communityId: string;
  communitySlug: string;
  initialDescription: string;
  initialLocation: string;
  initialMapsUrl: string;
  initialImage: string | null;
}

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 14, fontSize: 14, fontWeight: 500,
  background: 'var(--bg-inset)', border: '1.5px solid transparent', outline: 'none',
  fontFamily: 'inherit', color: 'var(--text)', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

export function EditCommunityForm({ communityId, communitySlug, initialDescription, initialLocation, initialMapsUrl, initialImage }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [description, setDescription] = useState(initialDescription);
  const [location, setLocation] = useState(initialLocation);
  const [mapsUrl, setMapsUrl] = useState(initialMapsUrl);
  const [image, setImage] = useState<string | null>(initialImage);
  const [saving, setSaving] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  function handleImageChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    setEditorFile(file);
  }

  async function uploadEditedImage(file: File) {
    setEditorFile(null);
    setUploadingImage(true);
    const fd = new FormData();
    fd.append('image', file);
    const res = await uploadCommunityImage(communityId, communitySlug, fd);
    if (res && 'url' in res) {
      setImage(res.url);
      router.refresh();
    }
    setUploadingImage(false);
  }

  async function handleSave() {
    setSaving(true);
    await updateCommunity(communityId, communitySlug, {
      description: description.trim(),
      location: location.trim(),
      maps_url: mapsUrl.trim(),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          display: 'flex', alignItems: 'center', gap: 8,
          padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 700,
          cursor: 'pointer', fontFamily: 'inherit',
          color: 'var(--text-2)', background: 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }}
      >
        ✎ Editar comunidad
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 24, padding: 24, marginBottom: 24, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {editorFile && (
        <ImageEditor
          file={editorFile}
          title="Ajusta la imagen de la comunidad"
          circular={false}
          onCancel={() => setEditorFile(null)}
          onConfirm={uploadEditedImage}
        />
      )}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Editar comunidad</h2>
        <button onClick={() => setOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-4)', lineHeight: 1 }}>✕</button>
      </div>

      {/* Imagen */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
        <div style={{ position: 'relative', flexShrink: 0 }}>
          {image
            ? <Image src={image} alt="Portada" width={64} height={64} style={{ borderRadius: 18, objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
            : <div style={{ width: 64, height: 64, borderRadius: 18, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28, background: 'var(--bg-inset)' }}>🧩</div>
          }
          {uploadingImage && (
            <div style={{ position: 'absolute', inset: 0, borderRadius: 18, background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>...</div>
          )}
        </div>
        <div>
          <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: uploadingImage ? 'default' : 'pointer', fontFamily: 'inherit', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
            <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleImageChange} disabled={uploadingImage} />
            {uploadingImage ? 'Subiendo...' : 'Cambiar imagen'}
          </label>
          <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 4 }}>JPG, PNG o WebP · máx. 2 MB</p>
        </div>
      </div>

      {/* Descripción */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
          maxLength={400}
          placeholder="¿De qué va esta comunidad?"
          style={{ ...fieldStyle, resize: 'none', lineHeight: 1.5 }}
          onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
        />
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', textAlign: 'right', marginTop: 4 }}>{description.length}/400</p>
      </div>

      {/* Ubicación */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Ubicación</label>
        <input
          value={location}
          onChange={(e) => setLocation(e.target.value)}
          placeholder="Ej: Madrid, Barcelona..."
          style={fieldStyle}
          onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
        />
      </div>

      {/* Link Google Maps */}
      <div>
        <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Enlace Google Maps</label>
        <input
          value={mapsUrl}
          onChange={(e) => setMapsUrl(e.target.value)}
          placeholder="https://maps.google.com/..."
          type="url"
          style={fieldStyle}
          onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
          onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
        />
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 4 }}>Pega el enlace de "Compartir" de Google Maps</p>
      </div>

      {/* Botones */}
      <div style={{ display: 'flex', gap: 10 }}>
        <button
          onClick={handleSave}
          disabled={saving || saved}
          style={{
            flex: 1, padding: '12px', borderRadius: 999, fontSize: 14, fontWeight: 700,
            cursor: saving || saved ? 'default' : 'pointer', fontFamily: 'inherit',
            color: 'white', background: saved ? '#16a34a' : 'var(--brand)', border: 'none', transition: 'background 0.2s',
          }}
        >
          {saved ? 'Guardado ✓' : saving ? 'Guardando...' : 'Guardar cambios'}
        </button>
        <button
          onClick={() => setOpen(false)}
          style={{ padding: '12px 20px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', background: 'var(--bg-inset)', border: 'none', color: 'var(--text-2)' }}
        >
          Cancelar
        </button>
      </div>
    </div>
  );
}

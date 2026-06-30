'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { updateProfile, uploadAvatar } from './actions';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { ImageEditor } from '@/components/ImageEditor';

interface SocialLinks {
  instagram?: string;
  twitter?: string;
  bgg?: string;
  youtube?: string;
}

interface Props {
  initialName: string;
  initialBio: string;
  initialAvatar: string | null;
  initialSocialLinks: SocialLinks;
  email: string;
  createdAt?: string;
  isVerified?: boolean;
}

const SOCIALS = [
  { key: 'instagram', label: 'Instagram', placeholder: '@usuario' },
  { key: 'twitter',   label: 'Twitter / X', placeholder: '@usuario' },
  { key: 'bgg',       label: 'BoardGameGeek', placeholder: 'usuario BGG' },
  { key: 'youtube',   label: 'YouTube', placeholder: 'canal o URL' },
] as const;

const fieldStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px', borderRadius: 8, fontSize: 14, fontWeight: 500,
  background: 'var(--bg-inset)', border: '1.5px solid transparent', outline: 'none',
  fontFamily: 'inherit', color: 'var(--text)', boxSizing: 'border-box',
  transition: 'border-color 0.15s',
};

function formatJoinDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
}

export function EditProfileForm({ initialName, initialBio, initialAvatar, initialSocialLinks, email, createdAt, isVerified }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState(initialName);
  const [bio, setBio] = useState(initialBio);
  const [socials, setSocials] = useState<SocialLinks>(initialSocialLinks);
  const [avatar, setAvatar] = useState<string | null>(initialAvatar);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [saved, setSaved] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  // Al elegir archivo abrimos el editor en vez de subir directamente.
  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = ''; // permite re-seleccionar el mismo archivo
    if (!file) return;
    setEditorFile(file);
  }

  // El editor devuelve el archivo ya recortado/rotado → ahora sí subimos.
  async function uploadEditedAvatar(file: File) {
    setEditorFile(null);
    setUploadingAvatar(true);
    const fd = new FormData();
    fd.append('avatar', file);
    const res = await uploadAvatar(fd);
    if (res && 'url' in res) {
      setAvatar(res.url);
      router.refresh();
    }
    setUploadingAvatar(false);
  }

  async function handleSave() {
    setSaving(true);
    await updateProfile({
      display_name: name.trim(),
      bio: bio.trim(),
      social_links: Object.fromEntries(
        Object.entries(socials).filter(([, v]) => v?.trim())
      ),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => { setSaved(false); setOpen(false); }, 1200);
  }

  return (
    <div>
      {editorFile && (
        <ImageEditor
          file={editorFile}
          title="Ajusta tu foto de perfil"
          onCancel={() => setEditorFile(null)}
          onConfirm={uploadEditedAvatar}
        />
      )}
      {!open ? (
        /* Vista: avatar grande izquierda + info derecha */
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 28 }}>
          {/* Avatar grande */}
          <div style={{ flexShrink: 0 }}>
            {avatar ? (
              <Image src={avatar} alt={name} width={130} height={130} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 4px 20px rgba(62,94,59,0.2)' }} />
            ) : (
              <div style={{ width: 130, height: 130, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 48, fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #89BA86, #3E5E3B)', boxShadow: '0 4px 20px rgba(62,94,59,0.25)' }}>
                {name[0]?.toUpperCase()}
              </div>
            )}
          </div>

          {/* Info */}
          <div style={{ flex: 1, minWidth: 0 }}>
            <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 6, display: 'flex', alignItems: 'center', gap: 8 }}>
              {name}
              {isVerified && <VerifiedBadge size={22} title="Perfil verificado" />}
            </h1>
            {createdAt && (
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', marginBottom: 12 }}>
                Usuario desde <em>{formatJoinDate(createdAt)}</em>
              </p>
            )}
            {bio && (
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 20, maxWidth: 480 }}>{bio}</p>
            )}
            <button
              onClick={() => setOpen(true)}
              style={{ padding: '10px 28px', borderRadius: 999, fontSize: 14, fontWeight: 700, cursor: 'pointer', fontFamily: 'inherit', color: 'white', background: 'var(--brand)', border: 'none' }}
            >
              Editar Perfil
            </button>
          </div>
        </div>
      ) : (
        <div style={{ borderRadius: 10, padding: 24, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)' }}>Editar perfil</h2>
            <button onClick={() => setOpen(false)} aria-label="Cerrar edición de perfil" style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-4)', lineHeight: 1 }}>✕</button>
          </div>

          {/* Avatar */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ position: 'relative', flexShrink: 0 }}>
              {avatar ? (
                <Image src={avatar} alt="Avatar" width={64} height={64} style={{ borderRadius: '50%', objectFit: 'cover', boxShadow: '0 2px 8px rgba(0,0,0,0.12)' }} />
              ) : (
                <div style={{ width: 64, height: 64, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'white', background: 'linear-gradient(135deg, #89BA86, #3E5E3B)' }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              {uploadingAvatar && (
                <div style={{ position: 'absolute', inset: 0, borderRadius: '50%', background: 'rgba(0,0,0,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, color: 'white', fontWeight: 700 }}>...</div>
              )}
            </div>
            <div>
              <label style={{ display: 'inline-block', padding: '8px 16px', borderRadius: 999, fontSize: 12, fontWeight: 700, cursor: uploadingAvatar ? 'default' : 'pointer', fontFamily: 'inherit', background: 'var(--bg-inset)', border: '1px solid var(--border)', color: 'var(--text-2)' }}>
                <input type="file" accept="image/*" style={{ display: 'none' }} onChange={handleAvatarChange} disabled={uploadingAvatar} />
                {uploadingAvatar ? 'Subiendo...' : 'Cambiar foto'}
              </label>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 4 }}>JPG, PNG o WebP · máx. 2 MB</p>
            </div>
          </div>

          {/* Nombre */}
          <div>
            <label htmlFor="profile-name" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Nombre</label>
            <input
              id="profile-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={fieldStyle}
              onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
            />
          </div>

          {/* Bio */}
          <div>
            <label htmlFor="profile-bio" style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Descripción</label>
            <textarea
              id="profile-bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              maxLength={200}
              placeholder="Cuéntanos algo sobre ti..."
              style={{ ...fieldStyle, resize: 'none', lineHeight: 1.5 }}
              onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
              onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
            />
            <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', textAlign: 'right', marginTop: 4 }}>{bio.length}/200</p>
          </div>

          {/* Redes sociales */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Redes sociales</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {SOCIALS.map(({ key, label, placeholder }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <label htmlFor={`profile-social-${key}`} style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-3)', width: 112, flexShrink: 0 }}>{label}</label>
                  <input
                    id={`profile-social-${key}`}
                    value={socials[key] ?? ''}
                    onChange={(e) => setSocials((s) => ({ ...s, [key]: e.target.value }))}
                    placeholder={placeholder}
                    style={{ ...fieldStyle, flex: 1 }}
                    onFocus={(e) => { e.target.style.borderColor = 'var(--brand)'; }}
                    onBlur={(e) => { e.target.style.borderColor = 'transparent'; }}
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Botones */}
          <div style={{ display: 'flex', gap: 10 }}>
            <button
              onClick={handleSave}
              disabled={saving || saved}
              style={{
                flex: 1, padding: '12px', borderRadius: 999, fontSize: 14, fontWeight: 700,
                cursor: saving || saved ? 'default' : 'pointer', fontFamily: 'inherit',
                color: 'white', background: saved ? '#16a34a' : 'var(--brand)',
                border: 'none', transition: 'background 0.2s',
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
      )}
    </div>
  );
}

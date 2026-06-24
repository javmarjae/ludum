'use client';

import { useState, useTransition } from 'react';
import { createBlogPost } from '../actions';

const inputStyle: React.CSSProperties = {
  background: 'var(--bg-inset)',
  boxShadow: 'var(--shadow-input)',
  border: '1px solid var(--border)',
  borderRadius: 10,
  color: 'var(--text)',
  width: '100%',
  padding: '10px 14px',
  fontSize: 14,
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
  boxSizing: 'border-box',
};

const labelStyle: React.CSSProperties = {
  fontSize: 13,
  fontWeight: 700,
  color: 'var(--text-3)',
  marginBottom: 6,
  display: 'block',
};

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
      <label style={labelStyle}>{label}</label>
      {children}
      {hint && <span style={{ fontSize: 12, color: 'var(--text-4)' }}>{hint}</span>}
    </div>
  );
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-');
}

export function NuevoPostForm() {
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [slugManual, setSlugManual] = useState(false);
  const [isSponsored, setIsSponsored] = useState(false);
  const [isPublished, setIsPublished] = useState(false);
  const [error, setError] = useState('');
  const [isPending, startTransition] = useTransition();

  function handleTitleChange(val: string) {
    setTitle(val);
    if (!slugManual) setSlug(slugify(val));
  }

  function handleSlugChange(val: string) {
    setSlugManual(true);
    setSlug(val);
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError('');
    const formData = new FormData(e.currentTarget);
    startTransition(async () => {
      const result = await createBlogPost(formData);
      if (result?.error) setError(result.error);
    });
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      {error && (
        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 10, padding: '12px 16px', color: '#dc2626', fontSize: 14 }}>
          {error}
        </div>
      )}

      {/* Datos principales */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
          Contenido
        </h2>

        <Field label="Título *">
          <input
            name="title"
            value={title}
            onChange={e => handleTitleChange(e.target.value)}
            required
            placeholder="Ej: Los mejores juegos de mesa de 2025"
            style={inputStyle}
          />
        </Field>

        <Field label="Slug *" hint="URL del artículo: /blog/este-es-el-slug">
          <input
            name="slug"
            value={slug}
            onChange={e => handleSlugChange(e.target.value)}
            required
            placeholder="los-mejores-juegos-2025"
            style={{ ...inputStyle, fontFamily: 'monospace', fontSize: 13 }}
          />
        </Field>

        <Field label="Extracto" hint="Resumen corto que aparece en el listado (~160 caracteres)">
          <textarea
            name="excerpt"
            rows={2}
            placeholder="Breve descripción del artículo para el listado y SEO..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.5 }}
          />
        </Field>

        <Field label="Contenido * (Markdown)" hint="Soporta ##, **negrita**, listas, enlaces, etc.">
          <textarea
            name="content"
            required
            rows={18}
            placeholder="## Intro&#10;&#10;Escribe aquí el contenido del artículo en Markdown..."
            style={{ ...inputStyle, resize: 'vertical', lineHeight: 1.6, fontFamily: 'monospace', fontSize: 13 }}
          />
        </Field>

        <Field label="Autor">
          <input
            name="author_name"
            defaultValue="Equipo Ludum"
            style={inputStyle}
          />
        </Field>
      </section>

      {/* Metadatos */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
          Imagen y etiquetas
        </h2>

        <Field label="URL imagen de portada">
          <input
            name="cover_image"
            type="url"
            placeholder="https://..."
            style={inputStyle}
          />
        </Field>

        <Field label="Etiquetas" hint="Separadas por comas: novedades, reseñas, estrategia">
          <input
            name="tags"
            placeholder="novedades, reseñas, 2025"
            style={inputStyle}
          />
        </Field>
      </section>

      {/* Publicación */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
          Publicación
        </h2>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            name="is_published"
            type="checkbox"
            checked={isPublished}
            onChange={e => setIsPublished(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: 'var(--brand)', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
            Publicar ahora
          </span>
          <span style={{ fontSize: 12, color: 'var(--text-4)' }}>
            (si no marcas esto, queda como borrador)
          </span>
        </label>

        {isPublished && (
          <Field label="Fecha de publicación">
            <input
              name="published_at"
              type="datetime-local"
              defaultValue={new Date().toISOString().slice(0, 16)}
              style={inputStyle}
            />
          </Field>
        )}
      </section>

      {/* Patrocinio */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
          Patrocinio
        </h2>

        <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
          <input
            name="is_sponsored"
            type="checkbox"
            checked={isSponsored}
            onChange={e => setIsSponsored(e.target.checked)}
            style={{ width: 16, height: 16, accentColor: '#d97706', cursor: 'pointer' }}
          />
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>
            Contenido patrocinado
          </span>
        </label>

        {isSponsored && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: '16px', background: 'var(--bg-inset)', borderRadius: 10 }}>
            <Field label="Nombre del patrocinador *">
              <input name="sponsor_name" required={isSponsored} placeholder="Ej: Devir" style={inputStyle} />
            </Field>
            <Field label="URL destino del patrocinador" hint="Enlace al que apunta el badge al pie del artículo">
              <input name="sponsor_url" type="url" placeholder="https://devir.com" style={inputStyle} />
            </Field>
            <Field label="URL logo del patrocinador" hint="Imagen PNG/SVG sobre fondo claro">
              <input name="sponsor_logo" type="url" placeholder="https://devir.com/logo.png" style={inputStyle} />
            </Field>
          </div>
        )}
      </section>

      {/* SEO */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 18, padding: '24px', background: 'var(--bg-card)', borderRadius: 14, border: '1px solid var(--border)', boxShadow: 'var(--shadow-card)' }}>
        <h2 style={{ fontFamily: 'var(--font-display)', fontSize: 16, fontWeight: 700, color: 'var(--text-2)', margin: 0 }}>
          SEO (opcional)
        </h2>
        <Field label="Título SEO" hint="Si lo dejas vacío se usa el título del artículo. Máx. ~60 chars.">
          <input name="seo_title" maxLength={70} placeholder="Título para Google..." style={inputStyle} />
        </Field>
        <Field label="Meta descripción" hint="Máx. ~155 chars.">
          <textarea name="seo_description" rows={2} maxLength={160} placeholder="Descripción para Google y redes..." style={{ ...inputStyle, resize: 'vertical' }} />
        </Field>
      </section>

      {/* Submit */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 12 }}>
        <a
          href="/blog"
          style={{
            fontSize: 14, fontWeight: 700, padding: '10px 20px', borderRadius: 10,
            color: 'var(--text-3)', background: 'var(--bg-inset)', textDecoration: 'none',
            boxShadow: 'var(--shadow-btn)',
          }}
        >
          Cancelar
        </a>
        <button
          type="submit"
          disabled={isPending}
          style={{
            fontSize: 14, fontWeight: 700, padding: '10px 24px', borderRadius: 10,
            color: 'white', background: isPending ? 'var(--text-4)' : 'var(--brand)',
            border: 'none', cursor: isPending ? 'not-allowed' : 'pointer',
            boxShadow: isPending ? 'none' : 'var(--shadow-btn-brand)',
            transition: 'background 0.15s',
          }}
        >
          {isPending ? 'Guardando…' : isPublished ? 'Publicar artículo' : 'Guardar borrador'}
        </button>
      </div>
    </form>
  );
}

'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createPost } from '../actions';

interface Props {
  communityId: string;
  communitySlug: string;
}

export function CreatePostForm({ communityId, communitySlug }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createPost(communityId, communitySlug, formData);

    if ('error' in result) {
      setError(result.error);
      setPending(false);
    } else {
      formRef.current?.reset();
      setOpen(false);
      setPending(false);
      router.push(`/comunidades/${communitySlug}/posts/${result.postId}`);
    }
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          width: '100%', padding: '14px 18px', borderRadius: 16, border: 'none',
          cursor: 'pointer', textAlign: 'left',
          fontWeight: 600, fontSize: 14, color: 'var(--text-3)',
          background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
        }}
      >
        ✏️ Escribe algo en la comunidad...
      </button>
    );
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ borderRadius: 16, padding: '18px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', flexDirection: 'column', gap: 12 }}
    >
      <input
        name="title"
        required
        maxLength={120}
        placeholder="Título de la publicación"
        autoFocus
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
          boxShadow: 'var(--shadow-input)', background: 'var(--bg)',
          fontSize: 15, fontWeight: 700, color: 'var(--text)', outline: 'none',
        }}
      />
      <textarea
        name="content"
        required
        maxLength={2000}
        rows={4}
        placeholder="¿Qué quieres compartir?"
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none',
          boxShadow: 'var(--shadow-input)', background: 'var(--bg)',
          fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none',
          resize: 'none', fontFamily: 'inherit',
        }}
      />
      {error && (
        <p style={{ fontSize: 13, fontWeight: 600, color: '#c0392b' }}>{error}</p>
      )}
      <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
        <button
          type="button"
          onClick={() => { setOpen(false); setError(null); }}
          style={{
            padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer',
            fontWeight: 700, fontSize: 13, color: 'var(--text-3)', background: 'var(--bg-inset)',
          }}
        >
          Cancelar
        </button>
        <button
          type="submit"
          disabled={pending}
          style={{
            padding: '9px 18px', borderRadius: 8, border: 'none',
            cursor: pending ? 'not-allowed' : 'pointer',
            fontWeight: 700, fontSize: 13, color: 'white',
            background: pending ? 'var(--text-4)' : 'var(--brand)',
            boxShadow: pending ? 'none' : 'var(--shadow-btn-brand)',
          }}
        >
          {pending ? 'Publicando...' : 'Publicar'}
        </button>
      </div>
    </form>
  );
}

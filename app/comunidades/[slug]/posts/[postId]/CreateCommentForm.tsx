'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createComment } from '../../../actions';

interface Props {
  postId: string;
  communitySlug: string;
}

export function CreateCommentForm({ postId, communitySlug }: Props) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createComment(postId, communitySlug, formData);

    if (result && 'error' in result) {
      setError(result.error);
      setPending(false);
    } else {
      formRef.current?.reset();
      setPending(false);
      router.refresh();
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}
    >
      <div style={{ flex: 1 }}>
        <textarea
          name="content"
          required
          maxLength={1000}
          rows={2}
          placeholder="Añade un comentario..."
          style={{
            width: '100%', padding: '10px 14px', borderRadius: 10, border: 'none',
            boxShadow: 'var(--shadow-input)', background: 'var(--bg-card)',
            fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none',
            resize: 'none', fontFamily: 'inherit',
          }}
        />
        {error && (
          <p style={{ fontSize: 12, fontWeight: 600, color: '#c0392b', marginTop: 4 }}>{error}</p>
        )}
      </div>
      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '10px 16px', borderRadius: 10, border: 'none',
          cursor: pending ? 'not-allowed' : 'pointer', flexShrink: 0,
          fontWeight: 700, fontSize: 13, color: 'white',
          background: pending ? 'var(--text-4)' : 'var(--brand)',
          boxShadow: pending ? 'none' : 'var(--shadow-btn-brand)',
        }}
      >
        {pending ? '...' : 'Comentar'}
      </button>
    </form>
  );
}

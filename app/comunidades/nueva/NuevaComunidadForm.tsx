'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { createCommunity } from '../actions';

interface Category { id: string; name: string; }

export function NuevaComunidadForm({ categories }: { categories: Category[] }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const result = await createCommunity(formData);

    if ('error' in result) {
      setError(result.error);
      setPending(false);
    } else {
      router.push(`/comunidades/${result.slug}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
          Nombre *
        </label>
        <input
          name="name"
          required
          maxLength={60}
          placeholder="Ej: Amantes del Eurogame"
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none',
            boxShadow: 'var(--shadow-input)', background: 'var(--bg-card)',
            fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none',
          }}
        />
      </div>

      <div>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
          Descripción
        </label>
        <textarea
          name="description"
          maxLength={280}
          rows={3}
          placeholder="De qué va esta comunidad..."
          style={{
            width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none',
            boxShadow: 'var(--shadow-input)', background: 'var(--bg-card)',
            fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none', resize: 'none',
            fontFamily: 'inherit',
          }}
        />
      </div>

      {categories.length > 0 && (
        <div>
          <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 8 }}>
            Categoría relacionada{' '}
            <span style={{ fontWeight: 500, color: 'var(--text-4)' }}>(opcional)</span>
          </label>
          <select
            name="category_id"
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 10, border: 'none',
              boxShadow: 'var(--shadow-input)', background: 'var(--bg-card)',
              fontSize: 14, fontWeight: 500, color: 'var(--text)', outline: 'none',
              appearance: 'none', cursor: 'pointer',
            }}
          >
            <option value="">Sin categoría específica</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
      )}

      {error && (
        <p style={{ fontSize: 13, fontWeight: 600, color: '#c0392b', padding: '10px 14px', borderRadius: 8, background: 'rgba(192,57,43,0.08)' }}>
          {error}
        </p>
      )}

      <button
        type="submit"
        disabled={pending}
        style={{
          padding: '13px', borderRadius: 10, border: 'none', cursor: pending ? 'not-allowed' : 'pointer',
          fontWeight: 700, fontSize: 15, color: 'white',
          background: pending ? 'var(--text-4)' : 'var(--brand)',
          boxShadow: pending ? 'none' : 'var(--shadow-btn-brand)',
          transition: 'background 0.15s',
        }}
      >
        {pending ? 'Creando...' : 'Crear comunidad'}
      </button>
    </form>
  );
}

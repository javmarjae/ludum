'use client';

import { useState } from 'react';
import { Nav } from '@/components/Nav';
import { createGroup } from '@/app/grupos/actions';

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 16, color: 'var(--text)', width: '100%', padding: '12px 16px',
  fontSize: 15, fontWeight: 500, outline: 'none', fontFamily: 'inherit',
};

export default function NuevoGrupoPage() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(''); setLoading(true);
    const result = await createGroup(formData);
    if (result?.error) { setError(result.error); setLoading(false); }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/grupos', label: 'Mis grupos' }} />

      <main style={{ maxWidth: 440, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ borderRadius: 32, padding: 32, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>Crear grupo</h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
            Se generará un código de invitación automáticamente.
          </p>

          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Nombre del grupo</label>
              <input name="name" type="text" required placeholder="Ej: Los Dados Locos" style={inputStyle} />
            </div>
            {error && (
              <p style={{ fontSize: 13, borderRadius: 16, padding: '10px 14px', fontWeight: 600, background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.2)' }}>
                {error}
              </p>
            )}
            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 999, fontWeight: 800, fontSize: 16,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Creando...' : 'Crear grupo'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

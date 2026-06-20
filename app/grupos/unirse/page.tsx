'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';
import { joinGroup } from '@/app/grupos/actions';

export default function UnirseGrupoPage() {
  const router = useRouter();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(formData: FormData) {
    setError(''); setLoading(true);
    const result = await joinGroup(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    } else if (result?.groupId) {
      router.push(`/grupos/${result.groupId}`);
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/grupos', label: 'Mis grupos' }} />

      <main style={{ maxWidth: 440, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ borderRadius: 32, padding: 32, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <h1 style={{ fontSize: 28, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>Unirse a un grupo</h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
            Introduce el código que te ha dado el administrador.
          </p>

          <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Código de invitación</label>
              <input name="code" type="text" required placeholder="AB12CD" maxLength={6}
                style={{
                  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
                  borderRadius: 16, color: 'var(--text)', width: '100%', padding: '12px 16px',
                  fontSize: 24, fontWeight: 700, outline: 'none', fontFamily: 'monospace',
                  textTransform: 'uppercase', letterSpacing: '0.25em', textAlign: 'center',
                }}
                onChange={(e) => (e.target.value = e.target.value.toUpperCase())}
              />
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
              {loading ? 'Uniéndome...' : 'Unirse al grupo'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

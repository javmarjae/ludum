'use client';

import { useEffect, useState } from 'react';
import type { EmailOtpType } from '@supabase/supabase-js';
import { createClient } from '@/lib/supabase/client';
import { Nav } from '@/components/Nav';

const inputStyle = {
  background: 'var(--bg-inset)',
  boxShadow: 'var(--shadow-input)',
  border: '1px solid var(--border)',
  borderRadius: 8,
  color: 'var(--text)',
  width: '100%',
  padding: '12px 16px',
  fontSize: 15,
  fontWeight: 500,
  outline: 'none',
  fontFamily: 'inherit',
};

export default function UpdatePasswordPage() {
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [verifying, setVerifying] = useState(true);

  useEffect(() => {
    let active = true;

    async function prepareRecoverySession() {
      const supabase = createClient();
      const url = new URL(window.location.href);
      const hashParams = new URLSearchParams(url.hash.startsWith('#') ? url.hash.slice(1) : '');

      const code = url.searchParams.get('code');
      const tokenHash = url.searchParams.get('token_hash');
      const type = url.searchParams.get('type') as EmailOtpType | null;
      const accessToken = hashParams.get('access_token');
      const refreshToken = hashParams.get('refresh_token');
      const hashType = hashParams.get('type');

      let authError: string | null = null;

      if (code) {
        const { error } = await supabase.auth.exchangeCodeForSession(code);
        authError = error?.message ?? null;
      } else if (tokenHash && type) {
        const { error } = await supabase.auth.verifyOtp({ token_hash: tokenHash, type });
        authError = error?.message ?? null;
      } else if (accessToken && refreshToken && hashType === 'recovery') {
        const { error } = await supabase.auth.setSession({
          access_token: accessToken,
          refresh_token: refreshToken,
        });
        authError = error?.message ?? null;
      }

      if (!authError) {
        const cleanUrl = new URL(window.location.href);
        cleanUrl.searchParams.delete('code');
        cleanUrl.searchParams.delete('token_hash');
        cleanUrl.searchParams.delete('type');
        cleanUrl.searchParams.delete('next');
        cleanUrl.hash = '';
        window.history.replaceState({}, '', `${cleanUrl.pathname}${cleanUrl.search}`);
      }

      const { data: { session } } = await supabase.auth.getSession();
      if (!session && !authError) {
        authError = 'missing-session';
      }

      if (!active) return;

      setError(authError ? 'El enlace de recuperación no es válido o ha caducado. Solicita uno nuevo.' : '');
      setVerifying(false);
    }

    void prepareRecoverySession();

    return () => {
      active = false;
    };
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (verifying) return;
    setError('');
    if (password !== confirm) {
      setError('Las contraseñas no coinciden.');
      return;
    }
    if (password.length < 6) {
      setError('La contraseña debe tener al menos 6 caracteres.');
      return;
    }
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.updateUser({ password });
    setLoading(false);
    if (error) {
      setError('No se pudo actualizar la contraseña. El enlace puede haber caducado.');
    } else {
      window.location.href = '/grupos';
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav />
      <main style={{ maxWidth: 400, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ borderRadius: 12, padding: 32, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
            Nueva contraseña
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
            {verifying ? 'Estamos validando tu enlace de recuperación...' : 'Elige una contraseña segura para tu cuenta.'}
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="update-password" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Nueva contraseña</label>
              <input
                id="update-password"
                type="password" required value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="update-password-confirm" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Confirmar contraseña</label>
              <input
                id="update-password-confirm"
                type="password" required value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                placeholder="••••••••" style={inputStyle}
              />
            </div>

            {error && (
              <p style={{ fontSize: 13, borderRadius: 8, padding: '10px 14px', fontWeight: 600, background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading || verifying} style={{
              width: '100%', padding: '14px', borderRadius: 999, fontWeight: 800, fontSize: 16,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading || verifying ? 0.6 : 1,
            }}>
              {verifying ? 'Validando enlace...' : loading ? 'Guardando...' : 'Guardar contraseña'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

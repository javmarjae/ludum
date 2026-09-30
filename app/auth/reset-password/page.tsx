'use client';

import { useState } from 'react';
import Link from 'next/link';
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

export default function ResetPasswordPage() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/update-password`,
    });
    setLoading(false);
    if (error) {
      setError('No se pudo enviar el correo. Inténtalo de nuevo.');
    } else {
      setSent(true);
    }
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav />
      <div className="auth-wrap">
        <div className="auth-card">
          <h1 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>
            Restablecer contraseña
          </h1>

          {sent ? (
            <div>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24, lineHeight: 1.6 }}>
                Te hemos enviado un enlace a <strong>{email}</strong>. Revisa tu bandeja de entrada y sigue las instrucciones.
              </p>
              <Link href="/auth/login" style={{
                display: 'block', textAlign: 'center', padding: '14px', borderRadius: 10,
                fontWeight: 700, fontSize: 15, color: 'var(--text-2)', background: 'var(--bg-inset)',
                boxShadow: 'var(--shadow-btn)', textDecoration: 'none',
              }}>
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
                Introduce tu email y te enviaremos un enlace para restablecer tu contraseña.
              </p>
              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div>
                  <label htmlFor="reset-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
                  <input
                    id="reset-email"
                    type="email" autoComplete="email" inputMode="email" autoCapitalize="none" required value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com" style={inputStyle}
                  />
                </div>

                {error && (
                  <p role="alert" className="form-error">
                    {error}
                  </p>
                )}

                <button type="submit" disabled={loading} style={{
                  width: '100%', padding: '14px', borderRadius: 10, fontWeight: 800, fontSize: 16,
                  color: 'var(--on-brand)', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
                  border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
                }}>
                  {loading ? 'Enviando...' : 'Enviar enlace'}
                </button>

                <Link href="/auth/login" className="tap" style={{ textAlign: 'center', fontSize: 14, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none' }}>
                  Volver al inicio de sesión
                </Link>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

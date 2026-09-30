'use client';

import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';
import { Nav } from '@/components/Nav';
import { safeNext } from '@/lib/safe-next';

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

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const next = safeNext(searchParams.get('next'));
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    setLoading(true);
    const supabase = createClient();
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setError('Email o contraseña incorrectos.');
      setPassword('');
      setLoading(false);
    } else {
      // Navegación completa (no router.push): garantiza que el servidor ve las
      // cookies de sesión recién escritas y evita render con caché de router
      // obsoleta (bounce a /auth/login?next=… justo tras iniciar sesión).
      window.location.assign(next);
    }
  }

  return (
    <div className="auth-card">
      <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>Iniciar sesión</h1>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
        ¿No tienes cuenta?{' '}
        <Link href="/auth/signup" style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Regístrate gratis</Link>
      </p>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div>
          <label htmlFor="login-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
          <input id="login-email" type="email" autoComplete="email" inputMode="email" autoCapitalize="none" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} />
        </div>
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
            <label htmlFor="login-password" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Contraseña</label>
            <Link href="/auth/reset-password" className="tap" style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none', margin: '-12px 0' }}>¿Olvidaste tu contraseña?</Link>
          </div>
          <input id="login-password" type="password" autoComplete="current-password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" style={inputStyle} />
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
          {loading ? 'Entrando...' : 'Entrar'}
        </button>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav />
      <div className="auth-wrap">
        <Suspense fallback={<div className="auth-card" style={{ minHeight: 200 }} />}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  );
}

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

export default function SignupPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(''); setLoading(true);
    if (password.length < 6) { setError('La contraseña debe tener al menos 6 caracteres.'); setLoading(false); return; }
    const supabase = createClient();
    const { error } = await supabase.auth.signUp({ email, password, options: { data: { display_name: displayName } } });
    if (error) { setError(error.message); setLoading(false); } else { setDone(true); }
  }

  if (done) {
    return (
      <div style={{ background: 'transparent', minHeight: '100vh' }}>
        <Nav />
        <main style={{ maxWidth: 400, margin: '0 auto', padding: '80px 24px' }}>
          <div style={{ textAlign: 'center', borderRadius: 12, padding: 40, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ fontSize: 48, marginBottom: 16 }}>📬</div>
            <h2 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Revisa tu email</h2>
            <p style={{ fontWeight: 500, color: 'var(--text-3)', marginBottom: 0 }}>
              Te hemos enviado un enlace a <strong style={{ color: 'var(--text)' }}>{email}</strong>.
            </p>
            <Link href="/auth/login" style={{ display: 'inline-block', marginTop: 24, fontSize: 14, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
              Ir al login →
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav />

      <main style={{ maxWidth: 400, margin: '0 auto', padding: '64px 24px 80px' }}>
        <div style={{ borderRadius: 12, padding: 32, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>Crear cuenta</h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 28 }}>
            ¿Ya tienes cuenta?{' '}
            <Link href="/auth/login" style={{ fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>Inicia sesión</Link>
          </p>

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label htmlFor="signup-name" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Nombre</label>
              <input id="signup-name" type="text" required value={displayName} onChange={(e) => setDisplayName(e.target.value)} placeholder="Tu nombre" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="signup-email" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Email</label>
              <input id="signup-email" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="tu@email.com" style={inputStyle} />
            </div>
            <div>
              <label htmlFor="signup-password" style={{ display: 'block', fontSize: 13, fontWeight: 700, color: 'var(--text-2)', marginBottom: 6 }}>Contraseña</label>
              <input id="signup-password" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Mínimo 6 caracteres" style={inputStyle} />
            </div>

            {error && (
              <p style={{ fontSize: 13, borderRadius: 8, padding: '10px 14px', fontWeight: 600, background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(62,94,59,0.2)' }}>
                {error}
              </p>
            )}

            <button type="submit" disabled={loading} style={{
              width: '100%', padding: '14px', borderRadius: 999, fontWeight: 800, fontSize: 16,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', opacity: loading ? 0.6 : 1,
            }}>
              {loading ? 'Creando...' : 'Crear cuenta'}
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}

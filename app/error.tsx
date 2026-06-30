'use client';

import { useEffect } from 'react';
import Link from 'next/link';

// Error boundary global: evita la pantalla de error por defecto de Next y ofrece
// recuperación ("Reintentar") sin recargar toda la app.
export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('[app/error]', error);
  }, [error]);

  return (
    <div style={{ minHeight: '70vh', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '48px 24px' }}>
      <div style={{ textAlign: 'center', maxWidth: 420 }}>
        <p style={{ fontSize: 64, marginBottom: 12 }}>🎲</p>
        <h1 style={{ fontSize: 'clamp(24px, 5vw, 32px)', fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 10 }}>
          Algo ha salido mal
        </h1>
        <p style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6, marginBottom: 28 }}>
          Ha ocurrido un error inesperado. Puedes reintentar o volver al inicio.
        </p>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'center', flexWrap: 'wrap' }}>
          <button onClick={reset} style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>
            Reintentar
          </button>
          <Link href="/" style={{ padding: '12px 24px', borderRadius: 10, fontWeight: 700, fontSize: 15, color: 'var(--text-2)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', textDecoration: 'none' }}>
            Ir al inicio
          </Link>
        </div>
      </div>
    </div>
  );
}

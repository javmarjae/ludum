'use client';

import { useEffect, useState } from 'react';

const STORAGE_KEY = 'ludum-beta-banner-seen';
const AUTO_DISMISS_MS = 7000;

export function BetaBanner() {
  const [visible, setVisible] = useState(false);
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (sessionStorage.getItem(STORAGE_KEY)) return;
    const t = setTimeout(() => setVisible(true), 800);
    return () => clearTimeout(t);
  }, []);

  function dismiss() {
    setLeaving(true);
    sessionStorage.setItem(STORAGE_KEY, '1');
    setTimeout(() => setVisible(false), 400);
  }

  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(dismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(t);
  }, [visible]);

  if (!visible) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 88,
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 9999,
        maxWidth: 420,
        width: 'calc(100vw - 32px)',
        background: 'var(--bg-card)',
        border: '1.5px solid var(--border)',
        borderRadius: 16,
        boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
        padding: '14px 16px 14px 18px',
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        animation: leaving
          ? 'beta-banner-out 0.3s cubic-bezier(0.5,0,0.75,0) forwards'
          : 'beta-banner-in 0.45s cubic-bezier(0.16,1,0.3,1) forwards',
      }}
    >
      {/* Icono */}
      <div style={{
        flexShrink: 0,
        width: 36,
        height: 36,
        borderRadius: 10,
        background: 'var(--brand-tint)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 18,
      }}>
        ⚙️
      </div>

      {/* Texto */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: 'var(--text)', marginBottom: 2, lineHeight: 1.3 }}>
          Ajustando el rendimiento
        </p>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.4 }}>
          Estamos en proceso de lanzamiento. Puede haber pequeños ajustes hasta tener la versión final lista.
        </p>
      </div>

      {/* Cerrar */}
      <button
        onClick={dismiss}
        aria-label="Cerrar"
        style={{
          flexShrink: 0,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: 'var(--text-4)',
          fontSize: 18,
          lineHeight: 1,
          padding: 4,
          borderRadius: 6,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'color 0.12s',
        }}
        onMouseEnter={e => (e.currentTarget.style.color = 'var(--text)')}
        onMouseLeave={e => (e.currentTarget.style.color = 'var(--text-4)')}
      >
        ×
      </button>

      {/* Barra de progreso */}
      <div style={{
        position: 'absolute',
        bottom: 0,
        left: 0,
        height: 3,
        borderRadius: '0 0 16px 16px',
        background: 'var(--brand)',
        animation: `beta-progress ${AUTO_DISMISS_MS}ms linear forwards`,
        width: '100%',
      }} />

      <style>{`
        @keyframes beta-banner-in {
          from { opacity: 0; transform: translateX(-50%) translateY(16px); }
          to   { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes beta-banner-out {
          from { opacity: 1; transform: translateX(-50%) translateY(0); }
          to   { opacity: 0; transform: translateX(-50%) translateY(12px); }
        }
        @keyframes beta-progress {
          from { width: 100%; }
          to   { width: 0%; }
        }
      `}</style>
    </div>
  );
}

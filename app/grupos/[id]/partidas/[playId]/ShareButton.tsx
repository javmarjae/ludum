'use client';
import { useState } from 'react';

export function ShareButton({ playId }: { playId: string }) {
  const [copied, setCopied] = useState(false);

  async function handleShare() {
    const url = `${window.location.origin}/partidas/${playId}`;
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      window.prompt('Copia este enlace:', url);
    }
  }

  return (
    <button
      onClick={handleShare}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '9px 18px', borderRadius: 999, border: 'none', cursor: 'pointer',
        fontSize: 13, fontWeight: 700,
        background: copied ? 'var(--brand-tint)' : 'var(--bg-card)',
        color: copied ? 'var(--brand)' : 'var(--text-2)',
        boxShadow: 'var(--shadow-btn)',
        transition: 'background 0.2s, color 0.2s',
      }}
    >
      {copied ? '✓ ¡Enlace copiado!' : '↗ Compartir partida'}
    </button>
  );
}

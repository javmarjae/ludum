'use client';

import { useState } from 'react';

export function CopyButton({ text, label }: { text: string; label?: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback for browsers without clipboard API
      const el = document.createElement('textarea');
      el.value = text;
      document.body.appendChild(el);
      el.select();
      document.execCommand('copy');
      document.body.removeChild(el);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <button
      onClick={copy}
      style={{
        fontSize: label ? 13 : 11,
        fontWeight: 700,
        padding: label ? '8px 14px' : '3px 10px',
        borderRadius: 999,
        background: copied ? 'var(--brand-tint)' : 'var(--bg-inset)',
        color: copied ? 'var(--brand)' : 'var(--text-3)',
        border: copied ? '1px solid rgba(62,94,59,0.2)' : '1px solid var(--border)',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
        boxShadow: label ? 'var(--shadow-btn)' : 'none',
        whiteSpace: 'nowrap' as const,
      }}
    >
      {copied ? (label ? '¡Copiado! ✓' : '¡Copiado! ✓') : (label ?? 'Copiar')}
    </button>
  );
}

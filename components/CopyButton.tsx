'use client';

import { useState } from 'react';

export function CopyButton({ text }: { text: string }) {
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
        fontSize: 11, fontWeight: 700, padding: '3px 10px', borderRadius: 999,
        background: copied ? 'var(--brand-tint)' : 'var(--bg-inset)',
        color: copied ? 'var(--brand)' : 'var(--text-3)',
        border: copied ? '1px solid rgba(62,94,59,0.2)' : '1px solid transparent',
        cursor: 'pointer', fontFamily: 'inherit', transition: 'all 0.15s',
      }}
    >
      {copied ? '¡Copiado! ✓' : 'Copiar'}
    </button>
  );
}

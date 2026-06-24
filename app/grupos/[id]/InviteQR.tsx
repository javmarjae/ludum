'use client';

import { useState } from 'react';

interface Props {
  inviteCode: string;
  groupName: string;
}

export function InviteQR({ inviteCode, groupName }: Props) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const joinUrl = `/grupos/unirse?code=${inviteCode}`;
  const absoluteJoinUrl = typeof window !== 'undefined'
    ? `${window.location.origin}${joinUrl}`
    : joinUrl;
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(absoluteJoinUrl)}&bgcolor=F5F0E8&color=3E5E3B&margin=10`;

  async function copyCode() {
    await navigator.clipboard.writeText(inviteCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{
          fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999,
          background: 'var(--bg-inset)', border: 'none', color: 'var(--text-3)',
          cursor: 'pointer', fontFamily: 'inherit',
        }}
      >
        QR de invitación
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 24, padding: 24, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center', marginTop: 12 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <p style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>Invitar al grupo</p>
        <button onClick={() => setOpen(false)} style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-4)', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}>✕</button>
      </div>

      {/* QR */}
      <div style={{ display: 'inline-block', borderRadius: 16, overflow: 'hidden', marginBottom: 16, boxShadow: 'var(--shadow-card)' }}>
        <img src={qrUrl} alt={`QR de invitación a ${groupName}`} width={200} height={200} style={{ display: 'block' }} />
      </div>

      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)', marginBottom: 14 }}>
        Escanea el QR o comparte el código
      </p>

      {/* Código + copiar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'center' }}>
        <span style={{ fontFamily: 'monospace', fontWeight: 800, fontSize: 20, letterSpacing: '0.08em', color: 'var(--brand)' }}>
          {inviteCode}
        </span>
        <button
          onClick={copyCode}
          style={{
            fontSize: 12, fontWeight: 700, padding: '6px 14px', borderRadius: 999,
            background: copied ? 'var(--brand-tint)' : 'var(--bg-inset)',
            color: copied ? 'var(--brand)' : 'var(--text-3)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
            transition: 'all 0.15s',
          }}
        >
          {copied ? 'Copiado ✓' : 'Copiar'}
        </button>
      </div>
    </div>
  );
}

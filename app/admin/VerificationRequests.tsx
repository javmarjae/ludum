'use client';

import { useState } from 'react';
import Image from 'next/image';
import { approveVerification, rejectVerification } from './actions';

const CATEGORY_LABELS: Record<string, string> = {
  creador_contenido: 'Creador de contenido',
  periodista:        'Periodista / crítico',
  disenador:         'Diseñador / editor',
  tienda:            'Tienda / distribuidora',
  asociacion:        'Asociación / club',
  organizador:       'Organizador de torneos',
  otro:              'Otro',
};

interface VerificationRequest {
  id: string;
  user_id: string;
  reason: string;
  category: string;
  social_links: Record<string, string>;
  created_at: string;
  email?: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export function VerificationRequests({ requests }: { requests: VerificationRequest[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  const pending = requests.filter(r => !done.has(r.id));

  async function handleApprove(id: string) {
    setBusy(id);
    await approveVerification(id);
    setDone(prev => new Set(prev).add(id));
    setBusy(null);
  }

  async function handleReject(id: string) {
    if (rejectingId !== id) {
      setRejectingId(id);
      setRejectNote('');
      return;
    }
    setBusy(id);
    await rejectVerification(id, rejectNote || undefined);
    setDone(prev => new Set(prev).add(id));
    setBusy(null);
    setRejectingId(null);
  }

  if (pending.length === 0) {
    return (
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', padding: '20px 0' }}>
        No hay solicitudes de verificación pendientes.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      {pending.map(req => {
        const name = req.profiles?.display_name ?? 'Usuario';
        const isBusy = busy === req.id;
        const isRejecting = rejectingId === req.id;
        const socialEntries = Object.entries(req.social_links ?? {}).filter(([, v]) => v);

        return (
          <div key={req.id} style={{ borderRadius: 14, padding: '18px 20px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            {/* Header */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 14 }}>
              {req.profiles?.avatar_url ? (
                <Image src={req.profiles.avatar_url} alt={name} width={44} height={44} style={{ borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
              ) : (
                <div style={{ width: 44, height: 44, borderRadius: '50%', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, color: 'white', background: 'linear-gradient(135deg, #89BA86, #3E5E3B)' }}>
                  {name[0]?.toUpperCase()}
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{name}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginBottom: 4 }}>
                  {req.email && <span style={{ fontFamily: 'monospace' }}>{req.email}</span>}
                  {req.email && ' · '}
                  {new Date(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                <p>
                  <span style={{ display: 'inline-block', padding: '1px 8px', borderRadius: 20, background: 'var(--brand-tint)', color: 'var(--brand)', fontSize: 11, fontWeight: 700 }}>
                    {CATEGORY_LABELS[req.category] ?? req.category}
                  </span>
                </p>
              </div>
            </div>

            {/* Reason */}
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6, marginBottom: socialEntries.length ? 10 : 14, padding: '10px 14px', borderRadius: 8, background: 'var(--bg-inset)' }}>
              {req.reason}
            </p>

            {/* Social links */}
            {socialEntries.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 14 }}>
                {socialEntries.map(([key, val]) => (
                  <a
                    key={key}
                    href={val.startsWith('http') ? val : `https://${val}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', background: 'var(--brand-tint)', padding: '3px 10px', borderRadius: 20, textDecoration: 'none' }}
                  >
                    {key}: {val}
                  </a>
                ))}
              </div>
            )}

            {/* Reject note input */}
            {isRejecting && (
              <textarea
                value={rejectNote}
                onChange={e => setRejectNote(e.target.value)}
                placeholder="Motivo del rechazo (se enviará al usuario)..."
                rows={2}
                style={{ width: '100%', marginBottom: 10, padding: '8px 12px', borderRadius: 8, border: 'none', boxSizing: 'border-box', boxShadow: 'var(--shadow-input)', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 500, color: 'var(--text)', outline: 'none', resize: 'none', fontFamily: 'inherit' }}
              />
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleApprove(req.id)}
                disabled={isBusy || isRejecting}
                style={{ padding: '7px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: 'white', background: '#16a34a', border: 'none', cursor: 'pointer', opacity: (isBusy || isRejecting) ? 0.5 : 1, fontFamily: 'inherit' }}
              >
                {isBusy && !isRejecting ? '...' : '✓ Aprobar'}
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={isBusy}
                style={{ padding: '7px 18px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: 'none', cursor: 'pointer', opacity: isBusy ? 0.5 : 1, fontFamily: 'inherit' }}
              >
                {isBusy && isRejecting ? '...' : isRejecting ? 'Confirmar rechazo' : 'Rechazar'}
              </button>
              {isRejecting && (
                <button
                  onClick={() => setRejectingId(null)}
                  disabled={isBusy}
                  style={{ padding: '7px 12px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: 'var(--text-4)', background: 'var(--bg-inset)', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

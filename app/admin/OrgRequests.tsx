'use client';

import { useState } from 'react';
import { approveOrgRequest, rejectOrgRequest } from './actions';

interface OrgRequest {
  id: string;
  name: string;
  type: string;
  description: string | null;
  location: string | null;
  website: string | null;
  created_at: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export function OrgRequests({ requests }: { requests: OrgRequest[] }) {
  const [busy, setBusy] = useState<string | null>(null);
  const [done, setDone] = useState<Set<string>>(new Set());

  async function handleApprove(id: string) {
    setBusy(id);
    await approveOrgRequest(id);
    setDone(prev => new Set(prev).add(id));
    setBusy(null);
  }

  async function handleReject(id: string) {
    setBusy(id);
    await rejectOrgRequest(id);
    setDone(prev => new Set(prev).add(id));
    setBusy(null);
  }

  const pending = requests.filter(r => !done.has(r.id));

  if (pending.length === 0) {
    return (
      <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', padding: '20px 0' }}>
        No hay solicitudes pendientes.
      </p>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      {pending.map(req => {
        const requesterName = req.profiles?.display_name ?? 'Usuario';
        const isBusy = busy === req.id;
        return (
          <div key={req.id} style={{ borderRadius: 14, padding: '16px 18px', background: 'var(--bg-card)', border: '1px solid var(--border)' }}>
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 12 }}>
              <div style={{ width: 40, height: 40, borderRadius: 12, flexShrink: 0, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>
                {req.type === 'tienda' ? '🏪' : '🎲'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontWeight: 800, fontSize: 15, color: 'var(--text)', marginBottom: 2 }}>{req.name}</p>
                <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>
                  {req.type === 'tienda' ? 'Tienda' : 'Asociación'}
                  {req.location ? ` · ${req.location}` : ''}
                  {' · Solicitado por '}
                  <strong>{requesterName}</strong>
                  {' · '}
                  {new Date(req.created_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                </p>
                {req.description && (
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginTop: 6, lineHeight: 1.5 }}>
                    {req.description}
                  </p>
                )}
                {req.website && (
                  <a href={req.website} target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none', display: 'inline-block', marginTop: 4 }}>
                    🌐 {req.website.replace(/^https?:\/\//, '')}
                  </a>
                )}
              </div>
            </div>
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                onClick={() => handleApprove(req.id)}
                disabled={isBusy}
                style={{ padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: 'white', background: '#16a34a', border: 'none', cursor: 'pointer', opacity: isBusy ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                {isBusy ? '...' : 'Aprobar'}
              </button>
              <button
                onClick={() => handleReject(req.id)}
                disabled={isBusy}
                style={{ padding: '7px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13, color: '#dc2626', background: 'rgba(220,38,38,0.08)', border: 'none', cursor: 'pointer', opacity: isBusy ? 0.6 : 1, fontFamily: 'inherit' }}
              >
                Rechazar
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}

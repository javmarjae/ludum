'use client';

import { useState } from 'react';
import { addStaffMember, removeStaffMember } from './actions';

interface Member {
  profile_id: string;
  role: string;
  profiles: { display_name: string | null; avatar_url: string | null } | null;
}

export function ManageStaff({ orgId, members, isAdmin }: { orgId: string; members: Member[]; isAdmin: boolean }) {
  const [username, setUsername] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'error' | 'success'>('idle');
  const [msg, setMsg] = useState('');

  async function handleAdd() {
    const trimmed = username.trim();
    if (!trimmed) return;
    setStatus('loading');
    setMsg('');
    const res = await addStaffMember(orgId, trimmed);
    if (res?.error) { setStatus('error'); setMsg(res.error); }
    else { setStatus('success'); setMsg('Empleado añadido'); setUsername(''); }
  }

  async function handleRemove(profileId: string) {
    await removeStaffMember(orgId, profileId);
  }

  return (
    <div>
      {/* Staff list */}
      {members.length === 0 ? (
        <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)', marginBottom: 16 }}>
          Sin empleados todavía.
        </p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6, marginBottom: 16 }}>
          {members.map((m) => {
            const name = m.profiles?.display_name ?? 'Usuario';
            const avatar = m.profiles?.avatar_url;
            return (
              <div key={m.profile_id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 14px', borderRadius: 12, background: 'var(--bg-inset)' }}>
                {avatar ? (
                  <img src={avatar} alt={name} loading="lazy" decoding="async" style={{ width: 32, height: 32, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }} />
                ) : (
                  <div style={{ width: 32, height: 32, borderRadius: '50%', flexShrink: 0, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--brand)' }}>
                    {name[0].toUpperCase()}
                  </div>
                )}
                <span style={{ flex: 1, fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
                <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', background: 'var(--bg-card)', padding: '2px 8px', borderRadius: 20 }}>
                  {m.role === 'admin' ? 'Admin' : 'Empleado'}
                </span>
                {isAdmin && (
                  <form action={() => handleRemove(m.profile_id)}>
                    <button type="submit" style={{ fontSize: 12, fontWeight: 700, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: '2px 6px' }}>
                      Eliminar
                    </button>
                  </form>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Add employee */}
      {isAdmin && (
        <div style={{ display: 'flex', gap: 8 }}>
          <input
            type="text"
            placeholder="Nombre de usuario en Ludum"
            value={username}
            onChange={(e) => { setUsername(e.target.value); setStatus('idle'); setMsg(''); }}
            onKeyDown={(e) => e.key === 'Enter' && status !== 'loading' && handleAdd()}
            disabled={status === 'loading'}
            style={{
              flex: 1, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
              border: '1px solid var(--border)', borderRadius: 8,
              color: 'var(--text)', padding: '9px 14px', fontSize: 13,
              fontWeight: 500, outline: 'none', fontFamily: 'inherit',
            }}
          />
          <button
            onClick={handleAdd}
            disabled={status === 'loading' || !username.trim()}
            style={{
              padding: '9px 16px', borderRadius: 8, fontWeight: 700, fontSize: 13,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
              opacity: (status === 'loading' || !username.trim()) ? 0.6 : 1,
            }}
          >
            {status === 'loading' ? '...' : 'Añadir'}
          </button>
        </div>
      )}

      {msg && (
        <p style={{
          marginTop: 8, fontSize: 12, fontWeight: 600, padding: '6px 10px', borderRadius: 8,
          background: status === 'error' ? 'rgba(220,38,38,0.08)' : 'var(--brand-tint)',
          color: status === 'error' ? '#dc2626' : 'var(--brand)',
        }}>
          {msg}
        </p>
      )}
    </div>
  );
}

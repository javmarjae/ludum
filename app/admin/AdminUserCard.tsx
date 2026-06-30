'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { setUserPermission } from './actions';

type Permission = 'can_write_blog' | 'can_create_events' | 'is_admin';

interface AdminUser {
  id: string;
  display_name: string | null;
  email: string;
  avatar_url: string | null;
  is_admin: boolean;
  can_write_blog: boolean;
  can_create_events: boolean;
}

export function AdminUserCard({ user, currentUserId, index }: { user: AdminUser; currentUserId: string; index?: number }) {
  const [perms, setPerms] = useState<Pick<AdminUser, Permission>>({
    is_admin: user.is_admin,
    can_write_blog: user.can_write_blog,
    can_create_events: user.can_create_events,
  });
  const [, startTransition] = useTransition();
  const isSelf = user.id === currentUserId;

  function toggle(field: Permission) {
    const next = !perms[field];
    setPerms(prev => ({ ...prev, [field]: next }));
    startTransition(async () => {
      try {
        await setUserPermission(user.id, field, next);
      } catch {
        setPerms(prev => ({ ...prev, [field]: !next }));
      }
    });
  }

  const initials = ((user.display_name || user.email) ?? '?')[0]?.toUpperCase() ?? '?';

  return (
    <div className={index !== undefined ? 'stagger-in' : undefined} style={{
      ...(index !== undefined ? { ['--stagger-i' as any]: index } : {}),
      background: 'var(--bg-card)',
      border: '1px solid var(--border)',
      borderRadius: 14,
      padding: '14px 18px',
      display: 'flex',
      alignItems: 'center',
      gap: 14,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: '50%',
        background: 'var(--bg-inset)', overflow: 'hidden', flexShrink: 0,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 17, color: 'var(--text-3)', fontWeight: 700,
      }}>
        {user.avatar_url
          ? <Image src={user.avatar_url} alt="" width={42} height={42} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
          : initials}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {user.display_name || '(sin nombre)'}
          </span>
          {isSelf && (
            <span style={{ fontSize: 10, background: 'var(--brand)', color: 'white', borderRadius: 6, padding: '1px 6px', flexShrink: 0 }}>
              Tú
            </span>
          )}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-4)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {user.email}
        </div>
      </div>

      <div style={{ display: 'flex', gap: 16, alignItems: 'center', flexShrink: 0 }}>
        <Toggle label="Blog" active={perms.can_write_blog} onToggle={() => toggle('can_write_blog')} disabled={isSelf} />
        <Toggle label="Eventos" active={perms.can_create_events} onToggle={() => toggle('can_create_events')} disabled={isSelf} />
        <Toggle label="Admin" active={perms.is_admin} onToggle={() => toggle('is_admin')} disabled={isSelf} danger />
      </div>
    </div>
  );
}

function Toggle({ label, active, onToggle, disabled, danger }: {
  label: string;
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
  danger?: boolean;
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button
        type="button"
        onClick={onToggle}
        disabled={disabled}
        title={disabled ? 'No puedes modificar tu propio rol' : `${active ? 'Revocar' : 'Conceder'} permiso de ${label}`}
        style={{
          width: 40, height: 22, borderRadius: 11, border: 'none',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: active ? (danger ? '#c0392b' : 'var(--brand)') : 'var(--bg-inset)',
          transition: 'background 0.2s',
          position: 'relative', padding: 0,
          opacity: disabled ? 0.45 : 1,
        }}
      >
        <span style={{
          position: 'absolute', top: 3,
          left: active ? 21 : 3,
          width: 16, height: 16, borderRadius: '50%', background: 'white',
          transition: 'left 0.2s',
          boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
        }} />
      </button>
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', letterSpacing: '0.04em' }}>
        {label.toUpperCase()}
      </span>
    </div>
  );
}

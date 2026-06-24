'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';

export interface SelectorGroup {
  id: string;
  name: string;
  memberCount: number;
}

interface Props {
  groups: SelectorGroup[];
  activeGroupId: string | null;
}

export function GroupSelector({ groups, activeGroupId }: Props) {
  const router = useRouter();

  return (
    <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
      {groups.map((group) => {
        const active = group.id === activeGroupId;
        return (
          <button
            key={group.id}
            onClick={() => router.push(`/recomendador?grupo=${group.id}`)}
            style={{
              flexShrink: 0,
              borderRadius: 16,
              padding: '14px 16px',
              border: active ? '1.5px solid var(--brand)' : '1.5px solid var(--border)',
              background: active ? 'var(--brand-tint)' : 'var(--bg-card)',
              cursor: 'pointer',
              fontFamily: 'inherit',
              display: 'flex',
              alignItems: 'center',
              gap: 10,
              minWidth: 160,
              position: 'relative',
              boxShadow: 'var(--shadow-card)',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: '50%',
                background: active ? 'var(--brand)' : 'var(--bg-inset)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 16,
                flexShrink: 0,
                color: active ? 'white' : 'var(--text-3)',
              }}
            >
              {active ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2.5 7L5.5 10L11.5 4" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : (
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="9" cy="7" r="4" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M16 3.13a4 4 0 0 1 0 7.75" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </div>
            <div style={{ textAlign: 'left' }}>
              <div
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: active ? 'var(--brand)' : 'var(--text)',
                }}
              >
                {group.name}
              </div>
              <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>
                {group.memberCount} miembro{group.memberCount !== 1 ? 's' : ''}
              </div>
            </div>
            {active && (
              <div
                style={{
                  position: 'absolute',
                  top: 8,
                  right: 10,
                  width: 20,
                  height: 20,
                  borderRadius: '50%',
                  background: 'var(--brand)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                  <path d="M1.5 5L4 7.5L8.5 2.5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            )}
          </button>
        );
      })}

      <Link
        href="/grupos"
        style={{
          flexShrink: 0,
          borderRadius: 16,
          padding: '14px 16px',
          border: '1.5px dashed var(--border)',
          background: 'transparent',
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 160,
          textDecoration: 'none',
        }}
      >
        <div
          style={{
            width: 36,
            height: 36,
            borderRadius: '50%',
            background: 'var(--bg-inset)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 20,
            color: 'var(--brand)',
            flexShrink: 0,
          }}
        >
          +
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>
            Nueva partida
          </div>
          <div style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>
            Crear desde cero
          </div>
        </div>
      </Link>
    </div>
  );
}

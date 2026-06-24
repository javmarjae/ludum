'use client';

import { useState } from 'react';
import { joinCommunity, leaveCommunity } from '../actions';

interface Props {
  communityId: string;
  communitySlug: string;
  isMember: boolean;
}

export function JoinButton({ communityId, communitySlug, isMember: initialIsMember }: Props) {
  const [isMember, setIsMember] = useState(initialIsMember);
  const [pending, setPending] = useState(false);

  async function handleClick() {
    setPending(true);
    if (isMember) {
      await leaveCommunity(communityId);
      setIsMember(false);
    } else {
      await joinCommunity(communityId);
      setIsMember(true);
    }
    setPending(false);
  }

  return (
    <button
      onClick={handleClick}
      disabled={pending}
      style={{
        padding: '9px 18px', borderRadius: 10, border: isMember ? '1.5px solid var(--border)' : 'none',
        cursor: pending ? 'not-allowed' : 'pointer', flexShrink: 0,
        fontWeight: 700, fontSize: 13,
        color: isMember ? 'var(--text-3)' : 'white',
        background: isMember ? 'var(--bg-card)' : 'var(--brand)',
        boxShadow: isMember ? 'var(--shadow-btn)' : 'var(--shadow-btn-brand)',
        transition: 'background 0.15s, color 0.15s',
      }}
    >
      {pending ? '...' : isMember ? 'Salir' : 'Unirse'}
    </button>
  );
}

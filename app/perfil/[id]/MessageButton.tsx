'use client';
import { startConversation } from '@/app/mensajes/actions';
import { useTransition } from 'react';

export function MessageButton({ profileId }: { profileId: string }) {
  const [pending, startTransition] = useTransition();

  return (
    <form action={() => startTransition(() => startConversation(profileId))}>
      <button
        type="submit"
        disabled={pending}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '9px 18px', borderRadius: 999, border: 'none', cursor: pending ? 'default' : 'pointer',
          fontSize: 13, fontWeight: 700,
          background: 'var(--bg-inset)', color: 'var(--text-2)',
          boxShadow: 'var(--shadow-btn)',
          opacity: pending ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}
      >
        <ChatSvg />
        {pending ? 'Abriendo...' : 'Mensaje'}
      </button>
    </form>
  );
}

function ChatSvg() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

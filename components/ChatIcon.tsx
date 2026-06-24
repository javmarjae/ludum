'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function ChatIcon() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const isActive = pathname.startsWith('/mensajes');

  useEffect(() => {
    const supabase = createClient();

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { data } = await supabase.rpc('get_total_unread_messages');
        setUnread(Number(data ?? 0));
      } catch {
        // chat table may not exist yet
      }
    }

    init();
  }, []);

  useEffect(() => {
    if (isActive) setUnread(0);
  }, [isActive]);

  return (
    <Link
      href="/mensajes"
      style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        gap: 5, padding: '7px 6px', borderRadius: 12, textDecoration: 'none', width: 66,
      }}
    >
      <div style={{
        width: 46, height: 46, borderRadius: 13, display: 'flex', alignItems: 'center',
        justifyContent: 'center', position: 'relative',
        background: isActive ? 'var(--brand)' : 'transparent',
        color: isActive ? 'white' : 'var(--text-3)',
        transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
        boxShadow: isActive ? '0 4px 12px rgba(62,94,59,0.38)' : 'none',
      }}>
        <ChatSvg />
        {unread > 0 && (
          <span style={{
            position: 'absolute', top: 7, right: 7,
            minWidth: 16, height: 16, borderRadius: 8,
            background: '#ef4444', border: '2px solid var(--bg-card)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 9, fontWeight: 800, color: 'white', lineHeight: 1, padding: '0 3px',
          }}>
            {unread > 9 ? '9+' : unread}
          </span>
        )}
      </div>
      <span style={{
        fontSize: 9, fontWeight: 700, textAlign: 'center', letterSpacing: '0.03em', lineHeight: 1.2,
        color: isActive ? 'var(--brand)' : 'var(--text-4)',
      }}>
        Chat
      </span>
    </Link>
  );
}

function ChatSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
    </svg>
  );
}

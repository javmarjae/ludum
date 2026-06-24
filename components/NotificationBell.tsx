'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';

export function NotificationBell() {
  const [unread, setUnread] = useState(0);
  const pathname = usePathname();
  const isActive = pathname === '/notificaciones';

  useEffect(() => {
    const supabase = createClient();
    let channel: ReturnType<typeof supabase.channel> | null = null;

    async function init() {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        const { count } = await supabase
          .from('notifications')
          .select('id', { count: 'exact', head: true })
          .eq('user_id', user.id)
          .eq('read', false);

        setUnread(count ?? 0);

        channel = supabase
          .channel(`notif-bell-${user.id}`)
          .on('postgres_changes', {
            event: 'INSERT', schema: 'public', table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          }, () => {
            setUnread(prev => prev + 1);
          })
          .on('postgres_changes', {
            event: 'UPDATE', schema: 'public', table: 'notifications',
            filter: `user_id=eq.${user.id}`,
          }, async () => {
            const { count: c } = await supabase
              .from('notifications')
              .select('id', { count: 'exact', head: true })
              .eq('user_id', user.id)
              .eq('read', false);
            setUnread(c ?? 0);
          })
          .subscribe();
      } catch {
        // notifications table may not exist yet
      }
    }

    init();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (isActive) setUnread(0);
  }, [isActive]);

  return (
    <Link
      href="/notificaciones"
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
        <BellSvg />
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
        Noti
      </span>
    </Link>
  );
}

function BellSvg() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
      <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
    </svg>
  );
}

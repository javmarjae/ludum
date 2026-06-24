'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/client';

export function SidebarUserAvatar() {
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [initial, setInitial] = useState('?');

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (!user) return;
      supabase
        .from('profiles')
        .select('display_name, avatar_url')
        .eq('id', user.id)
        .single()
        .then(({ data }) => {
          if (!data) return;
          setInitial((data.display_name ?? user.email ?? '?')[0].toUpperCase());
          setAvatarUrl((data as any).avatar_url ?? null);
        });
    });
  }, []);

  return (
    <Link
      href="/perfil"
      title="Tu perfil"
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '7px 6px', borderRadius: 12, textDecoration: 'none', width: 66 }}
    >
      {avatarUrl ? (
        <img
          src={avatarUrl}
          alt="Tu perfil"
          style={{ width: 46, height: 46, borderRadius: '50%', objectFit: 'cover', flexShrink: 0 }}
        />
      ) : (
        <div style={{
          width: 46, height: 46, borderRadius: '50%', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 17, fontWeight: 800, color: 'white',
          background: 'linear-gradient(135deg, #89BA86, #3E5E3B)',
        }}>
          {initial}
        </div>
      )}
      <span style={{ fontSize: 9, fontWeight: 700, color: 'var(--text-4)', textAlign: 'center', letterSpacing: '0.03em', lineHeight: 1.2 }}>
        Tu perfil
      </span>
    </Link>
  );
}

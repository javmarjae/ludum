import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { Avatar } from '@/components/Avatar';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Notificaciones' };

export default async function NotificacionesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: notifs } = await supabase
    .from('notifications')
    .select('id, type, read, created_at, reference_id, actor:profiles!actor_id(id, display_name, avatar_url)')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .limit(50);

  const notifications = notifs ?? [];

  // Fetch play details for new_play_in_group notifications
  const playIds = notifications
    .filter(n => n.type === 'new_play_in_group' && n.reference_id)
    .map(n => n.reference_id as string);

  const { data: playsRaw } = playIds.length > 0
    ? await supabase
        .from('plays')
        .select('id, group_id, groups(id, name), games(name, image_url)')
        .in('id', playIds)
    : { data: [] };

  const playMap = Object.fromEntries((playsRaw ?? []).map((p: any) => [p.id, p]));

  // Mark all unread as read
  if (notifications.some(n => !n.read)) {
    await supabase
      .from('notifications')
      .update({ read: true })
      .eq('user_id', user.id)
      .eq('read', false);
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <AppNav back={{ href: '/', label: 'Inicio' }} />

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        <h1 style={{ fontSize: 26, fontWeight: 800, color: 'var(--text)', marginBottom: 24, letterSpacing: '-0.02em' }}>
          Notificaciones
        </h1>

        {notifications.length === 0 ? (
          <div style={{ borderRadius: 24, padding: 40, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 8 }}>🔔</p>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 4 }}>Sin notificaciones</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
              Aquí aparecerán tus notificaciones cuando alguien te siga o registre una partida en tu grupo.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {notifications.map(n => {
              const wasUnread = !n.read;
              const actor = (n.actor as any);
              const actorName = actor?.display_name ?? 'Alguien';
              const actorId = actor?.id;
              const actorAvatar = actor?.avatar_url ?? null;

              if (n.type === 'new_follower') {
                return (
                  <a
                    key={n.id}
                    href={actorId ? `/perfil/${actorId}` : '/perfil'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      borderRadius: 20, padding: '14px 18px',
                      background: wasUnread ? 'var(--brand-tint, rgba(62,94,59,0.07))' : 'var(--bg-card)',
                      boxShadow: 'var(--shadow-card)', textDecoration: 'none',
                      borderLeft: wasUnread ? '3px solid var(--brand)' : '3px solid transparent',
                    }}
                  >
                    <Avatar name={actorName} src={actorAvatar} size={44} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>
                        <strong>{actorName}</strong> te ha seguido
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>
                        {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>👤</span>
                  </a>
                );
              }

              if (n.type === 'new_play_in_group') {
                const play = n.reference_id ? (playMap[n.reference_id] as any) : null;
                const gameName = play?.games?.name ?? 'un juego';
                const gameImage = play?.games?.image_url;
                const groupName = play?.groups?.name ?? 'tu grupo';
                const groupId = play?.group_id;

                return (
                  <a
                    key={n.id}
                    href={groupId && n.reference_id ? `/grupos/${groupId}/partidas/${n.reference_id}` : '/grupos'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 14,
                      borderRadius: 20, padding: '14px 18px',
                      background: wasUnread ? 'var(--brand-tint, rgba(62,94,59,0.07))' : 'var(--bg-card)',
                      boxShadow: 'var(--shadow-card)', textDecoration: 'none',
                      borderLeft: wasUnread ? '3px solid var(--brand)' : '3px solid transparent',
                    }}
                  >
                    {gameImage ? (
                      <Image src={gameImage} alt={gameName} width={44} height={44} style={{ borderRadius: 14, objectFit: 'cover', flexShrink: 0 }} />
                    ) : (
                      <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 22, background: 'var(--bg-inset)' }}>
                        🎲
                      </div>
                    )}
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 14, color: 'var(--text)', lineHeight: 1.4 }}>
                        <strong>{actorName}</strong> ha registrado una partida de <strong>{gameName}</strong>
                      </p>
                      <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>
                        {groupName} · {formatRelativeTime(n.created_at)}
                      </p>
                    </div>
                    <span style={{ fontSize: 18, flexShrink: 0 }}>🎮</span>
                  </a>
                );
              }

              return null;
            })}
          </div>
        )}
      </main>
    </div>
  );
}

function formatRelativeTime(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'Ahora mismo';
  if (mins < 60) return `Hace ${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `Hace ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `Hace ${days}d`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Suspense } from 'react';
import { ChatLayout } from './ChatLayout';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Mensajes' };

export default async function MensajesPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: conversations } = await supabase.rpc('get_my_conversations');

  const convs = (conversations ?? []).map((c: any) => ({
    id:                   c.id,
    other_user_id:        c.other_user_id,
    other_user_name:      c.other_user_name ?? 'Usuario',
    other_user_avatar:    c.other_user_avatar ?? null,
    last_message_content: c.last_message_content ?? null,
    last_message_at:      c.last_message_at ?? null,
    last_message_sender:  c.last_message_sender ?? null,
    unread_count:         Number(c.unread_count ?? 0),
  }));

  return (
    <Suspense>
      <ChatLayout initialConversations={convs} userId={user.id} />
    </Suspense>
  );
}

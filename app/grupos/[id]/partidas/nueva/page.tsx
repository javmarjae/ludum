import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { NuevaPartidaForm } from './NuevaPartidaForm';

interface Props {
  params: Promise<{ id: string }>;
}

export default async function NuevaPartidaPage({ params }: Props) {
  const { id: groupId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: group } = await supabase.from('groups').select('id, name').eq('id', groupId).single();
  if (!group) notFound();

  const { data: membership } = await supabase.from('group_members').select('group_id').eq('group_id', groupId).eq('profile_id', user.id).single();
  if (!membership) redirect('/grupos');

  const { data: collection } = await supabase.from('group_games').select('game_id, games(id, name, image_url, min_playtime, max_playtime)').eq('group_id', groupId);
  const { data: members } = await supabase.from('group_members').select('profile_id, profiles(id, display_name)').eq('group_id', groupId);

  const games = collection?.map((c) => c.games).filter(Boolean) ?? [];
  const memberList = members?.map((m) => m.profiles).filter(Boolean) ?? [];

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/grupos/${groupId}`, label: group.name }} />

      <main style={{ maxWidth: 580, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6 }}>Registrar partida</h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>¿A qué jugasteis? ¿Quién ganó?</p>
        </div>

        {games.length === 0 ? (
          <div style={{ borderRadius: 24, padding: 40, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>📦</p>
            <p style={{ fontWeight: 700, color: 'var(--text)', marginBottom: 8 }}>Sin juegos en la colección</p>
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>
              Añade juegos a la colección del grupo antes de registrar una partida.
            </p>
            <Link href={`/grupos/${groupId}/coleccion`} style={{
              display: 'inline-flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 999,
              fontSize: 14, fontWeight: 700, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Ir a la colección →
            </Link>
          </div>
        ) : (
          <NuevaPartidaForm groupId={groupId} games={games as any[]} members={memberList as any[]} />
        )}
      </main>
    </div>
  );
}

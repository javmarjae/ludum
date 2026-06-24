import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import type { Metadata } from 'next';

const PAGE_SIZE = 20;

interface Props {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; q?: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data } = await supabase.from('groups').select('name').eq('id', id).single();
  return { title: data?.name ? `Partidas de ${data.name}` : 'Partidas' };
}

export default async function GroupPlaysPage({ params, searchParams }: Props) {
  const { id: groupId } = await params;
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const [{ data: group }, { data: membership }] = await Promise.all([
    supabase.from('groups').select('id, name').eq('id', groupId).single(),
    supabase.from('group_members').select('group_id').eq('group_id', groupId).eq('profile_id', user.id).single(),
  ]);

  if (!group) notFound();
  if (!membership) redirect('/grupos');

  let query = supabase
    .from('plays')
    .select('id, played_at, is_public, games(name, image_url, bgg_id), play_results(is_winner, profile_id, guest_name, profiles(display_name))', { count: 'exact' })
    .eq('group_id', groupId)
    .order('played_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  const { data: plays, count } = await query;

  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const allPlays = plays ?? [];

  const inputStyle = {
    background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
    borderRadius: 16, color: 'var(--text)', padding: '12px 16px', fontSize: 15,
    fontWeight: 500, outline: 'none', fontFamily: 'inherit', flex: 1,
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <AppNav back={{ href: `/grupos/${groupId}`, label: group.name }} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Partidas
          </h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
            {group.name} · {count ?? 0} partida{(count ?? 0) !== 1 ? 's' : ''}
          </p>
        </div>

        {allPlays.length === 0 ? (
          <div style={{ borderRadius: 32, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎲</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Sin partidas todavía</p>
            <Link href={`/grupos/${groupId}/partidas/nueva`} style={{
              display: 'inline-flex', padding: '12px 24px', borderRadius: 999, fontSize: 14, fontWeight: 700,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none',
            }}>
              Registrar primera partida →
            </Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allPlays.map((play: any) => {
              const winner = play.play_results?.find((r: any) => r.is_winner);
              const winnerName = winner?.profiles?.display_name ?? winner?.guest_name ?? null;
              return (
                <Link key={play.id} href={`/grupos/${groupId}/partidas/${play.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 22, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textDecoration: 'none' }}>
                  {play.games?.image_url
                    ? <Image src={play.games.image_url} alt={play.games.name} width={44} height={44} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {play.games?.name ?? 'Juego desconocido'}
                      </p>
                      {!play.is_public && (
                        <span style={{ fontSize: 10, flexShrink: 0, color: 'var(--text-4)' }}>🔒</span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                      {new Date(play.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                      {winnerName && <span> · 🏆 {winnerName}</span>}
                    </p>
                  </div>
                  <span style={{ color: 'var(--text-4)', fontSize: 16, flexShrink: 0 }}>›</span>
                </Link>
              );
            })}
          </div>
        )}

        {/* Paginación */}
        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {page > 1 && (
              <Link href={`/grupos/${groupId}/partidas?page=${page - 1}`} style={{
                padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', color: 'var(--text-2)', textDecoration: 'none',
              }}>
                ← Anterior
              </Link>
            )}
            <span style={{ padding: '10px 16px', fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
              {page} / {totalPages}
            </span>
            {page < totalPages && (
              <Link href={`/grupos/${groupId}/partidas?page=${page + 1}`} style={{
                padding: '10px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', color: 'white', textDecoration: 'none',
              }}>
                Siguiente →
              </Link>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

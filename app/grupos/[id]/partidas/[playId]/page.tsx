import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { ShareButton } from './ShareButton';
import { PlayActions } from './PlayActions';
import { GameRatingProvider } from '@/app/juegos/[id]/GameRatingContext';
import { StarRating } from '@/app/juegos/[id]/StarRating';

interface Props {
  params: Promise<{ id: string; playId: string }>;
}

export default async function PlayDetailPage({ params }: Props) {
  const { id: groupId, playId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: membership } = await supabase
    .from('group_members').select('group_id')
    .eq('group_id', groupId).eq('profile_id', user.id).single();
  if (!membership) redirect('/grupos');

  const { data: play } = await supabase
    .from('plays')
    .select('id, played_at, notes, created_by, is_public, games(id, name, image_url, bgg_id), play_results(id, profile_id, guest_name, score, is_winner, profiles(display_name))')
    .eq('id', playId)
    .eq('group_id', groupId)
    .single();
  if (!play) notFound();

  const { data: group } = await supabase.from('groups').select('name, owner_id').eq('id', groupId).single();

  const results = ((play as any).play_results ?? []).sort((a: any, b: any) => {
    if (a.is_winner && !b.is_winner) return -1;
    if (!a.is_winner && b.is_winner) return 1;
    if (a.score != null && b.score != null) return b.score - a.score;
    return 0;
  });

  const game = (play as any).games;
  const date = new Date(play.played_at).toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });
  const canEdit = (play as any).created_by === user.id || (group as any)?.owner_id === user.id;
  const isPublic: boolean = (play as any).is_public ?? false;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/grupos/${groupId}/partidas`, label: 'Partidas' }} />
      <GameRatingProvider gameId={game?.id ?? ''}>

      <main style={{ maxWidth: 560, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Cabecera juego */}
        <div style={{ borderRadius: 32, padding: 24, marginBottom: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', display: 'flex', gap: 16, alignItems: 'center' }}>
          {game?.image_url
            ? <Image src={game.image_url} alt={game.name} width={72} height={72} style={{ borderRadius: 16, objectFit: 'cover', flexShrink: 0 }} />
            : <div style={{ width: 72, height: 72, borderRadius: 16, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 32, background: 'var(--bg-inset)' }}>🎲</div>
          }
          <div style={{ flex: 1, minWidth: 0 }}>
            {game?.bgg_id ? (
              <Link href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none' }}>
                <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--brand)', marginBottom: 4 }}>
                  {game?.name ?? 'Partida'}
                </h1>
              </Link>
            ) : (
              <h1 style={{ fontSize: 22, fontWeight: 800, letterSpacing: '-0.01em', color: 'var(--text)', marginBottom: 4 }}>
                {game?.name ?? 'Partida'}
              </h1>
            )}
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', textTransform: 'capitalize' }}>{date}</p>
          </div>
        </div>

        {/* Resultados */}
        <section style={{ marginBottom: 20 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Resultados</h2>
          <div style={{ borderRadius: 24, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            {results.length === 0 ? (
              <p style={{ padding: '24px 20px', fontSize: 14, color: 'var(--text-3)', textAlign: 'center' }}>Sin resultados registrados.</p>
            ) : results.map((r: any, i: number) => {
              const name = r.profiles?.display_name ?? r.guest_name ?? 'Invitado';
              return (
                <div key={r.id} style={{
                  display: 'flex', alignItems: 'center', gap: 14,
                  padding: '14px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none',
                  background: r.is_winner ? 'var(--brand-tint)' : 'transparent',
                }}>
                  <div style={{
                    width: 32, height: 32, borderRadius: '50%', flexShrink: 0,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 13, fontWeight: 800,
                    background: r.is_winner ? 'linear-gradient(135deg, #89BA86, #3E5E3B)' : 'var(--bg-inset)',
                    color: r.is_winner ? 'white' : 'var(--text-4)',
                    boxShadow: r.is_winner ? '0 2px 8px rgba(62,94,59,0.2)' : 'none',
                  }}>
                    {r.is_winner ? '🏆' : i + 1}
                  </div>
                  <span style={{ flex: 1, fontWeight: 700, fontSize: 15, color: r.is_winner ? 'var(--brand)' : 'var(--text)' }}>{name}</span>
                  {r.score != null && (
                    <span style={{ fontSize: 18, fontWeight: 800, color: r.is_winner ? 'var(--brand)' : 'var(--text-3)' }}>
                      {r.score}
                    </span>
                  )}
                </div>
              );
            })}
          </div>
        </section>

        {/* Notas + acciones (editar/eliminar/visibilidad) — solo para creador o admin */}
        {canEdit ? (
          <PlayActions playId={playId} groupId={groupId} initialNotes={(play as any).notes ?? ''} initialIsPublic={isPublic} />
        ) : (play as any).notes ? (
          <section style={{ marginBottom: 20 }}>
            <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>Notas</h2>
            <div style={{ borderRadius: 24, padding: '16px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{(play as any).notes}</p>
            </div>
          </section>
        ) : null}

        {/* Valorar el juego */}
        {game?.id && (
          <section style={{ marginBottom: 20 }}>
            <StarRating gameId={game.id} />
          </section>
        )}

        {/* Compartir — solo si la partida es pública */}
        {isPublic && (
          <div style={{ display: 'flex', justifyContent: 'center', marginTop: 20 }}>
            <ShareButton playId={playId} />
          </div>
        )}
      </main>
      </GameRatingProvider>
    </div>
  );
}

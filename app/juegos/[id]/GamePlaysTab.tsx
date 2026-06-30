import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function StarDisplay() {
  return (
    <div style={{ display: 'flex', gap: 1 }}>
      {[0, 1, 2, 3, 4].map(i => (
        <span key={i} style={{ fontSize: 14, color: 'var(--sand)', lineHeight: 1 }}>★</span>
      ))}
    </div>
  );
}

export async function GamePlaysTab({ gameId, gameName, userId }: { gameId: number; gameName: string; userId: string }) {
  const supabase = await createClient();

  const { data: playsData } = await supabase
    .from('plays')
    .select('id, played_at, group_id, groups(name), play_results!inner(profile_id, is_winner, score)')
    .eq('game_id', gameId)
    .eq('play_results.profile_id', userId)
    .order('played_at', { ascending: false })
    .limit(20);

  const userPlays = (playsData ?? []) as any[];

  const playIds = userPlays.map((p: any) => p.id);
  let winnersByPlay: Record<string, string> = {};
  if (playIds.length > 0) {
    const { data: winnerRows } = await supabase
      .from('play_results')
      .select('play_id, profile_id, guest_name, profiles(display_name)')
      .in('play_id', playIds)
      .eq('is_winner', true);

    for (const r of winnerRows ?? []) {
      winnersByPlay[(r as any).play_id] = (r as any).profile_id
        ? ((r as any).profiles?.display_name ?? 'Jugador')
        : ((r as any).guest_name ?? 'Invitado');
    }
  }

  if (userPlays.length === 0) {
    return (
      <div style={{ textAlign: 'center', padding: '64px 0' }}>
        <p style={{ fontSize: 32, marginBottom: 12 }}>🎲</p>
        <p className="t-section-title" style={{ marginBottom: 6 }}>Sin partidas de {gameName}</p>
        <p className="t-card-sub">Registra una partida desde tu grupo</p>
      </div>
    );
  }

  return (
    <div>
      {userPlays.map((play: any, i: number) => {
        const userResult = (play.play_results ?? [])[0] as any;
        const winnerName = winnersByPlay[play.id] ?? null;
        const dateStr = new Date(play.played_at).toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });

        return (
          <Link
            key={play.id}
            href={`/grupos/${play.group_id}/partidas/${play.id}`}
            className="stagger-in"
            style={{
              ['--stagger-i' as any]: i,
              display: 'flex', alignItems: 'center', gap: 16,
              padding: '20px 0', borderBottom: '1px solid var(--border)',
              textDecoration: 'none',
            }}
          >
            <div style={{
              width: 64, height: 64, borderRadius: 14, flexShrink: 0,
              background: 'var(--bg-inset)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28,
            }}>
              🎲
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p className="t-card-title" style={{ marginBottom: 4 }}>
                {play.groups?.name ?? 'Partida'}
              </p>
              <p className="t-meta">
                {dateStr}
                {winnerName ? ` · Ganador: ${winnerName}` : ''}
              </p>
              {userResult?.score != null && (
                <p className="t-meta" style={{ marginTop: 3 }}>
                  Puntuación: {userResult.score > 0 ? '+' : ''}{userResult.score} ptos.
                </p>
              )}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
              <StarDisplay />
              <span style={{ fontSize: 18, color: 'var(--text-4)' }}>♡</span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

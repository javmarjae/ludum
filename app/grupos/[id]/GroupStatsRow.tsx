import { createClient } from '@/lib/supabase/server';
import Link from 'next/link';

function StatCard({ value, label, link, sub }: {
  value: string;
  label: string;
  link?: { href: string; text: string };
  sub?: string;
}) {
  return (
    <div style={{ borderRadius: 20, padding: '18px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <p className="grupo-stat-value" style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', letterSpacing: '-0.02em', marginBottom: 3, lineHeight: 1 }}>
        {value}
      </p>
      <p style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', marginBottom: sub || link ? 8 : 0 }}>
        {label}
      </p>
      {sub && (
        <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginBottom: link ? 6 : 0 }}>
          {sub}
        </p>
      )}
      {link && (
        <Link href={link.href} style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
          {link.text} →
        </Link>
      )}
    </div>
  );
}

export async function GroupStatsRow({ groupId }: { groupId: string }) {
  const supabase = await createClient();

  const [{ data: collection }, { data: allPlayStats, count: totalPlaysCount }] = await Promise.all([
    supabase.from('group_games').select('game_id').eq('group_id', groupId),
    supabase.from('plays')
      .select('game_id, duration_minutes, games(min_playtime, max_playtime), play_results(score)', { count: 'exact' })
      .eq('group_id', groupId)
      .limit(500),
  ]);

  const collectionCount = collection?.length ?? 0;
  const totalPlays = totalPlaysCount ?? 0;

  let bestScore: { score: number } | null = null;
  (allPlayStats ?? []).forEach((play: any) => {
    (play.play_results ?? []).forEach((r: any) => {
      if (r.score !== null && r.score !== undefined && (bestScore === null || r.score > bestScore.score)) {
        bestScore = { score: r.score };
      }
    });
  });

  const gameCount: Record<string, number> = {};
  (allPlayStats ?? []).forEach((play: any) => {
    if (play.game_id) gameCount[play.game_id] = (gameCount[play.game_id] ?? 0) + 1;
  });
  const repeatedPlays = Object.values(gameCount).filter(c => c > 1).reduce((sum, c) => sum + c, 0);
  const sampleSize = allPlayStats?.length ?? 0;
  const repeatedPercent = sampleSize > 0 ? Math.round((repeatedPlays / sampleSize) * 100) : 0;

  const durationsForAvg: number[] = [];
  (allPlayStats ?? []).forEach((play: any) => {
    if (play.duration_minutes != null) {
      durationsForAvg.push(play.duration_minutes);
    } else if (play.games?.min_playtime != null || play.games?.max_playtime != null) {
      const min = play.games.min_playtime ?? play.games.max_playtime;
      const max = play.games.max_playtime ?? play.games.min_playtime;
      durationsForAvg.push(Math.round((min + max) / 2));
    }
  });
  const avgDuration = durationsForAvg.length > 0
    ? Math.round(durationsForAvg.reduce((sum, d) => sum + d, 0) / durationsForAvg.length)
    : null;

  return (
    <div className="grupo-stats" style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: 14, marginBottom: 28 }}>
      <StatCard
        value={collectionCount.toString()}
        label="Juegos en posesión"
        link={{ href: `/grupos/${groupId}/coleccion`, text: 'Ver colección' }}
      />
      <StatCard
        value={totalPlays.toString()}
        label="Partidas jugadas"
        link={{ href: `/grupos/${groupId}/stats`, text: 'Ver estadísticas' }}
      />
      <StatCard
        value={bestScore ? `${(bestScore as any).score} pts` : '—'}
        label="Mejor puntuación"
        sub={bestScore ? 'Récord del grupo' : 'Sin puntuaciones'}
      />
      <StatCard
        value={`${repeatedPercent}%`}
        label="Juegos repetidos"
        sub={`${repeatedPlays} de ${sampleSize} partidas`}
      />
      <StatCard
        value={avgDuration != null ? `${avgDuration} min` : '—'}
        label="Tiempo medio de partida"
        sub={avgDuration != null ? `Sobre ${durationsForAvg.length} partidas` : 'Sin datos aún'}
      />
    </div>
  );
}

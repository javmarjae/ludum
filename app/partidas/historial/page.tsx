import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Historial de partidas' };

const PAGE_SIZE = 20;

interface Props {
  searchParams: Promise<{ page?: string; q?: string }>;
}

export default async function HistorialPage({ searchParams }: Props) {
  const { page: pageParam, q } = await searchParams;
  const page = Math.max(1, parseInt(pageParam ?? '1'));
  const offset = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login?next=/partidas/historial');

  let query = supabase
    .from('plays')
    .select('id, played_at, group_id, games(name, image_url, bgg_id), groups(id, name), play_results!inner(profile_id, is_winner)', { count: 'exact' })
    .eq('play_results.profile_id', user.id)
    .order('played_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (q && q.trim().length >= 2) {
    query = query.ilike('games.name', `%${q.trim()}%`);
  }

  const { data: plays, count } = await query;
  const totalPages = Math.ceil((count ?? 0) / PAGE_SIZE);
  const allPlays = plays ?? [];
  const totalWins = allPlays.filter((p: any) => p.play_results?.some((r: any) => r.is_winner)).length;

  const inputStyle = {
    background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
    borderRadius: 8, color: 'var(--text)', padding: '12px 16px', fontSize: 15,
    fontWeight: 500, outline: 'none', fontFamily: 'inherit', flex: 1,
  };

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 28px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--bg-card)', backdropFilter: 'blur(12px)', position: 'sticky', top: 0, zIndex: 30 }}>
        <Link href="/partidas" style={{ display: 'inline-flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: 'var(--text-3)', textDecoration: 'none', padding: '6px 12px', borderRadius: 8, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}>
          ← Tracker
        </Link>
      </div>

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>
        <div style={{ marginBottom: 28 }}>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Historial de partidas</h1>
          <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)' }}>
            {count ?? 0} partida{(count ?? 0) !== 1 ? 's' : ''} · {totalWins} victoria{totalWins !== 1 ? 's' : ''} en esta página
          </p>
        </div>

        <form method="GET" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 10 }}>
            <input name="q" defaultValue={q} placeholder="Filtrar por juego..." style={inputStyle as any} />
            <button type="submit" style={{
              padding: '12px 20px', borderRadius: 999, fontWeight: 700, fontSize: 14,
              color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
              border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
            }}>
              Buscar
            </button>
            {q && (
              <Link href="/partidas/historial" aria-label="Limpiar filtro de búsqueda" style={{
                padding: '12px 16px', borderRadius: 999, fontWeight: 700, fontSize: 14,
                color: 'var(--text-3)', background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)',
                textDecoration: 'none', flexShrink: 0, display: 'flex', alignItems: 'center',
              }}>
                ✕
              </Link>
            )}
          </div>
        </form>

        {allPlays.length === 0 ? (
          <div style={{ borderRadius: 12, padding: 48, textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <p style={{ fontSize: 32, marginBottom: 12 }}>🎲</p>
            <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
              {q ? `Sin partidas de "${q}"` : 'Sin partidas todavía'}
            </p>
            {!q && <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>Registra tu primera partida en un grupo.</p>}
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {allPlays.map((play: any) => {
              const isWinner = play.play_results?.some((r: any) => r.is_winner);
              return (
                <Link key={play.id} href={`/grupos/${play.group_id}/partidas/${play.id}`} style={{ display: 'flex', alignItems: 'center', gap: 14, borderRadius: 10, padding: '12px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textDecoration: 'none' }}>
                  {play.games?.image_url
                    ? <Image src={play.games.image_url} alt={play.games.name} width={52} height={52} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
                    : <div style={{ width: 52, height: 52, borderRadius: 12, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, background: 'var(--bg-inset)' }}>🎲</div>
                  }
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {play.games?.name ?? 'Juego desconocido'}
                    </p>
                    <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)' }}>
                      {play.groups?.name} · {new Date(play.played_at).toLocaleDateString('es-ES', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  {isWinner && <span style={{ fontSize: 18, flexShrink: 0 }}>🏆</span>}
                  <span style={{ color: 'var(--text-4)', fontSize: 16, flexShrink: 0 }}>›</span>
                </Link>
              );
            })}
          </div>
        )}

        {totalPages > 1 && (
          <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginTop: 32 }}>
            {page > 1 && (
              <Link href={`/partidas/historial?page=${page - 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} style={{
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
              <Link href={`/partidas/historial?page=${page + 1}${q ? `&q=${encodeURIComponent(q)}` : ''}`} style={{
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

import { createClient } from '@/lib/supabase/server';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { AppNav } from '@/components/AppNav';
import { Avatar } from '@/components/Avatar';

interface Props { params: Promise<{ id: string }> }

const FORMAT_LABEL: Record<string, string> = {
  libre: 'Libre', round_robin: 'Round Robin', swiss: 'Sistema Suizo', eliminacion: 'Eliminación directa',
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  borrador:      { label: 'Próximamente', color: '#78716c', bg: '#f5f5f4' },
  inscripciones: { label: 'Inscripciones abiertas', color: '#1d4ed8', bg: '#dbeafe' },
  en_curso:      { label: 'En curso', color: '#15803d', bg: '#dcfce7' },
  finalizado:    { label: 'Finalizado', color: '#374151', bg: '#f3f4f6' },
  cancelado:     { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2' },
};

export default async function TorneoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: tournament } = await supabase
    .from('tournaments')
    .select(`
      *,
      organizations(id, name, type, logo_url, location, website),
      games(id, name, image_url, bgg_id)
    `)
    .eq('id', id)
    .single();

  if (!tournament) notFound();

  // Check if user is organizer
  let isOrganizer = false;
  if (user) {
    const { data: org } = await supabase
      .from('organizations')
      .select('owner_id')
      .eq('id', tournament.organization_id)
      .single();
    isOrganizer = org?.owner_id === user.id;
  }

  const [{ data: participants }, { data: rounds }] = await Promise.all([
    supabase
      .from('tournament_participants')
      .select('id, profile_id, guest_name, placement, status, profiles(display_name, avatar_url)')
      .eq('tournament_id', id)
      .eq('status', 'activo')
      .order('registered_at', { ascending: true }),
    supabase
      .from('tournament_rounds')
      .select(`
        id, round_number, name, status,
        tournament_matches(
          id, status, table_number, completed_at,
          match_results(
            id, participant_id, score, is_winner, placement,
            tournament_participants(id, profile_id, guest_name, profiles(display_name))
          )
        )
      `)
      .eq('tournament_id', id)
      .order('round_number', { ascending: true }),
  ]);

  // Compute standings from match results
  const participantMap = new Map<string, any>();
  (participants ?? []).forEach(p => {
    participantMap.set(p.id, { ...p, wins: 0, losses: 0, played: 0 });
  });

  (rounds ?? []).forEach((round: any) => {
    (round.tournament_matches ?? []).forEach((match: any) => {
      if (match.status !== 'completada') return;
      (match.match_results ?? []).forEach((r: any) => {
        const p = participantMap.get(r.participant_id);
        if (!p) return;
        p.played++;
        if (r.is_winner) p.wins++;
        else p.losses++;
      });
    });
  });

  const standings = Array.from(participantMap.values())
    .sort((a, b) => b.wins - a.wins || a.losses - b.losses);

  const org = (tournament as any).organizations;
  const game = (tournament as any).games;
  const st = STATUS_LABEL[tournament.status] ?? STATUS_LABEL.borrador;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: '/torneos', label: 'Torneos' }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '40px 24px 80px' }}>

        {/* Game cover banner */}
        {game?.image_url && (
          <div style={{ height: 160, borderRadius: 24, overflow: 'hidden', marginBottom: 24, position: 'relative' }}>
            <Image src={game.image_url} alt={game.name} fill sizes="(max-width: 860px) 100vw, 860px" style={{ objectFit: 'cover', filter: 'brightness(0.65)' }} />
            <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'flex-end', padding: '0 24px 20px' }}>
              <span style={{ fontSize: 28, fontWeight: 800, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.4)' }}>{game.name}</span>
            </div>
          </div>
        )}

        {/* Header */}
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: st.color, background: st.bg, padding: '4px 12px', borderRadius: 20 }}>
              {st.label}
            </span>
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', background: 'var(--bg-inset)', padding: '4px 12px', borderRadius: 20 }}>
              {FORMAT_LABEL[tournament.format] ?? tournament.format}
            </span>
          </div>
          <h1 style={{ fontSize: 28, fontWeight: 800, color: 'var(--text)', marginBottom: 8, lineHeight: 1.2 }}>{tournament.name}</h1>

          <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            {tournament.start_date && (
              <span>📅 {new Date(tournament.start_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long', year: 'numeric' })}
                {tournament.end_date && tournament.end_date !== tournament.start_date &&
                  ` – ${new Date(tournament.end_date).toLocaleDateString('es-ES', { day: 'numeric', month: 'long' })}`}
              </span>
            )}
            {tournament.location && <span>📍 {tournament.location}</span>}
            {tournament.max_participants && (
              <span>👥 Máx. {tournament.max_participants} jugadores</span>
            )}
          </div>

          {tournament.description && (
            <p style={{ marginTop: 12, fontSize: 15, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.6 }}>{tournament.description}</p>
          )}

          {tournament.prize_info && (
            <div style={{ marginTop: 12, padding: '10px 16px', borderRadius: 14, background: '#fef9c3', border: '1px solid #fde047' }}>
              <span style={{ fontSize: 14, fontWeight: 600, color: '#854d0e' }}>🏅 {tournament.prize_info}</span>
            </div>
          )}
        </div>

        {/* Organizer info */}
        {org && (
          <Link href={`/organizaciones/${org.id}`} style={{ textDecoration: 'none' }}>
            <div className="hover-scale" style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '16px 20px', borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', marginBottom: 24 }}>
              {org.logo_url
                ? <img src={org.logo_url} alt={org.name} style={{ width: 44, height: 44, borderRadius: 12, objectFit: 'cover' }} />
                : <span style={{ fontSize: 32 }}>{org.type === 'tienda' ? '🏪' : '🎲'}</span>
              }
              <div>
                <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)' }}>{org.name}</p>
                <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>
                  {org.type === 'tienda' ? 'Tienda' : 'Asociación'}
                  {org.location && ` · ${org.location}`}
                </p>
              </div>
              <span style={{ marginLeft: 'auto', color: 'var(--text-4)' }}>›</span>
            </div>
          </Link>
        )}

        {/* Admin link */}
        {isOrganizer && (
          <Link href={`/torneos/${id}/admin`} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 18px', borderRadius: 16, background: 'var(--brand)', color: 'white', textDecoration: 'none', fontWeight: 700, fontSize: 14, marginBottom: 24 }}>
            ⚙️ Panel de administración
          </Link>
        )}

        {/* Standings */}
        {standings.length > 0 && (
          <section style={{ marginBottom: 28 }}>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              {tournament.status === 'finalizado' ? 'Clasificación final' : 'Clasificación'}
            </h2>
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflowX: 'auto' }}>
              <div style={{ minWidth: 400 }}>
              {/* Table header */}
              <div style={{ display: 'grid', gridTemplateColumns: '40px 1fr 50px 50px 50px 50px', gap: 0, padding: '10px 16px', background: 'var(--bg-inset)', borderBottom: '1px solid var(--border)' }}>
                {['#', 'Jugador', 'PJ', 'V', 'D', 'Pts'].map(h => (
                  <span key={h} style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: h === 'Jugador' ? 'left' : 'center' }}>{h}</span>
                ))}
              </div>
              {standings.map((p, i) => {
                const name = p.profiles?.display_name ?? p.guest_name ?? 'Invitado';
                const isFirst = i === 0 && tournament.status === 'finalizado' && p.wins > 0;
                return (
                  <div key={p.id} className="stagger-in" style={{ ['--stagger-i' as any]: i, display: 'grid', gridTemplateColumns: '40px 1fr 50px 50px 50px 50px', gap: 0, padding: '12px 16px', borderTop: i > 0 ? '1px solid var(--border)' : 'none', alignItems: 'center', background: isFirst ? 'rgba(250,204,21,0.08)' : 'transparent' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: i < 3 ? ['#f59e0b','#9ca3af','#c2845a'][i] : 'var(--text-4)', textAlign: 'center' }}>
                      {i === 0 && tournament.status === 'finalizado' ? '🏆' : i + 1}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {p.profile_id
                        ? <Avatar name={name} src={p.profiles?.avatar_url} size={32} />
                        : <div style={{ width: 32, height: 32, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 16 }}>👤</div>
                      }
                      <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
                    </div>
                    {[p.played, p.wins, p.losses, p.wins].map((v, vi) => (
                      <span key={vi} style={{ fontSize: 14, fontWeight: vi === 3 ? 700 : 500, color: vi === 3 ? 'var(--brand)' : 'var(--text-3)', textAlign: 'center' }}>{v}</span>
                    ))}
                  </div>
                );
              })}
              </div>
            </div>
          </section>
        )}

        {/* Rounds & Matches */}
        {(rounds ?? []).length > 0 && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Rondas</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {(rounds as any[]).map(round => {
                const matches = round.tournament_matches ?? [];
                const completedCount = matches.filter((m: any) => m.status === 'completada').length;
                return (
                  <div key={round.id} style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                    <div style={{ padding: '14px 18px', borderBottom: matches.length > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 10 }}>
                      <span style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', flex: 1 }}>{round.name || `Ronda ${round.round_number}`}</span>
                      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)' }}>
                        {completedCount}/{matches.length} completadas
                      </span>
                    </div>
                    {matches.map((match: any, mi: number) => {
                      const results = match.match_results ?? [];
                      const winner = results.find((r: any) => r.is_winner);
                      return (
                        <div key={match.id} style={{ padding: '12px 18px', borderTop: mi > 0 ? '1px solid var(--border)' : 'none', display: 'flex', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                          {match.table_number && (
                            <span style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', minWidth: 48 }}>Mesa {match.table_number}</span>
                          )}
                          <div style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                            {results.map((r: any, ri: number) => {
                              const name = r.tournament_participants?.profiles?.display_name ?? r.tournament_participants?.guest_name ?? 'Jugador';
                              const isWinner = r.is_winner;
                              return (
                                <span key={r.id} style={{ fontSize: 13, fontWeight: isWinner ? 700 : 500, color: isWinner ? 'var(--brand)' : 'var(--text)', background: isWinner ? 'rgba(62,94,59,0.08)' : 'var(--bg-inset)', padding: '4px 12px', borderRadius: 20, display: 'inline-flex', alignItems: 'center', gap: 4 }}>
                                  {isWinner && '🏆 '}{name}
                                  {r.score != null && ` (${r.score})`}
                                </span>
                              );
                            })}
                          </div>
                          <span style={{ fontSize: 11, fontWeight: 600, color: match.status === 'completada' ? 'var(--brand)' : 'var(--text-4)' }}>
                            {match.status === 'completada' ? '✓' : '·'}
                          </span>
                        </div>
                      );
                    })}
                    {matches.length === 0 && (
                      <div style={{ padding: '16px 18px', color: 'var(--text-4)', fontSize: 13, fontWeight: 500 }}>
                        Sin enfrentamientos todavía
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {/* Participants list when no rounds yet */}
        {(rounds ?? []).length === 0 && standings.length > 0 && (
          <section>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>
              Participantes ({standings.length})
            </h2>
            <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              {standings.map((p, i) => {
                const name = p.profiles?.display_name ?? p.guest_name ?? 'Invitado';
                return (
                  <div key={p.id} style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 18px', borderTop: i > 0 ? '1px solid var(--border)' : 'none' }}>
                    {p.profile_id
                      ? <Avatar name={name} src={p.profiles?.avatar_url} size={36} />
                      : <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>👤</div>
                    }
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text)' }}>{name}</span>
                    {!p.profile_id && <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-4)', marginLeft: 'auto' }}>Invitado</span>}
                  </div>
                );
              })}
            </div>
          </section>
        )}

        {tournament.status === 'inscripciones' && (
          <div style={{ marginTop: 28, padding: '20px 24px', borderRadius: 20, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: 16, color: 'var(--text)', marginBottom: 6 }}>¿Quieres participar?</p>
            <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
              Contacta con el organizador para inscribirte.
            </p>
          </div>
        )}
      </main>
    </div>
  );
}

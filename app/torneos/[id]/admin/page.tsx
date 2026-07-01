import { createClient } from '@/lib/supabase/server';
import { notFound, redirect } from 'next/navigation';
import Link from 'next/link';
import { AppNav } from '@/components/AppNav';
import { AddParticipantForm } from './AddParticipantForm';
import { RoundManager } from './RoundManager';
import { StatusControl } from './StatusControl';

interface Props { params: Promise<{ id: string }> }

export default async function AdminTorneoPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/auth/login');

  const { data: tournament } = await supabase
    .from('tournaments')
    .select('*, organizations(id, name, owner_id), games(name, image_url)')
    .eq('id', id)
    .single();

  if (!tournament) notFound();

  // Only org owner can access admin
  const org = (tournament as any).organizations;
  if (org?.owner_id !== user.id) redirect(`/torneos/${id}`);

  const [{ data: participants }, { data: rounds }] = await Promise.all([
    supabase
      .from('tournament_participants')
      .select('id, profile_id, guest_name, status, profiles(display_name, avatar_url)')
      .eq('tournament_id', id)
      .order('registered_at', { ascending: true }),
    supabase
      .from('tournament_rounds')
      .select(`
        id, round_number, name, status,
        tournament_matches(
          id, status, table_number, completed_at,
          match_results(
            id, participant_id, score, is_winner,
            tournament_participants(id, profile_id, guest_name, profiles(display_name))
          )
        )
      `)
      .eq('tournament_id', id)
      .order('round_number', { ascending: true }),
  ]);

  const game = (tournament as any).games;
  const activeParticipants = (participants ?? []).filter((p: any) => p.status === 'activo');

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <AppNav back={{ href: `/torneos/${id}`, label: tournament.name }} />

      <main style={{ maxWidth: 860, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, marginBottom: 24, flexWrap: 'wrap' }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 4 }}>
              Panel de administración
            </p>
            <h1 style={{ fontSize: 24, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{tournament.name}</h1>
            {game && <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 2 }}>{game.name}</p>}
          </div>
          <Link href={`/torneos/${id}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 12, border: '1.5px solid var(--border)', background: 'var(--bg-card)', color: 'var(--text-3)', fontSize: 13, fontWeight: 700, textDecoration: 'none', flexShrink: 0 }}>
            Ver página pública →
          </Link>
        </div>

        {/* Status control */}
        <div style={{ marginBottom: 24 }}>
          <StatusControl tournamentId={id} status={tournament.status} />
        </div>

        {/* Two-column layout */}
        <div className="torneo-admin-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(0,1fr) minmax(0,1.6fr)', gap: 24, alignItems: 'start' }}>

          {/* LEFT: Participants */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Participantes ({activeParticipants.length}
              {tournament.max_participants ? `/${tournament.max_participants}` : ''})
            </h2>
            <AddParticipantForm tournamentId={id} participants={activeParticipants as any} />
          </section>

          {/* RIGHT: Rounds */}
          <section>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 12 }}>
              Rondas y enfrentamientos
            </h2>
            <RoundManager
              tournamentId={id}
              rounds={(rounds ?? []) as any}
              participants={activeParticipants as any}
            />
          </section>
        </div>

        {/* Danger zone */}
        <div style={{ marginTop: 48, borderTop: '1px solid var(--border)', paddingTop: 24 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4 }}>Zona peligrosa</p>
          <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginBottom: 12 }}>
            Los cambios de estado son definitivos. Puedes cancelar el torneo en cualquier momento.
          </p>
        </div>
      </main>
    </div>
  );
}

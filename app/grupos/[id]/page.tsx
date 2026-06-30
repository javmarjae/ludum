import { createClient, getAuthUser } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Suspense } from 'react';
import { Avatar } from '@/components/Avatar';
import { VerifiedBadge } from '@/components/VerifiedBadge';
import { DeleteGroupButton } from './DeleteGroupButton';
import { EditGroupForm } from './EditGroupForm';
import { VisitTracker } from './VisitTracker';
import { CopyButton } from '@/components/CopyButton';
import { InviteQR } from './InviteQR';
import { GroupStatsRow } from './GroupStatsRow';
import { GroupRecentPlays } from './GroupRecentPlays';
import { GroupStatsRowSkeleton, GroupRecentPlaysSkeleton } from './GroupActivitySkeleton';

function playerIcon(n: number): string {
  if (n <= 1) return '/icons/solo.svg';
  if (n <= 2) return '/icons/pareja.svg';
  if (n <= 4) return '/icons/grupo.svg';
  return '/icons/pandilla.svg';
}

interface Props { params: Promise<{ id: string }>; }

export default async function GrupoDetailPage({ params }: Props) {
  const { id } = await params;
  const user = await getAuthUser();
  if (!user) redirect('/auth/login');
  const supabase = await createClient();

  const [
    { data: group },
    { data: membership },
    { data: members },
  ] = await Promise.all([
    supabase.from('groups').select('id, name, invite_code, owner_id, image_url, description').eq('id', id).single(),
    supabase.from('group_members').select('group_id').eq('group_id', id).eq('profile_id', user.id).single(),
    supabase.from('group_members').select('profile_id, profiles(display_name, avatar_url, is_verified)').eq('group_id', id),
  ]);

  if (!group) notFound();
  if (!membership) redirect('/grupos');

  const isOwner = group.owner_id === user.id;
  const memberCount = members?.length ?? 0;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', width: '100%' }}>
      <VisitTracker groupId={id} />

      {/* Sticky group header */}
      <div className="grupo-header-inner" style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        width: '100%', boxSizing: 'border-box',
        padding: '0 clamp(14px,4vw,32px)', height: 72, gap: 16,
        borderBottom: '1px solid var(--border)',
        background: 'var(--bg-card)',
        backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)',
        position: 'sticky', top: 0, zIndex: 30,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
          <Link href="/grupos" aria-label="Volver a Mis Grupos" style={{
            color: 'var(--text-4)', textDecoration: 'none', fontSize: 18, lineHeight: 1,
            flexShrink: 0, padding: '6px 10px', borderRadius: 8, background: 'var(--bg-inset)',
            fontWeight: 700,
          }}>
            ←
          </Link>
          {(group as any).image_url ? (
            <Image src={(group as any).image_url} alt={group.name} width={40} height={40} style={{ borderRadius: 12, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 40, height: 40, borderRadius: 12, background: 'var(--brand-tint)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <img src={playerIcon(memberCount)} alt="" aria-hidden="true" style={{ width: 22, height: 22 }} />
              </div>
          )}
          <div style={{ minWidth: 0 }}>
            <h1 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2, lineHeight: 1.2 }}>
              {group.name}
            </h1>
            <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', lineHeight: 1 }}>
              {memberCount} miembros
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
          <span className="grupo-invite-btn">
            <CopyButton text={group.invite_code} label="Invitar miembros" />
          </span>
          <Link href={`/grupos/${id}/partidas/nueva`} style={{
            display: 'inline-flex', alignItems: 'center',
            padding: '10px 18px', borderRadius: 10, fontWeight: 700, fontSize: 14,
            color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
            textDecoration: 'none', whiteSpace: 'nowrap',
          }}>
            <span className="grupo-btn-long">+ Registrar nueva partida</span>
            <span className="grupo-btn-short" style={{ display: 'none' }}>+ Partida</span>
          </Link>
        </div>
      </div>

      <div style={{ width: '100%', boxSizing: 'border-box', padding: '28px clamp(16px,4vw,32px) 80px' }}>

        {/* Stats row */}
        <Suspense fallback={<GroupStatsRowSkeleton />}>
          <GroupStatsRow groupId={id} />
        </Suspense>

        {/* Two-column grid */}
        <div className="grupo-cols" style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 24, alignItems: 'start' }}>

          {/* LEFT column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            <Suspense fallback={<GroupRecentPlaysSkeleton />}>
              <GroupRecentPlays groupId={id} userId={user.id} />
            </Suspense>
          </div>

          {/* RIGHT column */}
          <div className="grupo-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Members */}
            <section style={{ borderRadius: 22, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <div style={{ padding: '16px 18px 12px' }}>
                <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>
                  Miembros del grupo ({memberCount})
                </h2>
              </div>
              {(members as any[])?.map((m, i) => (
                <Link
                  key={m.profile_id}
                  href={m.profile_id === user.id ? '/perfil' : `/perfil/${m.profile_id}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '10px 18px',
                    borderTop: '1px solid var(--border)',
                    textDecoration: 'none',
                  }}
                >
                  <Avatar name={m.profiles?.display_name ?? '?'} src={(m.profiles as any)?.avatar_url} size={34} />
                  <span style={{
                    fontWeight: 600, fontSize: 13, color: 'var(--text)', flex: 1,
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    display: 'flex', alignItems: 'center', gap: 4,
                  }}>
                    {m.profiles?.display_name ?? 'Usuario'}
                    {(m.profiles as any)?.is_verified && <VerifiedBadge size={12} title="Verificado" />}
                  </span>
                  {m.profile_id === group.owner_id && (
                    <span style={{
                      fontSize: 10, fontWeight: 700, color: 'var(--text-4)',
                      background: 'var(--bg-inset)', padding: '2px 7px', borderRadius: 6, flexShrink: 0,
                    }}>
                      Admin
                    </span>
                  )}
                </Link>
              ))}
              <div style={{ padding: '11px 18px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--brand)' }}>Ver todos los miembros</span>
                <span style={{ color: 'var(--text-4)', fontSize: 16 }}>›</span>
              </div>
            </section>

            {/* Next session */}
            <section style={{ borderRadius: 22, padding: '18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Próxima partida</h2>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 42, height: 42, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, flexShrink: 0 }}>
                  📅
                </div>
                <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>
                  Aún no hay ninguna partida programada.
                </p>
              </div>
              <Link href={`/grupos/${id}/partidas/nueva`} style={{ display: 'inline-block', marginTop: 14, fontSize: 13, fontWeight: 700, color: 'var(--brand)', textDecoration: 'none' }}>
                Programar partida →
              </Link>
            </section>

            {/* Owner settings */}
            {isOwner && (
              <section style={{ borderRadius: 22, padding: '18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
                <h3 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>Ajustes del grupo</h3>

                {/* Editar grupo */}
                <div style={{ marginBottom: 14 }}>
                  <EditGroupForm
                    groupId={group.id}
                    initialName={group.name}
                    initialDescription={(group as any).description ?? ''}
                    initialImage={(group as any).image_url ?? null}
                    inviteCode={group.invite_code}
                    isOwner={isOwner}
                  />
                </div>

                {/* Invite code */}
                <div style={{ marginBottom: 14 }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-4)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                    Código de invitación
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <span style={{
                      fontFamily: 'monospace', fontWeight: 800, fontSize: 14,
                      padding: '4px 10px', borderRadius: 8, letterSpacing: '0.15em',
                      background: 'var(--brand-tint)', color: 'var(--brand)', border: '1px solid rgba(92,140,42,0.2)',
                    }}>
                      {group.invite_code}
                    </span>
                    <CopyButton text={group.invite_code} />
                    <InviteQR inviteCode={group.invite_code} groupName={group.name} />
                  </div>
                </div>

                {/* Danger zone */}
                <div style={{ paddingTop: 14, borderTop: '1px solid var(--border)' }}>
                  <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginBottom: 10 }}>
                    Esta acción es irreversible y borrará todos los datos del grupo.
                  </p>
                  <DeleteGroupButton groupId={group.id} />
                </div>
              </section>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

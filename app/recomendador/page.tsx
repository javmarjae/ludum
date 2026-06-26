import { Suspense } from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { GroupSelector, type SelectorGroup } from './GroupSelector';
import { RecommendationSection } from './RecommendationSection';
import { FiltersPanel } from './FiltersPanel';
import type { GroupFilters } from '@/lib/recommender';
import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Recomendador',
  description: 'Encuentra el juego perfecto para tu próxima partida con tu grupo.',
};

// ── Loading skeleton ───────────────────────────────────────────────────────────

function RecommendationSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

      {/* Status bar */}
      <div style={{
        borderRadius: 16, padding: '14px 18px',
        background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--brand)" strokeWidth="2.5" strokeLinecap="round" style={{ flexShrink: 0, animation: 'spin 1.1s linear infinite' }}>
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
            Buscando los juegos que encajan con vuestro grupo...
          </span>
        </div>
        <div style={{ height: 5, borderRadius: 999, background: 'var(--bg-inset)', overflow: 'hidden' }}>
          <div className="rec-loading-bar-fill" />
        </div>
      </div>

    <div className="recom-skeleton-cols">
      {/* Left */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div>
          <div style={{ height: 20, width: 260, borderRadius: 8, background: 'var(--bg-inset)', marginBottom: 14 }} className="skeleton" />
          <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ padding: '20px 20px 24px' }}>
              <div style={{ height: 28, width: 130, borderRadius: 8, background: 'var(--bg-inset)', marginBottom: 20 }} className="skeleton" />
              <div style={{ display: 'flex', gap: 20 }}>
                <div style={{ width: 120, height: 150, borderRadius: 12, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{ height: 32, width: '70%', borderRadius: 8, background: 'var(--bg-inset)' }} className="skeleton" />
                  <div style={{ height: 14, width: '90%', borderRadius: 6, background: 'var(--bg-inset)' }} className="skeleton" />
                  <div style={{ height: 14, width: '60%', borderRadius: 6, background: 'var(--bg-inset)' }} className="skeleton" />
                </div>
                <div style={{ width: 140, height: 140, borderRadius: '50%', background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
              </div>
            </div>
            <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg-inset)' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                {[0, 1, 2, 3].map((i) => (
                  <div key={i} style={{ height: 16, borderRadius: 6, background: 'var(--border)' }} className="skeleton" />
                ))}
              </div>
            </div>
          </div>
        </div>
        <div style={{ borderRadius: 16, padding: '18px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ height: 16, width: 180, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 16 }} className="skeleton" />
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
            {[0, 1, 2, 3].map((i) => (
              <div key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-inset)' }} className="skeleton" />
                <div style={{ height: 12, width: 60, borderRadius: 4, background: 'var(--bg-inset)' }} className="skeleton" />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        <div style={{ borderRadius: 20, padding: '18px 18px 12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
          <div style={{ height: 16, width: 150, borderRadius: 6, background: 'var(--bg-inset)', marginBottom: 16 }} className="skeleton" />
          {[0, 1, 2].map((i) => (
            <div key={i}>
              <div style={{ display: 'flex', gap: 10, padding: '8px 0', alignItems: 'center' }}>
                <div style={{ width: 44, height: 44, borderRadius: 8, background: 'var(--bg-inset)', flexShrink: 0 }} className="skeleton" />
                <div style={{ flex: 1 }}>
                  <div style={{ height: 13, width: '80%', borderRadius: 5, background: 'var(--bg-inset)', marginBottom: 6 }} className="skeleton" />
                  <div style={{ height: 11, width: '50%', borderRadius: 4, background: 'var(--bg-inset)' }} className="skeleton" />
                </div>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--bg-inset)' }} className="skeleton" />
              </div>
              {i < 2 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
            </div>
          ))}
        </div>
      </div>
    </div>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function EmptyState({ hasGroups }: { hasGroups: boolean }) {
  return (
    <div style={{ borderRadius: 24, padding: '48px 32px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🎲</p>
      <p style={{ fontSize: 20, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>
        {hasGroups ? 'Selecciona un grupo' : 'Crea tu primer grupo'}
      </p>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24, maxWidth: 320, margin: '0 auto 24px' }}>
        {hasGroups
          ? 'Elige un grupo arriba para ver recomendaciones personalizadas.'
          : 'Crea un grupo con tus amigos para recibir recomendaciones personalizadas.'}
      </p>
      {!hasGroups && (
        <Link href="/grupos" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: 999, fontWeight: 700, color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)', textDecoration: 'none' }}>
          Crear grupo
        </Link>
      )}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

interface Props {
  searchParams: Promise<{
    grupo?: string;
    jugadores?: string;
    duracion?: string;
    dificultad?: string;
    novedad?: string;
  }>;
}

export default async function RecomendadorPage({ searchParams }: Props) {
  const params = await searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) redirect('/auth/login');

  // Load user's groups + member counts in parallel
  const { data: memberships } = await supabase
    .from('group_members')
    .select('group_id, groups(id, name)')
    .eq('profile_id', user.id);

  const groupsRaw = (memberships ?? [])
    .map((m: any) => m.groups)
    .filter(Boolean) as Array<{ id: string; name: string }>;

  const groupIds = groupsRaw.map((g) => g.id);

  const { data: allMembers } = groupIds.length > 0
    ? await supabase.from('group_members').select('group_id').in('group_id', groupIds).limit(500)
    : { data: [] };

  const countMap: Record<string, number> = {};
  for (const row of allMembers ?? []) {
    countMap[row.group_id] = (countMap[row.group_id] ?? 0) + 1;
  }

  const groups: SelectorGroup[] = groupsRaw.map((g) => ({
    id: g.id,
    name: g.name,
    memberCount: countMap[g.id] ?? 1,
  }));

  const activeGroupId = params.grupo ?? groups[0]?.id ?? null;
  const activeGroup = groups.find((g) => g.id === activeGroupId) ?? null;

  const filters: GroupFilters = {
    jugadores: params.jugadores ? parseInt(params.jugadores) : undefined,
    duracion: params.duracion as GroupFilters['duracion'],
    dificultad: params.dificultad as GroupFilters['dificultad'],
    novedad: params.novedad as GroupFilters['novedad'],
  };

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      {/* Header */}
      <div style={{ padding: '32px clamp(20px, 4vw, 56px) 0', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: 30, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>
            Recomendador
          </h1>
          <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)' }}>
            Encuentra el juego perfecto para tu próxima partida.
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center', paddingTop: 4 }}>
          <div style={{ position: 'relative' }}>
            <FiltersPanel activeGroupId={activeGroupId} />
          </div>
          <Link href={activeGroupId ? `/grupos/${activeGroupId}/partidas/nueva` : '/grupos'} style={{ padding: '8px 16px', borderRadius: 10, fontSize: 13, fontWeight: 700, background: 'var(--brand)', color: 'white', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 6, boxShadow: 'var(--shadow-btn-brand)' }}>
            + Registrar partida
          </Link>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '28px clamp(20px, 4vw, 56px) 60px', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Section 1: Group selector — renders immediately */}
        <section>
          <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 3 }}>
            1. ¿Quién va a jugar?
          </h2>
          <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 14 }}>
            Selecciona el grupo o crea una partida nueva
          </p>
          <GroupSelector groups={groups} activeGroupId={activeGroupId} />
        </section>

        {/* Sections 2–5: stream in via Suspense */}
        {activeGroupId && activeGroup ? (
          <Suspense fallback={<RecommendationSkeleton />}>
            <RecommendationSection groupId={activeGroupId} memberCount={activeGroup.memberCount} filters={filters} />
          </Suspense>
        ) : (
          <EmptyState hasGroups={groups.length > 0} />
        )}
      </div>
    </div>
  );
}

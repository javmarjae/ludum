'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import type { GroupRecommendation, GroupFilters } from '@/lib/recommender';
import { dismissAndGetNext } from './actions';

// ── Affinity circle ────────────────────────────────────────────────────────────

function AffinityCircle({ value }: { value: number }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  return (
    <div style={{ position: 'relative', width: 140, height: 140, flexShrink: 0 }}>
      <svg width="140" height="140" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="var(--bg-inset)" strokeWidth="10" />
        <circle
          cx="70" cy="70" r={r} fill="none" stroke="var(--brand)" strokeWidth="10"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
        <span style={{ fontSize: 30, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}%</span>
        <span style={{ fontSize: 10, fontWeight: 600, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.4, marginTop: 5 }}>
          Afinidad<br />con vuestro<br />grupo
        </span>
      </div>
    </div>
  );
}

// ── Stat ring ─────────────────────────────────────────────────────────────────

function StatRing({ value, label }: { value: number; label: string }) {
  const size = 72;
  const r = 30;
  const circ = 2 * Math.PI * r;
  const capitalLabel = label.charAt(0).toUpperCase() + label.slice(1);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
      <div style={{ position: 'relative', width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--bg-inset)" strokeWidth="7" />
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--brand)" strokeWidth="7"
            strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)} strokeLinecap="round" />
        </svg>
        <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>
          {value}%
        </div>
      </div>
      <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-3)', textAlign: 'center', lineHeight: 1.3 }}>{capitalLabel}</span>
    </div>
  );
}

// ── Top game card ─────────────────────────────────────────────────────────────

function TopGameCard({ rec, onDismiss, isPending }: {
  rec: GroupRecommendation;
  onDismiss: () => void;
  isPending: boolean;
}) {
  const { game, affinity, reasons } = rec;
  const categories = [...(game.categories ?? []), ...(game.mechanics ?? [])].slice(0, 4);

  const dismissButton = (
    <button
      onClick={onDismiss}
      disabled={isPending}
      style={{
        display: 'inline-flex', alignItems: 'center', gap: 6,
        padding: '7px 14px', borderRadius: 8,
        border: '1.5px solid var(--border)',
        background: 'var(--bg-card)',
        fontSize: 12, fontWeight: 600, color: 'var(--text-3)',
        cursor: isPending ? 'default' : 'pointer',
        opacity: isPending ? 0.5 : 1,
        transition: 'all 0.15s',
        fontFamily: 'inherit',
        alignSelf: 'flex-start',
      }}
    >
      {isPending ? (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M21 12a9 9 0 1 1-6.219-8.56" />
          </svg>
          Buscando otra opción...
        </>
      ) : (
        <>
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
            <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
          </svg>
          No me interesa
        </>
      )}
    </button>
  );

  return (
    <div style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ padding: '20px 20px 16px' }}>
        <div style={{ marginBottom: 16 }}>
          <span style={{
            display: 'inline-flex', alignItems: 'center', gap: 5,
            padding: '4px 12px', borderRadius: 8,
            background: 'rgba(22,163,74,0.12)', border: '1px solid rgba(22,163,74,0.2)',
            fontSize: 12, fontWeight: 700, color: '#16a34a',
          }}>
            🌟 Muy recomendado
          </span>
        </div>

        <div style={{ display: 'flex', gap: 20, alignItems: 'flex-start' }}>
          {/* Imagen — clickable */}
          <Link href={`/juegos/${game.bgg_id}`} style={{ flexShrink: 0, display: 'block', textDecoration: 'none' }} className="hover-scale-sm">
            {game.image_url ? (
              <Image src={game.image_url} alt={game.name} width={120} height={150} priority sizes="120px"
                style={{ borderRadius: 12, objectFit: 'cover', display: 'block' }} />
            ) : (
              <div style={{ width: 120, height: 150, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>🎲</div>
            )}
          </Link>

          {/* Columna de contenido — título, metadatos y botón */}
          <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', minHeight: 150 }}>
            <Link href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none', display: 'block' }} className="hover-scale-sm">
              <h2 style={{ fontSize: 26, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 6, lineHeight: 1.1 }}>
                {game.name}
              </h2>
              {categories.length > 0 && (
                <p className="t-label" style={{ marginBottom: 14 }}>
                  {categories.join(' · ')}
                </p>
              )}
              <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap' }}>
                {game.min_players !== null && game.max_players !== null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                      <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                    </svg>
                    {game.min_players === game.max_players ? game.min_players : `${game.min_players}-${game.max_players}`} jugadores
                  </span>
                )}
                {game.min_playtime !== null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="10" /><polyline points="12 6 12 12 16 14" />
                    </svg>
                    {game.min_playtime}{game.max_playtime && game.max_playtime !== game.min_playtime ? `–${game.max_playtime}` : ''} minutos
                  </span>
                )}
                {game.complexity !== null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <line x1="18" y1="20" x2="18" y2="10" /><line x1="12" y1="20" x2="12" y2="4" /><line x1="6" y1="20" x2="6" y2="14" />
                    </svg>
                    {game.complexity.toFixed(1)}/5 complejidad
                  </span>
                )}
                {game.bgg_rating !== null && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 13, fontWeight: 600, color: 'var(--text-2)' }}>
                    <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                    </svg>
                    {game.bgg_rating.toFixed(1)} BGG
                  </span>
                )}
              </div>
            </Link>

            {/* Botón alineado al fondo de la imagen */}
            <div style={{ marginTop: 'auto', paddingTop: 10 }}>
              {dismissButton}
            </div>
          </div>

          <AffinityCircle value={affinity} />
        </div>
      </div>

      <div style={{ borderTop: '1px solid var(--border)', padding: '16px 20px', background: 'var(--bg-inset)' }}>
        <p className="t-label" style={{ marginBottom: 12 }}>¿Por qué os lo recomendamos?</p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {reasons.map((reason, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 7 }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginTop: 2, flexShrink: 0 }}>
                <circle cx="7" cy="7" r="7" fill="rgba(22,163,74,0.15)" />
                <path d="M3.5 7L5.7 9.2L10.5 4.5" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.4 }}>{reason}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Compatibility stats ────────────────────────────────────────────────────────

function CompatibilityStats({ stats }: { stats: GroupRecommendation['stats'] }) {
  return (
    <div style={{ borderRadius: 16, padding: '18px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <p className="t-card-title" style={{ marginBottom: 16 }}>Compatibilidad del grupo</p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
        <StatRing value={stats.membersEnjoy} label="jugadores disfrutan este tipo de juego" />
        <StatRing value={stats.durationFit} label="duración ideal para vuestras partidas" />
        <StatRing value={stats.complexityFit} label="nivel de complejidad habitual" />
        <StatRing value={stats.positiveRatings} label="valoraciones positivas en juegos similares" />
      </div>
    </div>
  );
}

// ── Main dismissable component ────────────────────────────────────────────────

interface Props {
  initial: GroupRecommendation;
  groupId: string;
  memberCount: number;
  filters?: GroupFilters;
}

export function DismissableTopRec({ initial, groupId, memberCount, filters }: Props) {
  const [rec, setRec] = useState<GroupRecommendation>(initial);
  const [skipped, setSkipped] = useState<string[]>([]);
  const [noMore, setNoMore] = useState(false);
  const [isPending, startTransition] = useTransition();

  function handleDismiss() {
    startTransition(async () => {
      const newSkipped = [...skipped, rec.game.id];
      setSkipped(newSkipped);
      const next = await dismissAndGetNext(groupId, memberCount, newSkipped, filters);
      if (next) {
        setRec(next);
      } else {
        setNoMore(true);
      }
    });
  }

  if (noMore) {
    return (
      <div style={{
        borderRadius: 20, padding: '40px 32px', textAlign: 'center',
        background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)',
      }}>
        <p style={{ fontSize: 36, marginBottom: 12 }}>🎲</p>
        <p className="t-section-title" style={{ marginBottom: 6 }}>Sin más sugerencias</p>
        <p className="t-section-sub" style={{ marginBottom: 20 }}>
          Has descartado todas las recomendaciones disponibles para este grupo.
        </p>
        <button
          onClick={() => { setSkipped([]); setRec(initial); setNoMore(false); }}
          style={{
            padding: '10px 22px', borderRadius: 999, fontWeight: 700,
            fontSize: 13, color: 'white', background: 'var(--brand)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          Volver a empezar
        </button>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16, opacity: isPending ? 0.7 : 1, transition: 'opacity 0.2s' }}>
      <TopGameCard rec={rec} onDismiss={handleDismiss} isPending={isPending} />
      <CompatibilityStats stats={rec.stats} />
    </div>
  );
}

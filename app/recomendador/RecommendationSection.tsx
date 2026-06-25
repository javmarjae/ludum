import Link from 'next/link';
import Image from 'next/image';
import {
  getGroupRecommendations,
  type GroupRecommendation,
  type GroupFilters,
  type GameResult,
} from '@/lib/recommender';
import { DismissableTopRec } from './DismissableTopRec';


// ── Affinity badge (used in alternatives sidebar) ─────────────────────────────

function AffinityBadge({ value }: { value: number }) {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const color = value >= 90 ? '#16a34a' : value >= 78 ? '#2563eb' : '#d97706';
  return (
    <div style={{ position: 'relative', width: 56, height: 56, flexShrink: 0 }}>
      <svg width="56" height="56" style={{ transform: 'rotate(-90deg)' }}>
        <circle cx="28" cy="28" r={r} fill="none" stroke="var(--bg-inset)" strokeWidth="5" />
        <circle
          cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="5"
          strokeDasharray={circ} strokeDashoffset={circ * (1 - value / 100)}
          strokeLinecap="round"
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: 11, fontWeight: 800, color: 'var(--text)', lineHeight: 1 }}>{value}%</span>
        <span style={{ fontSize: 7, fontWeight: 600, color: 'var(--text-3)' }}>Afinidad</span>
      </div>
    </div>
  );
}


// ── Trending section ───────────────────────────────────────────────────────────

function TrendingSection({ games }: { games: Array<GameResult & { groupCount: number }> }) {
  return (
    <section>
      <div style={{ marginBottom: 12 }}>
        <h2 style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>
          5. Lo que están jugando grupos como el vuestro
        </h2>
        <p style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-3)' }}>Grupos con gustos y tamaño similares</p>
      </div>
      <div style={{ display: 'flex', gap: 10, overflowX: 'auto', paddingBottom: 4 }}>
        {games.slice(0, 8).map((game) => (
          <Link key={game.id} href={`/juegos/${game.bgg_id}`} style={{ flexShrink: 0, borderRadius: 14, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textDecoration: 'none', width: 140 }}>
            {game.image_url ? (
              <Image src={game.image_url} alt={game.name} width={140} height={90}
                style={{ objectFit: 'cover', display: 'block', width: '100%', height: 90 }} />
            ) : (
              <div style={{ width: '100%', height: 90, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 28 }}>🎲</div>
            )}
            <div style={{ padding: '10px 10px 12px' }}>
              <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{game.name}</p>
              <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>Jugado por {game.groupCount} grupos</p>
            </div>
          </Link>
        ))}
        <Link href="/buscar" style={{ flexShrink: 0, borderRadius: 14, width: 60, border: '1.5px dashed var(--border)', background: 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', color: 'var(--text-4)', fontSize: 22 }}>›</Link>
      </div>
    </section>
  );
}

// ── Sidebar: alternatives ──────────────────────────────────────────────────────

function AlternativeRow({ game }: { game: GameResult & { affinity: number } }) {
  return (
    <Link href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none' }}>
      <div className="hover-scale-sm" style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 0' }}>
        {game.image_url ? (
          <Image src={game.image_url} alt={game.name} width={44} height={44} style={{ borderRadius: 8, objectFit: 'cover', flexShrink: 0 }} />
        ) : (
          <div style={{ width: 44, height: 44, borderRadius: 8, flexShrink: 0, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20 }}>🎲</div>
        )}
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 2 }}>{game.name}</p>
          <div style={{ display: 'flex', gap: 6 }}>
            {game.min_players !== null && game.max_players !== null && (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>
                👥 {game.min_players === game.max_players ? game.min_players : `${game.min_players}-${game.max_players}`} jug.
              </span>
            )}
            {game.min_playtime !== null && (
              <span style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)' }}>
                ⏱ {game.min_playtime}{game.max_playtime && game.max_playtime !== game.min_playtime ? `–${game.max_playtime}` : ''} min
              </span>
            )}
          </div>
        </div>
        <AffinityBadge value={game.affinity} />
      </div>
    </Link>
  );
}

// ── Sidebar: wildcard ──────────────────────────────────────────────────────────

function WildcardCard({ game }: { game: GameResult & { affinity: number; wildcardReason: string } }) {
  return (
    <section style={{ borderRadius: 20, overflow: 'hidden', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
      <div style={{ padding: '16px 16px 0' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>4. Algo diferente para vosotros</h2>
          <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '3px 8px', borderRadius: 6, background: 'rgba(234,179,8,0.12)', border: '1px solid rgba(234,179,8,0.2)', fontSize: 10, fontWeight: 700, color: '#b45309' }}>
            🌟 Salida de la rutina
          </span>
        </div>
      </div>
      <Link href={`/juegos/${game.bgg_id}`} style={{ textDecoration: 'none' }}>
        <div className="hover-scale-sm" style={{ display: 'flex', gap: 12, padding: '0 16px 12px', alignItems: 'flex-start' }}>
          {game.image_url ? (
            <Image src={game.image_url} alt={game.name} width={64} height={80} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
          ) : (
            <div style={{ width: 64, height: 80, borderRadius: 10, flexShrink: 0, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24 }}>🎲</div>
          )}
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4, lineHeight: 1.2 }}>{game.name}</p>
            {game.min_players !== null && game.max_players !== null && (
              <p style={{ fontSize: 11, color: 'var(--text-4)', marginBottom: 8 }}>
                👥 {game.min_players === game.max_players ? game.min_players : `${game.min_players}-${game.max_players}`} jugadores
                {game.min_playtime !== null && ` · ⏱ ${game.min_playtime}${game.max_playtime && game.max_playtime !== game.min_playtime ? `–${game.max_playtime}` : ''} min`}
              </p>
            )}
            <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.4, marginBottom: 10 }}>{game.wildcardReason}</p>
            <AffinityBadge value={game.affinity} />
          </div>
        </div>
      </Link>
      <div style={{ borderTop: '1px solid var(--border)', padding: '10px 16px' }}>
        <Link href={`/juegos/${game.bgg_id}`} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 13, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
          Saber más <span>›</span>
        </Link>
      </div>
    </section>
  );
}

// ── Tips box ──────────────────────────────────────────────────────────────────

function TipsBox() {
  return (
    <div style={{ borderRadius: 20, padding: 18, background: 'var(--brand-tint)', border: '1px solid rgba(62,94,59,0.15)' }}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
        <span style={{ fontSize: 18, flexShrink: 0 }}>💡</span>
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--brand)' }}>Consejos para mejores recomendaciones</span>
      </div>
      <p style={{ fontSize: 12, color: 'var(--text-3)', lineHeight: 1.5, marginBottom: 12 }}>
        Registra tus partidas y valora los juegos con estrellas para que nuestras recomendaciones sean cada vez más precisas.
      </p>
      <Link href="/partidas" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: 12, fontWeight: 600, color: 'var(--brand)', textDecoration: 'none' }}>
        Ver mis partidas <span>›</span>
      </Link>
    </div>
  );
}

// ── Empty state ────────────────────────────────────────────────────────────────

function NoRecs() {
  return (
    <div style={{ borderRadius: 24, padding: '48px 32px', textAlign: 'center', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', gridColumn: '1 / -1' }}>
      <p style={{ fontSize: 48, marginBottom: 16 }}>🎲</p>
      <p style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Sin recomendaciones</p>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', marginBottom: 24 }}>
        No encontramos juegos que encajen bien con este grupo. Prueba con otro grupo.
      </p>
      <Link href="/recomendador" style={{ display: 'inline-flex', padding: '12px 24px', borderRadius: 999, fontWeight: 700, color: 'white', background: 'var(--brand)', textDecoration: 'none' }}>
        Cambiar grupo
      </Link>
    </div>
  );
}

// ── Main async server component ───────────────────────────────────────────────

interface Props {
  groupId: string;
  memberCount: number;
  filters?: GroupFilters;
}

export async function RecommendationSection({ groupId, memberCount, filters }: Props) {
  const recs = await getGroupRecommendations(groupId, memberCount, filters);

  if (!recs) return <NoRecs />;

  return (
    <div className="recom-skeleton-cols">
      {/* Left column */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 24, minWidth: 0 }}>
        <section>
          <h2 className="t-section-title" style={{ marginBottom: 14 }}>
            2. Nuestra recomendación para vosotros
          </h2>
          <DismissableTopRec
            initial={recs.top}
            groupId={groupId}
            memberCount={memberCount}
            filters={filters}
          />
        </section>

        {recs.trending.length > 0 && <TrendingSection games={recs.trending} />}
      </div>

      {/* Right sidebar */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
        {recs.alternatives.length > 0 && (
          <section style={{ borderRadius: 20, padding: '18px 18px 12px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', marginBottom: 14 }}>3. Otras grandes opciones</h2>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              {recs.alternatives.slice(0, 3).map((game, i) => (
                <div key={game.id}>
                  <AlternativeRow game={game} />
                  {i < 2 && <div style={{ height: 1, background: 'var(--border)', margin: '4px 0' }} />}
                </div>
              ))}
            </div>
            <Link href="/recomendador/resultados" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 12, padding: '10px 12px', borderRadius: 10, background: 'var(--bg-inset)', fontSize: 13, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none', border: '1px solid var(--border)' }}>
              Ver más alternativas <span>›</span>
            </Link>
          </section>
        )}

        {recs.wildcard && <WildcardCard game={recs.wildcard} />}

        <TipsBox />
      </div>
    </div>
  );
}

'use client';

import { useState, useMemo } from 'react';
import Image from 'next/image';
import Link from 'next/link';

export type TrackerPlay = {
  id: string;
  played_at: string;
  game: { id: string; bgg_id: number | null; name: string; image_url: string | null; min_playtime: number | null; } | null;
  group_id: string | null;
  group_name: string | null;
  all_results: Array<{ profile_id: string | null; guest_name: string | null; is_winner: boolean; display_name: string | null; }>;
  my_is_winner: boolean;
};

export type TrackerRating = {
  rating: number;
  game: { bgg_id: number | null; name: string; image_url: string | null; } | null;
};

interface Props {
  plays: TrackerPlay[];
  ratings: TrackerRating[];
  totalUsers: number;
  userRank: number;
  userId: string;
}

type DateRange = '3m' | '6m' | '12m' | 'all';
type GameSort = 'most_played' | 'most_hours' | 'recent';

const RANGE_OPTIONS: { value: DateRange; label: string }[] = [
  { value: '3m', label: 'Últimos 3 meses' },
  { value: '6m', label: 'Últimos 6 meses' },
  { value: '12m', label: 'Últimos 12 meses' },
  { value: 'all', label: 'Todo el tiempo' },
];

function getDateCutoff(range: DateRange): Date {
  const now = new Date();
  if (range === '3m') return new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
  if (range === '6m') return new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
  if (range === '12m') return new Date(now.getFullYear(), now.getMonth() - 12, now.getDate());
  return new Date(0);
}

function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getLast6Months() {
  const now = new Date();
  return Array.from({ length: 6 }, (_, i) => {
    const d = new Date(now.getFullYear(), now.getMonth() - (5 - i), 1);
    return { label: d.toLocaleDateString('es-ES', { month: 'short' }), key: monthKey(d) };
  });
}

function relativeDate(dateStr: string): string {
  const diffDays = Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000);
  if (diffDays === 0) return 'Hoy';
  if (diffDays === 1) return 'Ayer';
  if (diffDays < 7) return `Hace ${diffDays} días`;
  return new Date(dateStr).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}

function SparkLine({ data }: { data: number[] }) {
  const max = Math.max(...data, 1);
  const hasData = data.some(v => v > 0);
  const W = 72, H = 26, P = 2;

  if (!hasData) return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      <line x1={P} y1={H - P} x2={W - P} y2={H - P} stroke="var(--border)" strokeWidth="1.5" />
    </svg>
  );

  const pts = data.map((v, i) => {
    const x = P + (i / (data.length - 1)) * (W - P * 2);
    const y = H - P - (v / max) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width={W} height={H} viewBox={`0 0 ${W} ${H}`} style={{ flexShrink: 0 }}>
      <polyline points={pts} fill="none" stroke="var(--brand-light)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
    </svg>
  );
}

function RankChart({ data, months }: { data: number[]; months: { label: string; key: string }[] }) {
  const max = Math.max(...data, 1);
  const W = 240, H = 72, P = 4;

  const pts = data.map((v, i) => {
    const x = P + (i / Math.max(data.length - 1, 1)) * (W - P * 2);
    const y = H - P - (v / max) * (H - P * 2);
    return `${x.toFixed(1)},${y.toFixed(1)}`;
  }).join(' ');

  return (
    <svg width="100%" height={H + 20} viewBox={`0 0 ${W} ${H + 20}`} style={{ display: 'block' }}>
      {[0.33, 0.66, 1].map(f => (
        <line key={f} x1={P} y1={H - P - f * (H - P * 2)} x2={W - P} y2={H - P - f * (H - P * 2)}
          stroke="var(--border)" strokeWidth="0.5" strokeDasharray="3,3" />
      ))}
      <polyline points={pts} fill="none" stroke="#89BA86" strokeWidth="2.5" strokeLinejoin="round" strokeLinecap="round" />
      {data.map((v, i) => {
        if (!v) return null;
        const x = P + (i / Math.max(data.length - 1, 1)) * (W - P * 2);
        const y = H - P - (v / max) * (H - P * 2);
        return <circle key={i} cx={x.toFixed(1)} cy={y.toFixed(1)} r="3.5" fill="#89BA86" />;
      })}
      {months.map((m, i) => {
        const x = P + (i / Math.max(months.length - 1, 1)) * (W - P * 2);
        return (
          <text key={m.key} x={x.toFixed(1)} y={H + 16} textAnchor="middle" fontSize="10"
            fill="var(--text-4)" fontFamily="Urbanist, system-ui" fontWeight="600" style={{ textTransform: 'capitalize' }}>
            {m.label}
          </text>
        );
      })}
    </svg>
  );
}

function StarDots({ rating }: { rating: number }) {
  return (
    <span style={{ display: 'flex', gap: 3, alignItems: 'center' }}>
      {Array.from({ length: 5 }, (_, i) => (
        <span key={i} style={{
          width: 9, height: 9, borderRadius: '50%',
          background: i < Math.floor(rating) ? 'var(--brand)' : i < rating ? 'var(--brand-light)' : 'var(--bg-inset)',
          border: '1px solid var(--border)',
        }} />
      ))}
    </span>
  );
}

function delta(curr: number, prev: number, suffix = '') {
  const d = curr - prev;
  if (d === 0) return null;
  return `${d > 0 ? '+' : ''}${d}${suffix} este mes`;
}

export function TrackerClient({ plays, ratings, totalUsers, userRank, userId }: Props) {
  const [dateRange, setDateRange] = useState<DateRange>('12m');
  const [rangeOpen, setRangeOpen] = useState(false);
  const [gameSearch, setGameSearch] = useState('');
  const [gameSort, setGameSort] = useState<GameSort>('most_played');

  const months6 = useMemo(() => getLast6Months(), []);
  const now = new Date();
  const currentMKey = monthKey(now);
  const prevMKey = monthKey(new Date(now.getFullYear(), now.getMonth() - 1, 1));

  const filtered = useMemo(() => {
    const cutoff = getDateCutoff(dateRange);
    return plays.filter(p => new Date(p.played_at) >= cutoff);
  }, [plays, dateRange]);

  const currentMonthPlays = useMemo(() => plays.filter(p => monthKey(new Date(p.played_at)) === currentMKey), [plays, currentMKey]);
  const prevMonthPlays = useMemo(() => plays.filter(p => monthKey(new Date(p.played_at)) === prevMKey), [plays, prevMKey]);

  const totalPlays = filtered.length;
  const distinctGames = useMemo(() => new Set(filtered.map(p => p.game?.id).filter(Boolean)).size, [filtered]);
  const totalMinutes = useMemo(() => filtered.reduce((s, p) => s + (p.game?.min_playtime ?? 0), 0), [filtered]);
  const totalHours = Math.round(totalMinutes / 60);

  const distinctPlayers = useMemo(() => {
    const keys = new Set<string>();
    filtered.forEach(p => p.all_results.forEach(r => {
      if (r.profile_id && r.profile_id !== userId) keys.add(r.profile_id);
      else if (!r.profile_id && r.guest_name) keys.add(`g:${r.guest_name.toLowerCase()}`);
    }));
    return keys.size;
  }, [filtered, userId]);

  const curGames = useMemo(() => new Set(currentMonthPlays.map(p => p.game?.id).filter(Boolean)).size, [currentMonthPlays]);
  const prevGames = useMemo(() => new Set(prevMonthPlays.map(p => p.game?.id).filter(Boolean)).size, [prevMonthPlays]);

  const curPlayers = useMemo(() => {
    const keys = new Set<string>();
    currentMonthPlays.forEach(p => p.all_results.forEach(r => {
      if (r.profile_id && r.profile_id !== userId) keys.add(r.profile_id);
      else if (!r.profile_id && r.guest_name) keys.add(`g:${r.guest_name.toLowerCase()}`);
    }));
    return keys.size;
  }, [currentMonthPlays, userId]);

  const prevPlayers = useMemo(() => {
    const keys = new Set<string>();
    prevMonthPlays.forEach(p => p.all_results.forEach(r => {
      if (r.profile_id && r.profile_id !== userId) keys.add(r.profile_id);
      else if (!r.profile_id && r.guest_name) keys.add(`g:${r.guest_name.toLowerCase()}`);
    }));
    return keys.size;
  }, [prevMonthPlays, userId]);

  const curHours = Math.round(currentMonthPlays.reduce((s, p) => s + (p.game?.min_playtime ?? 0), 0) / 60);
  const prevHours = Math.round(prevMonthPlays.reduce((s, p) => s + (p.game?.min_playtime ?? 0), 0) / 60);

  const monthlyPlays = useMemo(
    () => months6.map(m => filtered.filter(p => monthKey(new Date(p.played_at)) === m.key).length),
    [filtered, months6],
  );

  const gameList = useMemo(() => {
    const map = new Map<string, {
      id: string; bgg_id: number | null; name: string; image_url: string | null; min_playtime: number | null;
      count: number; wins: number; lastPlayed: string; monthlyCounts: number[];
    }>();

    filtered.forEach(p => {
      if (!p.game) return;
      const key = p.game.id;
      const ex = map.get(key);
      if (ex) {
        ex.count++;
        if (p.my_is_winner) ex.wins++;
        if (p.played_at > ex.lastPlayed) ex.lastPlayed = p.played_at;
      } else {
        map.set(key, { ...p.game, count: 1, wins: p.my_is_winner ? 1 : 0, lastPlayed: p.played_at, monthlyCounts: [] });
      }
    });

    const games = Array.from(map.values()).map(g => ({
      ...g,
      hours: Math.round((g.count * (g.min_playtime ?? 60)) / 60),
      monthlyCounts: months6.map(m =>
        filtered.filter(p => p.game?.id === g.id && monthKey(new Date(p.played_at)) === m.key).length
      ),
    }));

    const q = gameSearch.trim().toLowerCase();
    const searched = q ? games.filter(g => g.name.toLowerCase().includes(q)) : games;

    if (gameSort === 'most_played') return [...searched].sort((a, b) => b.count - a.count);
    if (gameSort === 'most_hours') return [...searched].sort((a, b) => b.hours - a.hours);
    return [...searched].sort((a, b) => b.lastPlayed.localeCompare(a.lastPlayed));
  }, [filtered, months6, gameSearch, gameSort]);

  const topRated = useMemo(() =>
    ratings.filter(r => r.game && r.rating >= 1).sort((a, b) => b.rating - a.rating).slice(0, 3),
    [ratings],
  );

  const percentile = totalUsers > 1 ? Math.max(1, Math.round((1 - (userRank - 1) / totalUsers) * 100)) : 100;
  const rangeLabel = RANGE_OPTIONS.find(o => o.value === dateRange)?.label ?? 'Últimos 12 meses';

  const statCards = [
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>,
      label: 'Juegos jugados', value: distinctGames, delta: delta(curGames, prevGames),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      label: 'Partidas totales', value: totalPlays, delta: delta(currentMonthPlays.length, prevMonthPlays.length),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
      label: 'Jugadores diferentes', value: distinctPlayers, delta: delta(curPlayers, prevPlayers),
    },
    {
      icon: <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
      label: 'Horas jugadas', value: totalHours > 0 ? `${totalHours}h` : '—', delta: curHours > 0 ? delta(curHours, prevHours, 'h') : null,
    },
  ];

  return (
    <div style={{ padding: '32px clamp(16px,4vw,32px) 64px' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 28, flexWrap: 'wrap', gap: 14 }}>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 4 }}>Tracker</h1>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--text-3)' }}>Tu historial, tus partidas, tu ranking.</p>
        </div>
        <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
          <div style={{ position: 'relative' }}>
            <button
              onClick={() => setRangeOpen(v => !v)}
              style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', borderRadius: 999,
                fontWeight: 700, fontSize: 14, cursor: 'pointer', fontFamily: 'inherit',
                background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', border: 'none', color: 'var(--text-2)',
              }}
            >
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/>
              </svg>
              {rangeLabel}
              <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
            </button>
            {rangeOpen && (
              <>
                <div onClick={() => setRangeOpen(false)} style={{ position: 'fixed', inset: 0, zIndex: 90 }} />
                <div style={{ position: 'absolute', top: 'calc(100% + 6px)', right: 0, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', borderRadius: 14, padding: 6, zIndex: 100, minWidth: 200 }}>
                  {RANGE_OPTIONS.map(opt => (
                    <button key={opt.value} onClick={() => { setDateRange(opt.value); setRangeOpen(false); }} style={{
                      display: 'block', width: '100%', textAlign: 'left', padding: '10px 14px', borderRadius: 9,
                      fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: 'inherit',
                      background: dateRange === opt.value ? 'var(--brand-tint)' : 'transparent',
                      color: dateRange === opt.value ? 'var(--brand)' : 'var(--text)',
                      border: 'none',
                    }}>
                      {opt.label}
                    </button>
                  ))}
                </div>
              </>
            )}
          </div>

          <Link href="/grupos" style={{
            display: 'flex', alignItems: 'center', gap: 7, padding: '10px 20px', borderRadius: 999,
            fontWeight: 700, fontSize: 14, textDecoration: 'none', color: 'white',
            background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
          }}>
            + Registrar partida
          </Link>
        </div>
      </div>

      {/* ── Stats cards ── */}
      <div className="tracker-stats-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {statCards.map(s => (
          <div key={s.label} style={{ borderRadius: 16, padding: '20px 22px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--bg-inset)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-3)', flexShrink: 0 }}>
                {s.icon}
              </div>
              <div style={{ minWidth: 0 }}>
                <p className="tracker-stat-label" style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)', marginBottom: 4, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{s.label}</p>
                <p style={{ fontSize: 34, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', lineHeight: 1 }}>{s.value}</p>
                {s.delta && <p style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)', marginTop: 5 }}>{s.delta}</p>}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* ── 3-column grid ── */}
      <div className="tracker-main-grid" style={{ display: 'grid', gridTemplateColumns: '1.6fr 1fr 0.85fr', gap: 20, alignItems: 'flex-start' }}>

        {/* ── Left: Juegos jugados ── */}
        <div style={{ borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 14 }}>Juegos jugados</h2>
            <div style={{ display: 'flex', gap: 8 }}>
              <div style={{ flex: 1, position: 'relative' }}>
                <input
                  value={gameSearch}
                  onChange={e => setGameSearch(e.target.value)}
                  placeholder="Buscar juego..."
                  style={{
                    width: '100%', padding: '9px 12px 9px 36px', borderRadius: 10,
                    fontSize: 14, fontWeight: 500, border: 'none',
                    background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
                    color: 'var(--text)', outline: 'none', fontFamily: 'inherit',
                  }}
                />
                <svg style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)' }} width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
                </svg>
              </div>
              <select
                value={gameSort}
                onChange={e => setGameSort(e.target.value as GameSort)}
                style={{
                  padding: '9px 12px', borderRadius: 10, fontSize: 14, fontWeight: 600,
                  border: 'none', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)',
                  color: 'var(--text)', cursor: 'pointer', fontFamily: 'inherit', outline: 'none',
                }}
              >
                <option value="most_played">Más jugados</option>
                <option value="most_hours">Más horas</option>
                <option value="recent">Más recientes</option>
              </select>
            </div>
          </div>

          <div style={{ maxHeight: 640, overflowY: 'auto' }}>
            {gameList.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: 'var(--text-3)', fontWeight: 500 }}>
                  {gameSearch ? 'Sin resultados para esa búsqueda' : 'Sin juegos en este período'}
                </p>
              </div>
            ) : gameList.slice(0, 25).map(game => (
              <Link
                key={game.id}
                href={game.bgg_id ? `/juegos/${game.bgg_id}` : '#'}
                style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 20px', borderBottom: '1px solid var(--border)', textDecoration: 'none', background: 'transparent', transition: 'background 0.1s' }}
                className="hover-row"
              >
                {game.image_url
                  ? <Image src={game.image_url} alt={game.name} width={54} height={54} style={{ borderRadius: 10, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 54, height: 54, borderRadius: 10, background: 'var(--bg-inset)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontWeight: 700, fontSize: 15, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginBottom: 3 }}>{game.name}</p>
                  <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>
                    {game.count} {game.count === 1 ? 'partida' : 'partidas'}
                    {game.hours > 0 ? ` · ${game.hours}h jugadas` : ''}
                  </p>
                </div>
                <SparkLine data={game.monthlyCounts} />
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                  <line x1="7" y1="17" x2="17" y2="7"/><polyline points="7 7 17 7 17 17"/>
                </svg>
              </Link>
            ))}
          </div>

          {gameList.length > 25 && (
            <div style={{ padding: '14px 20px', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>+{gameList.length - 25} juegos más</span>
            </div>
          )}
        </div>

        {/* ── Middle: Actividad reciente ── */}
        <div style={{ borderRadius: 16, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', overflow: 'hidden' }}>
          <div style={{ padding: '20px 18px 16px', borderBottom: '1px solid var(--border)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)' }}>Actividad reciente</h2>
          </div>

          <div style={{ maxHeight: 660, overflowY: 'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ padding: '48px 24px', textAlign: 'center' }}>
                <p style={{ fontSize: 15, color: 'var(--text-3)', fontWeight: 500 }}>Sin partidas en este período</p>
              </div>
            ) : filtered.slice(0, 16).map(play => (
              <Link
                key={play.id}
                href={play.group_id ? `/grupos/${play.group_id}/partidas/${play.id}` : `/partidas/${play.id}`}
                style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '14px 18px', borderBottom: '1px solid var(--border)', textDecoration: 'none' }}
                className="hover-row"
              >
                {play.game?.image_url
                  ? <Image src={play.game.image_url} alt={play.game.name ?? ''} width={50} height={50} style={{ borderRadius: 9, objectFit: 'cover', flexShrink: 0 }} />
                  : <div style={{ width: 50, height: 50, borderRadius: 9, background: 'var(--bg-inset)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-4)' }}>
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="7" width="20" height="14" rx="2"/><path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/></svg>
                    </div>
                }
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 4 }}>
                    <p style={{ fontWeight: 700, fontSize: 14, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', paddingRight: 6 }}>
                      {play.game?.name ?? 'Juego desconocido'}
                    </p>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-4)', flexShrink: 0 }}>
                      {relativeDate(play.played_at)}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, flexWrap: 'wrap' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, fontWeight: 700 }}>
                      <span style={{ width: 7, height: 7, borderRadius: '50%', background: play.my_is_winner ? '#16a34a' : '#dc2626', flexShrink: 0 }} />
                      <span style={{ color: play.my_is_winner ? '#16a34a' : '#dc2626' }}>{play.my_is_winner ? 'Victoria' : 'Derrota'}</span>
                    </span>
                    <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
                    <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                      {play.all_results.length}
                    </span>
                    {play.game?.min_playtime && (
                      <>
                        <span style={{ fontSize: 11, color: 'var(--text-4)' }}>·</span>
                        <span style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', display: 'flex', alignItems: 'center', gap: 3 }}>
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
                          {play.game.min_playtime} min
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          <Link
            href="/partidas/historial"
            style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '15px 18px', borderTop: '1px solid var(--border)', textDecoration: 'none' }}
            className="hover-row"
          >
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-2)' }}>Ver todas las partidas</span>
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
          </Link>
        </div>

        {/* ── Right column ── */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>

          {/* Ranking general */}
          <div style={{ borderRadius: 16, padding: '20px 20px 18px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
            <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Tu ranking general</h2>
            <div style={{ textAlign: 'center', marginBottom: 16 }}>
              <div style={{ width: 64, height: 64, borderRadius: '50%', background: 'var(--bg-inset)', margin: '0 auto 12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="var(--text-3)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
              </div>
              <p style={{ fontSize: 44, fontWeight: 800, color: '#7C3AED', letterSpacing: '-0.02em', lineHeight: 1 }}>#{userRank}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', margin: '6px 0 4px' }}>
                de {totalUsers.toLocaleString('es-ES')} jugadores
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: '#7C3AED' }}>Percentil {percentile}</p>
            </div>

            <RankChart data={monthlyPlays} months={months6} />

            <Link
              href="#"
              style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 14, padding: '11px 14px', borderRadius: 10, textDecoration: 'none', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}
              className="hover-ghost"
            >
              <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Ver rankings</span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
            </Link>
          </div>

          {/* Mejor valorados */}
          {topRated.length > 0 ? (
            <div style={{ borderRadius: 16, padding: '20px 20px 16px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)' }}>
              <h2 style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 16 }}>Tus juegos mejor valorados</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {topRated.map((r, i) => (
                  <Link
                    key={i}
                    href={r.game?.bgg_id ? `/juegos/${r.game.bgg_id}` : '#'}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', borderRadius: 10, margin: '0 -6px', padding: '4px 6px', transition: 'background 0.1s' }}
                    className="hover-row"
                  >
                    <span style={{ width: 20, fontWeight: 800, fontSize: 14, color: 'var(--text-3)', flexShrink: 0, textAlign: 'center' }}>{i + 1}</span>
                    {r.game?.image_url
                      ? <Image src={r.game.image_url} alt={r.game.name ?? ''} width={36} height={36} style={{ borderRadius: 7, objectFit: 'cover', flexShrink: 0 }} />
                      : <div style={{ width: 36, height: 36, borderRadius: 7, background: 'var(--bg-inset)', flexShrink: 0 }} />
                    }
                    <span style={{ flex: 1, fontSize: 13, fontWeight: 700, color: 'var(--text)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {r.game?.name ?? '—'}
                    </span>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                      <StarDots rating={r.rating} />
                      <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text-2)' }}>{r.rating.toFixed(1)}</span>
                    </div>
                  </Link>
                ))}
              </div>
              <Link
                href="/perfil"
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 16, padding: '11px 14px', borderRadius: 10, textDecoration: 'none', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}
                className="hover-ghost"
              >
                <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-2)' }}>Ver todos</span>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--text-4)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"/></svg>
              </Link>
            </div>
          ) : (
            <div style={{ borderRadius: 16, padding: '22px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', textAlign: 'center' }}>
              <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', marginBottom: 6 }}>Aún no has valorado juegos</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-4)' }}>Busca un juego y dale una puntuación para verlo aquí.</p>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

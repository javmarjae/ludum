'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Nav } from '@/components/Nav';

const opcionesJugadores = [
  { value: '1', label: 'Solo', icon: '🧍', desc: '1 jugador' },
  { value: '2', label: 'En pareja', icon: '👫', desc: '2 jugadores' },
  { value: '3', label: 'Grupo', icon: '👥', desc: '3–4 jugadores' },
  { value: '5', label: 'Pandilla', icon: '🎉', desc: '5 o más' },
];
const opcionesDuracion = [
  { value: 'corta', label: 'Rápida', icon: '⚡', desc: 'menos 45 min' },
  { value: 'media', label: 'Normal', icon: '⏱️', desc: '30–120 min' },
  { value: 'larga', label: 'Larga', icon: '🕐', desc: '90–240 min' },
  { value: 'muy-larga', label: 'Épica', icon: '🌙', desc: 'más de 3h' },
];
const opcionesComplejidad = [
  { value: 'ligero', label: 'Fácil', icon: '😊', desc: 'Para todos' },
  { value: 'medio', label: 'Medio', icon: '🧠', desc: 'Algo estrategia' },
  { value: 'complejo', label: 'Complejo', icon: '🔥', desc: 'Alta profundidad' },
];
const opcionesEpoca = [
  { value: 'cualquiera', label: 'Sin preferencia', icon: '🎯' },
  { value: 'moderno', label: 'Moderno', icon: '🚀', desc: 'Desde 2010' },
  { value: 'clasico', label: 'Clásico', icon: '🏛️', desc: 'Antes del 2000' },
];

function OptionCard({ selected, onClick, icon, label, desc }: {
  selected: boolean; onClick: () => void; icon: string; label: string; desc?: string;
}) {
  return (
    <button type="button" onClick={onClick} style={{
      position: 'relative', borderRadius: 20, padding: '16px 12px', textAlign: 'left',
      background: selected ? 'var(--brand-tint)' : 'var(--bg-card)',
      boxShadow: selected ? 'var(--shadow-card-hover)' : 'var(--shadow-card)',
      border: selected ? '1.5px solid rgba(62,94,59,0.25)' : '1.5px solid transparent',
      cursor: 'pointer', transition: 'transform 0.15s, box-shadow 0.15s',
      fontFamily: 'inherit',
    }}
      onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.04)'; }}
      onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
    >
      {selected && (
        <span style={{ position: 'absolute', top: 8, right: 8, width: 20, height: 20, borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 2px 8px rgba(62,94,59,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 800, color: 'white' }}>✓</span>
      )}
      <div style={{ fontSize: 24, marginBottom: 8 }}>{icon}</div>
      <div style={{ fontSize: 14, fontWeight: 700, color: selected ? 'var(--brand)' : 'var(--text)' }}>{label}</div>
      {desc && <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>{desc}</div>}
    </button>
  );
}

export default function RecomendadorPage() {
  const router = useRouter();
  const [players, setPlayers] = useState('');
  const [duration, setDuration] = useState('');
  const [complexity, setComplexity] = useState('');
  const [era, setEra] = useState('cualquiera');

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const params = new URLSearchParams();
    if (players) params.set('players', players);
    if (duration) params.set('duration', duration);
    if (complexity) params.set('complexity', complexity);
    params.set('era', era);
    router.push(`/recomendador/resultados?${params.toString()}`);
  }

  return (
    <div style={{ background: 'transparent', minHeight: '100vh' }}>
      <Nav back={{ href: '/', label: 'Inicio' }} />

      <main style={{ maxWidth: 680, margin: '0 auto', padding: '48px 24px 80px' }}>
        {/* Header */}
        <div style={{ marginBottom: 40 }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '5px 14px', borderRadius: 8, background: 'var(--bg-card)', boxShadow: 'var(--shadow-btn)', marginBottom: 16 }}>
            <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand)' }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--brand)' }}>Recomendador</span>
          </div>
          <h1 style={{ fontSize: 36, fontWeight: 800, letterSpacing: '-0.02em', color: 'var(--text)', marginBottom: 8 }}>¿A qué jugamos hoy?</h1>
          <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-3)' }}>Elige tus preferencias y te sugerimos los mejores juegos.</p>
        </div>

        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 36 }}>
          {[
            { num: 1, title: '¿Para cuántos jugadores?', opts: opcionesJugadores, val: players, set: setPlayers, cols: 4 },
            { num: 2, title: '¿Cuánto tiempo tenéis?', opts: opcionesDuracion, val: duration, set: setDuration, cols: 4 },
            { num: 3, title: '¿Qué complejidad preferís?', opts: opcionesComplejidad, val: complexity, set: setComplexity, cols: 3 },
            { num: 4, title: '¿Época del juego?', opts: opcionesEpoca, val: era, set: setEra, cols: 3 },
          ].map(({ num, title, opts, val, set, cols }) => (
            <div key={num}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <span style={{ width: 28, height: 28, borderRadius: '50%', background: 'var(--brand)', boxShadow: '0 3px 10px rgba(62,94,59,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', flexShrink: 0 }}>
                  {num}
                </span>
                <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)' }}>{title}</h2>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: `repeat(${cols}, 1fr)`, gap: 10 }}>
                {opts.map((op) => (
                  <OptionCard key={op.value} selected={val === op.value} onClick={() => set(op.value)} icon={op.icon} label={op.label} desc={'desc' in op ? (op as any).desc : undefined} />
                ))}
              </div>
            </div>
          ))}

          <button type="submit" style={{
            width: '100%', padding: '16px', borderRadius: 999, fontWeight: 800, fontSize: 16,
            color: 'white', background: 'var(--brand)', boxShadow: 'var(--shadow-btn-brand)',
            border: 'none', cursor: 'pointer', fontFamily: 'inherit', transition: 'transform 0.15s',
          }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1.02)'; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = 'scale(1)'; }}
          >
            Ver mis recomendaciones →
          </button>
        </form>
      </main>
    </div>
  );
}

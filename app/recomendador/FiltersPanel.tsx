'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

interface FilterChip {
  value: string;
  label: string;
  icon: string;
}

const JUGADORES: FilterChip[] = [
  { value: '1', label: 'Solo', icon: '🧍' },
  { value: '2', label: 'Pareja', icon: '👫' },
  { value: '3', label: 'Grupo', icon: '👥' },
  { value: '5', label: 'Pandilla', icon: '🎉' },
];

const DURACION: FilterChip[] = [
  { value: 'corta', label: 'Rápida', icon: '⚡' },
  { value: 'media', label: 'Normal', icon: '⏱️' },
  { value: 'larga', label: 'Larga', icon: '🕐' },
  { value: 'muy-larga', label: 'Épica', icon: '🌙' },
];

const DIFICULTAD: FilterChip[] = [
  { value: 'ligero', label: 'Fácil', icon: '😊' },
  { value: 'medio', label: 'Media', icon: '🧠' },
  { value: 'complejo', label: 'Difícil', icon: '🔥' },
];

const NOVEDAD: FilterChip[] = [
  { value: 'nuevo', label: 'No jugados', icon: '✨' },
  { value: 'jugado', label: 'Ya jugados', icon: '🔄' },
];

interface Section {
  key: string;
  label: string;
  chips: FilterChip[];
}

const SECTIONS: Section[] = [
  { key: 'jugadores', label: 'Jugadores', chips: JUGADORES },
  { key: 'duracion', label: 'Duración', chips: DURACION },
  { key: 'dificultad', label: 'Dificultad', chips: DIFICULTAD },
  { key: 'novedad', label: '¿Ya jugado?', chips: NOVEDAD },
];

interface Props {
  activeGroupId: string | null;
}

export function FiltersPanel({ activeGroupId }: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const activeCount = ['jugadores', 'duracion', 'dificultad', 'novedad'].filter(
    (k) => searchParams.get(k)
  ).length;

  const [open, setOpen] = useState(activeCount > 0);

  function toggle(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (params.get(key) === value) {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    router.push(`/recomendador?${params.toString()}`);
  }

  function clearAll() {
    const params = new URLSearchParams();
    if (activeGroupId) params.set('grupo', activeGroupId);
    router.push(`/recomendador?${params.toString()}`);
  }

  return (
    <div>
      {/* Toggle button */}
      <button
        onClick={() => setOpen((v) => !v)}
        style={{
          padding: '8px 14px',
          borderRadius: 10,
          fontSize: 13,
          fontWeight: 600,
          background: open || activeCount > 0 ? 'var(--brand-tint)' : 'var(--bg-card)',
          border: open || activeCount > 0
            ? '1px solid rgba(62,94,59,0.3)'
            : '1px solid var(--border)',
          color: open || activeCount > 0 ? 'var(--brand)' : 'var(--text-2)',
          cursor: 'pointer',
          fontFamily: 'inherit',
          display: 'flex',
          alignItems: 'center',
          gap: 7,
          boxShadow: 'var(--shadow-btn)',
          transition: 'all 0.15s',
        }}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
          <line x1="4" y1="6" x2="20" y2="6" />
          <line x1="8" y1="12" x2="16" y2="12" />
          <line x1="11" y1="18" x2="13" y2="18" />
        </svg>
        Filtros avanzados
        {activeCount > 0 && (
          <span style={{
            minWidth: 18, height: 18, borderRadius: 9,
            background: 'var(--brand)', color: 'white',
            fontSize: 10, fontWeight: 800,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            padding: '0 4px',
          }}>
            {activeCount}
          </span>
        )}
        <span style={{ fontSize: 10, color: 'inherit', opacity: 0.7, marginLeft: 2 }}>
          {open ? '▲' : '▼'}
        </span>
      </button>

      {/* Panel */}
      {open && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          zIndex: 40,
          borderRadius: 20,
          padding: '20px 24px',
          background: 'var(--bg-card)',
          boxShadow: '0 8px 40px rgba(0,0,0,0.14)',
          border: '1px solid var(--border)',
          width: 'min(600px, calc(100vw - 40px))',
        }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            {SECTIONS.map((section) => {
              const active = searchParams.get(section.key);
              return (
                <div key={section.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: 'var(--text-3)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                    {section.label}
                  </p>
                  <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
                    {section.chips.map((chip) => {
                      const isActive = active === chip.value;
                      return (
                        <button
                          key={chip.value}
                          onClick={() => toggle(section.key, chip.value)}
                          style={{
                            display: 'flex', alignItems: 'center', gap: 5,
                            padding: '6px 12px', borderRadius: 999,
                            fontSize: 13, fontWeight: 600,
                            border: isActive ? '1.5px solid var(--brand)' : '1.5px solid var(--border)',
                            background: isActive ? 'var(--brand-tint)' : 'var(--bg-inset)',
                            color: isActive ? 'var(--brand)' : 'var(--text-2)',
                            cursor: 'pointer', fontFamily: 'inherit',
                            transition: 'all 0.12s',
                          }}
                        >
                          <span style={{ fontSize: 14 }}>{chip.icon}</span>
                          {chip.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>

          {activeCount > 0 && (
            <div style={{ marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={clearAll}
                style={{
                  padding: '7px 14px', borderRadius: 8,
                  fontSize: 12, fontWeight: 600,
                  border: '1px solid var(--border)',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                Limpiar filtros
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

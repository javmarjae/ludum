'use client';

import { useState } from 'react';
import { updateTournamentStatus } from '../../actions';

const TRANSITIONS: Record<string, { next: string; label: string; color: string }[]> = {
  borrador:      [{ next: 'inscripciones', label: 'Abrir inscripciones', color: '#2563eb' }],
  inscripciones: [{ next: 'en_curso', label: 'Iniciar torneo', color: '#16a34a' }, { next: 'cancelado', label: 'Cancelar', color: '#dc2626' }],
  en_curso:      [{ next: 'finalizado', label: 'Finalizar torneo', color: '#374151' }, { next: 'cancelado', label: 'Cancelar', color: '#dc2626' }],
  finalizado:    [],
  cancelado:     [],
};

const STATUS_LABEL: Record<string, { label: string; color: string; bg: string }> = {
  borrador:      { label: 'Borrador', color: '#78716c', bg: '#f5f5f4' },
  inscripciones: { label: 'Inscripciones abiertas', color: '#1d4ed8', bg: '#dbeafe' },
  en_curso:      { label: 'En curso', color: '#15803d', bg: '#dcfce7' },
  finalizado:    { label: 'Finalizado', color: '#374151', bg: '#f3f4f6' },
  cancelado:     { label: 'Cancelado', color: '#dc2626', bg: '#fee2e2' },
};

export function StatusControl({ tournamentId, status }: { tournamentId: string; status: string }) {
  const [loading, setLoading] = useState<string | null>(null);
  const transitions = TRANSITIONS[status] ?? [];
  const st = STATUS_LABEL[status] ?? STATUS_LABEL.borrador;

  async function handleChange(next: string) {
    if (!confirm(`¿Cambiar estado a "${STATUS_LABEL[next]?.label}"?`)) return;
    setLoading(next);
    await updateTournamentStatus(tournamentId, next);
    setLoading(null);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '14px 18px', borderRadius: 18, background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', flexWrap: 'wrap' }}>
      <span style={{ fontSize: 13, fontWeight: 700, color: st.color, background: st.bg, padding: '5px 14px', borderRadius: 20 }}>
        {st.label}
      </span>
      <span style={{ flex: 1 }} />
      {transitions.map(t => (
        <button key={t.next} onClick={() => handleChange(t.next)} disabled={loading !== null}
          style={{ padding: '7px 16px', borderRadius: 12, border: 'none', background: t.color, color: 'white', fontWeight: 700, fontSize: 13, cursor: 'pointer', opacity: loading ? 0.7 : 1 }}>
          {loading === t.next ? '...' : t.label}
        </button>
      ))}
    </div>
  );
}

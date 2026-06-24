'use client';

import { useState } from 'react';
import { requestVerification } from './actions';

const CATEGORIES = [
  { value: 'creador_contenido', label: 'Creador de contenido (YouTube, Twitch, podcast)' },
  { value: 'periodista',        label: 'Periodista / crítico / reseñador' },
  { value: 'disenador',         label: 'Diseñador o editor de juegos' },
  { value: 'tienda',            label: 'Tienda o distribuidora' },
  { value: 'asociacion',        label: 'Asociación o club' },
  { value: 'organizador',       label: 'Organizador de torneos / eventos' },
  { value: 'otro',              label: 'Otro' },
];

interface Props {
  existingRequest: {
    status: 'pendiente' | 'aprobada' | 'rechazada';
    reason: string;
    category: string;
    admin_notes: string | null;
    created_at: string;
  } | null;
}

export function VerificationRequestForm({ existingRequest }: Props) {
  const [open, setOpen] = useState(false);
  const [pending, setPending] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);
    const result = await requestVerification(new FormData(e.currentTarget));
    if (result && 'error' in result) {
      setError(result.error);
      setPending(false);
    } else {
      setSuccess(true);
      setPending(false);
    }
  }

  // Already pending
  if (existingRequest?.status === 'pendiente' && !success) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>Solicitud en revisión</span>
      </div>
    );
  }

  // Submitted just now
  if (success) {
    return (
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 14px', borderRadius: 20, background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)' }}>
        <span style={{ width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', flexShrink: 0 }} />
        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--text-3)' }}>Solicitud enviada — en revisión</span>
      </div>
    );
  }

  // Rejected — show rejection note + resubmit button
  if (existingRequest?.status === 'rechazada' && !open) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        <div style={{ padding: '12px 16px', borderRadius: 12, background: 'rgba(220,38,38,0.07)', border: '1px solid rgba(220,38,38,0.2)' }}>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#dc2626', marginBottom: 4 }}>Solicitud rechazada</p>
          {existingRequest.admin_notes && (
            <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.5 }}>
              {existingRequest.admin_notes}
            </p>
          )}
        </div>
        <button
          onClick={() => setOpen(true)}
          style={{ alignSelf: 'flex-start', padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--text-2)', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)', fontFamily: 'inherit' }}
        >
          Volver a solicitar
        </button>
      </div>
    );
  }

  // No request yet or re-opening after rejection
  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        style={{ padding: '8px 16px', borderRadius: 20, border: 'none', cursor: 'pointer', fontWeight: 700, fontSize: 13, color: 'var(--text-2)', background: 'var(--bg-inset)', boxShadow: 'var(--shadow-btn)', fontFamily: 'inherit' }}
      >
        ✓ Solicitar verificación
      </button>
    );
  }

  return (
    <div style={{ borderRadius: 16, padding: '20px 20px', background: 'var(--bg-card)', boxShadow: 'var(--shadow-card)', maxWidth: 480 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <h3 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', margin: 0 }}>Solicitar verificación</h3>
        <button onClick={() => { setOpen(false); setError(null); }} style={{ background: 'none', border: 'none', cursor: 'pointer', fontSize: 18, color: 'var(--text-4)', lineHeight: 1 }}>✕</button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* Category */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Categoría
          </label>
          <select
            name="category"
            required
            defaultValue={existingRequest?.category ?? 'otro'}
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-input)', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 500, color: 'var(--text)', outline: 'none', appearance: 'none', fontFamily: 'inherit' }}
          >
            {CATEGORIES.map(c => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
        </div>

        {/* Reason */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Motivo *
          </label>
          <textarea
            name="reason"
            required
            minLength={20}
            maxLength={1000}
            rows={4}
            defaultValue={existingRequest?.reason ?? ''}
            placeholder="Explica quién eres y por qué tu perfil debería estar verificado..."
            style={{ width: '100%', padding: '10px 12px', borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-input)', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 500, color: 'var(--text)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
          />
        </div>

        {/* Social links */}
        <div>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)', marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Redes sociales / links <span style={{ fontWeight: 500, textTransform: 'none' }}>(opcionales)</span>
          </label>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {[
              { key: 'youtube',   placeholder: 'YouTube — URL del canal' },
              { key: 'instagram', placeholder: 'Instagram — @usuario' },
              { key: 'twitter',   placeholder: 'Twitter / X — @usuario' },
              { key: 'website',   placeholder: 'Web — https://...' },
            ].map(({ key, placeholder }) => (
              <input
                key={key}
                name={key}
                placeholder={placeholder}
                style={{ width: '100%', padding: '9px 12px', borderRadius: 8, border: 'none', boxShadow: 'var(--shadow-input)', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 500, color: 'var(--text)', outline: 'none', boxSizing: 'border-box' }}
              />
            ))}
          </div>
        </div>

        {error && (
          <p style={{ fontSize: 13, fontWeight: 600, color: '#dc2626', padding: '8px 12px', borderRadius: 8, background: 'rgba(220,38,38,0.07)' }}>
            {error}
          </p>
        )}

        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
          <button
            type="button"
            onClick={() => { setOpen(false); setError(null); }}
            style={{ padding: '9px 16px', borderRadius: 8, border: 'none', cursor: 'pointer', fontSize: 13, fontWeight: 700, color: 'var(--text-3)', background: 'var(--bg-inset)', fontFamily: 'inherit' }}
          >
            Cancelar
          </button>
          <button
            type="submit"
            disabled={pending}
            style={{ padding: '9px 20px', borderRadius: 8, border: 'none', cursor: pending ? 'not-allowed' : 'pointer', fontSize: 13, fontWeight: 700, color: 'white', background: pending ? 'var(--text-4)' : 'var(--brand)', boxShadow: pending ? 'none' : 'var(--shadow-btn-brand)', fontFamily: 'inherit' }}
          >
            {pending ? 'Enviando...' : 'Enviar solicitud'}
          </button>
        </div>
      </form>
    </div>
  );
}

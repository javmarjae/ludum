'use client';
import { useState, useTransition } from 'react';
import { completeOnboarding } from '@/app/perfil/actions';

const steps = [
  {
    icon: <WelcomeIcon />,
    label: 'Bienvenida',
    title: '¡Bienvenido a Ludum!',
    body: 'Tu app para descubrir, coleccionar y recordar cada partida de juegos de mesa. En un par de minutos te enseñamos todo lo que necesitas.',
    hint: null,
    color: '#3E5E3B',
  },
  {
    icon: <GroupIcon />,
    label: 'Grupos',
    title: 'Crea tu grupo de juego',
    body: 'Reúne a tus amigos y familia en un grupo. Desde allí podéis compartir vuestra colección de juegos y llevar el registro de todas las partidas.',
    hint: 'Tus Grupos → en la barra lateral',
    color: '#3E5E3B',
  },
  {
    icon: <CollectionIcon />,
    label: 'Colección',
    title: 'Añade juegos a la colección',
    body: 'Buscad cualquier juego del catálogo de BoardGameGeek — más de 130 000 títulos — y añadidlo a la colección de vuestro grupo con un clic.',
    hint: 'Grupo → Colección → Añadir juego',
    color: '#3E5E3B',
  },
  {
    icon: <PlayIcon />,
    label: 'Partidas',
    title: 'Registra cada partida',
    body: 'Apuntad quién participó, quién ganó y cuántos puntos hizo cada uno. El Tracker lleva el historial y las estadísticas automáticamente.',
    hint: 'Grupo → Partidas → Nueva partida',
    color: '#3E5E3B',
  },
  {
    icon: <RecommendIcon />,
    label: 'Recomendador',
    title: 'Descubre tu próximo juego',
    body: 'El Recomendador analiza el historial y el gusto del grupo para sugeriros el siguiente juego perfecto. Cuanto más juguéis, mejores sugerencias.',
    hint: 'Recomend → en la barra lateral',
    color: '#3E5E3B',
  },
] as const;

export function TutorialModal() {
  const [step, setStep] = useState(0);
  const [visible, setVisible] = useState(true);
  const [, startTransition] = useTransition();

  if (!visible) return null;

  const current = steps[step];
  const isLast = step === steps.length - 1;

  function dismiss() {
    setVisible(false);
    startTransition(() => { completeOnboarding(); });
  }

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(30,31,27,0.55)',
        backdropFilter: 'blur(6px)',
        WebkitBackdropFilter: 'blur(6px)',
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '16px',
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Tutorial de bienvenida"
        style={{
          background: 'var(--bg-card)',
          borderRadius: 24,
          boxShadow: '0 24px 64px rgba(0,0,0,0.22), 0 0 0 1px var(--border)',
          width: '100%',
          maxWidth: 460,
          padding: '36px 32px 28px',
          display: 'flex',
          flexDirection: 'column',
          gap: 0,
          position: 'relative',
        }}
      >
        {/* Progreso */}
        <div style={{ display: 'flex', gap: 6, marginBottom: 28 }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                flex: i === step ? 2 : 1,
                height: 4,
                borderRadius: 99,
                background: i <= step ? 'var(--brand)' : 'var(--border)',
                transition: 'flex 0.35s ease, background 0.2s',
              }}
            />
          ))}
        </div>

        {/* Icono */}
        <div
          style={{
            width: 68,
            height: 68,
            borderRadius: 20,
            background: 'var(--brand-tint)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 20,
            color: 'var(--brand)',
          }}
        >
          {current.icon}
        </div>

        {/* Etiqueta de paso */}
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.08em',
            textTransform: 'uppercase',
            color: 'var(--brand)',
            marginBottom: 6,
          }}
        >
          Paso {step + 1} de {steps.length} · {current.label}
        </span>

        {/* Título */}
        <h2
          style={{
            fontFamily: 'var(--font-display, serif)',
            fontSize: 24,
            fontWeight: 700,
            color: 'var(--text)',
            margin: '0 0 12px',
            lineHeight: 1.25,
          }}
        >
          {current.title}
        </h2>

        {/* Descripción */}
        <p
          style={{
            fontSize: 15,
            lineHeight: 1.65,
            color: 'var(--text-2)',
            margin: '0 0 20px',
          }}
        >
          {current.body}
        </p>

        {/* Hint */}
        {current.hint && (
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              background: 'var(--bg-inset)',
              borderRadius: 10,
              padding: '9px 14px',
              marginBottom: 28,
              fontSize: 13,
              color: 'var(--text-3)',
              fontWeight: 500,
            }}
          >
            <span style={{ fontSize: 14 }}>💡</span>
            {current.hint}
          </div>
        )}

        {!current.hint && <div style={{ marginBottom: 28 }} />}

        {/* Botones */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
          <button
            onClick={dismiss}
            style={{
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              fontSize: 13,
              color: 'var(--text-4)',
              padding: '8px 4px',
              fontFamily: 'inherit',
            }}
          >
            Saltar tutorial
          </button>

          <button
            onClick={() => isLast ? dismiss() : setStep(s => s + 1)}
            style={{
              background: 'var(--brand)',
              color: '#fff',
              border: 'none',
              borderRadius: 12,
              padding: '11px 24px',
              fontSize: 14,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'inherit',
              boxShadow: 'var(--shadow-btn-brand)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              transition: 'background 0.15s',
            }}
          >
            {isLast ? '¡Empezar!' : 'Siguiente'}
            {!isLast && (
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

/* ── Icons ───────────────────────────────────────────── */

function WelcomeIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <polyline points="9 22 9 12 15 12 15 22" />
    </svg>
  );
}

function GroupIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function CollectionIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="7" height="18" rx="2" />
      <rect x="9" y="3" width="7" height="18" rx="2" />
      <rect x="16" y="3" width="7" height="18" rx="2" />
    </svg>
  );
}

function PlayIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <polyline points="12 6 12 12 16 14" />
    </svg>
  );
}

function RecommendIcon() {
  return (
    <svg width="30" height="30" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

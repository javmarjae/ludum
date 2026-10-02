'use client';

export function BeginnerHideButton() {
  function hide() {
    try { localStorage.setItem('ludum-beginner-hidden', '1'); } catch {}
    document.documentElement.setAttribute('data-beginner-hidden', '');
  }

  return (
    <button
      onClick={hide}
      title="Ocultar sección"
      aria-label="Ocultar sección de iniciación"
      style={{
        flexShrink: 0,
        marginTop: 2,
        width: 32,
        height: 32,
        borderRadius: '50%',
        border: '1px solid var(--border)',
        background: 'var(--bg-card)',
        color: 'var(--text-3)',
        cursor: 'pointer',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: 16,
        lineHeight: 1,
      }}
    >
      ×
    </button>
  );
}

import React from 'react';

interface Props {
  size?: number;
  style?: React.CSSProperties;
  title?: string;
}

/**
 * Badge de verificación oficial — círculo verde con checkmark blanco.
 * Usar para perfiles verificados (is_verified) y comunidades oficiales (is_official).
 */
export function VerifiedBadge({ size = 16, style, title = 'Verificado' }: Props) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 20 20"
      fill="none"
      aria-label={title}
      role="img"
      style={{ flexShrink: 0, display: 'inline-block', verticalAlign: 'middle', ...style }}
    >
      <circle cx="10" cy="10" r="10" fill="var(--brand)" />
      <polyline
        points="5.5,10 8.5,13 14.5,7"
        stroke="white"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

import type { CSSProperties } from 'react';

/* Iconos SVG propios que sustituyen a los emojis del sistema.
   Mapa emoji → archivo en public/icons/picto/. Si un emoji no está
   mapeado, Picto lo renderiza tal cual (fallback seguro). */
const EMOJI_TO_PICTO: Record<string, string> = {
  '🎲': 'dado',
  '🏆': 'premio',
  '📍': 'ubicacion',
  '⏱': 'reloj',
  '🕐': 'reloj',
  '⏰': 'reloj',
  '⭐': 'estrella',
  '🌟': 'estrella',
  '📅': 'calendario',
  '🗓': 'calendario',
  '🔒': 'candado',
  '🌙': 'noche',
  '☀': 'dia',
  '⚙': 'ajustes',
  '🎪': 'ferias',
  '📰': 'novedades',
  '🎭': 'categoria',
  '🎮': 'partida',
};

interface PictoProps {
  /** Emoji a sustituir (se busca en el mapa). */
  emoji?: string;
  /** Nombre directo del archivo (sin .svg), tiene prioridad sobre emoji. */
  name?: string;
  /** Tamaño en px. Por defecto 1em: hereda el font-size del contexto, como un emoji. */
  size?: number;
  style?: CSSProperties;
  className?: string;
}

export function Picto({ emoji, name, size, style, className }: PictoProps) {
  const resolved = name ?? EMOJI_TO_PICTO[(emoji ?? '').replace(/️/g, '')];
  if (!resolved) return <span style={style} className={className}>{emoji}</span>;
  const dim = size ?? '1em';
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={`/icons/picto/${resolved}.svg`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      fetchPriority="low"
      width={typeof dim === 'number' ? dim : undefined}
      height={typeof dim === 'number' ? dim : undefined}
      className={className}
      style={{
        display: 'inline-block',
        width: dim,
        height: dim,
        verticalAlign: '-0.125em',
        ...style,
      }}
    />
  );
}

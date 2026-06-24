import React from 'react';

interface AvatarProps {
  name: string;
  src?: string | null;
  size?: number;
  style?: React.CSSProperties;
}

export function Avatar({ name, src, size = 40, style }: AvatarProps) {
  const radius = size * 0.28;
  const fontSize = size * 0.38;

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        width={size}
        height={size}
        style={{
          width: size, height: size, borderRadius: '50%',
          objectFit: 'cover', flexShrink: 0,
          ...style,
        }}
      />
    );
  }

  return (
    <div style={{
      width: size, height: size, borderRadius: '50%', flexShrink: 0,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize, fontWeight: 800, color: 'white',
      background: 'linear-gradient(135deg, #89BA86, #3E5E3B)',
      userSelect: 'none',
      ...style,
    }}>
      {(name ?? '?')[0].toUpperCase()}
    </div>
  );
}

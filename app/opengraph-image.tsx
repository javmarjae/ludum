import { ImageResponse } from 'next/og';

export const runtime = 'edge';
export const alt = 'Ludum — Recomendador de Juegos de Mesa';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#1a2e1a',
          width: '100%',
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          fontFamily: 'sans-serif',
        }}
      >
        {/* Decorative circles */}
        <div style={{ position: 'absolute', top: -120, right: -120, width: 500, height: 500, borderRadius: '50%', background: 'rgba(62,94,59,0.35)', display: 'flex' }} />
        <div style={{ position: 'absolute', bottom: -100, left: -100, width: 380, height: 380, borderRadius: '50%', background: 'rgba(62,94,59,0.25)', display: 'flex' }} />

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, zIndex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 24, marginBottom: 24 }}>
            <div style={{ width: 72, height: 72, borderRadius: 16, background: '#3E5E3B', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 40 }}>
              🎲
            </div>
            <span style={{ fontSize: 88, fontWeight: 800, color: 'white', letterSpacing: '-4px', lineHeight: 1 }}>
              Ludum
            </span>
          </div>
          <div style={{ fontSize: 32, fontWeight: 500, color: 'rgba(255,255,255,0.70)', textAlign: 'center', display: 'flex' }}>
            Recomendador de Juegos de Mesa
          </div>
          <div style={{ display: 'flex', gap: 32, marginTop: 40 }}>
            {['138k+ juegos', 'Datos BGG', '100% gratis'].map((t) => (
              <div key={t} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 999, background: 'rgba(255,255,255,0.10)', color: 'rgba(255,255,255,0.65)', fontSize: 20, fontWeight: 600 }}>
                {t}
              </div>
            ))}
          </div>
        </div>
      </div>
    ),
    { ...size }
  );
}

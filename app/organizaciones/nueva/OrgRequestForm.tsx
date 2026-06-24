'use client';

import { useState } from 'react';

const inputStyle = {
  background: 'var(--bg-inset)', boxShadow: 'var(--shadow-input)', border: '1px solid var(--border)',
  borderRadius: 14, color: 'var(--text)', width: '100%', padding: '11px 14px',
  fontSize: 14, fontWeight: 500, outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' as const,
};
const labelStyle = {
  display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--text-3)',
  textTransform: 'uppercase' as const, letterSpacing: '0.06em', marginBottom: 6,
};

const typeOptions = [
  { value: 'asociacion', icon: '🎲', label: 'Asociación', desc: 'Club de juegos, asociación lúdica...' },
  { value: 'tienda',     icon: '🏪', label: 'Tienda',     desc: 'Tienda especializada, ludoteca...' },
];

export default function OrgRequestForm({ action }: { action: (f: FormData) => Promise<void> }) {
  const [selectedType, setSelectedType] = useState('asociacion');

  return (
    <form action={action} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div>
        <label style={labelStyle}>Tipo de organización *</label>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
          {typeOptions.map(opt => {
            const selected = selectedType === opt.value;
            return (
              <label key={opt.value} style={{ cursor: 'pointer' }} onClick={() => setSelectedType(opt.value)}>
                <input type="radio" name="type" value={opt.value} checked={selected} onChange={() => setSelectedType(opt.value)} style={{ display: 'none' }} />
                <div style={{
                  padding: '16px 14px', borderRadius: 16,
                  border: selected ? '2px solid var(--brand)' : '2px solid var(--border)',
                  background: selected ? 'var(--brand-tint)' : 'var(--bg-card)',
                  textAlign: 'center', cursor: 'pointer',
                  transition: 'border-color 0.15s, background 0.15s',
                }}>
                  <p style={{ fontSize: 28, marginBottom: 4 }}>{opt.icon}</p>
                  <p style={{ fontWeight: 700, fontSize: 14, color: selected ? 'var(--brand)' : 'var(--text)' }}>{opt.label}</p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: 'var(--text-4)', marginTop: 2 }}>{opt.desc}</p>
                </div>
              </label>
            );
          })}
        </div>
      </div>

      <div>
        <label style={labelStyle} htmlFor="name">Nombre *</label>
        <input id="name" name="name" required placeholder="Ej: Club Lúdico de Madrid" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="location">Ciudad / Ubicación *</label>
        <input id="location" name="location" required placeholder="Ej: Madrid, España" style={inputStyle} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="description">Descripción *</label>
        <textarea id="description" name="description" required rows={3} placeholder="Cuéntanos sobre vuestra organización, qué actividades realizáis y por qué queréis estar en Ludum..." style={{ ...inputStyle, resize: 'vertical' }} />
      </div>

      <div>
        <label style={labelStyle} htmlFor="website">Sitio web</label>
        <input id="website" name="website" type="url" placeholder="https://..." style={inputStyle} />
      </div>

      <div style={{ borderRadius: 12, padding: '14px 16px', background: 'var(--bg-inset)', fontSize: 13, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.6 }}>
        ℹ️ El equipo de Ludum revisará tu solicitud en un plazo de 1–3 días hábiles. Recibirás una notificación cuando sea procesada.
      </div>

      <button type="submit" style={{ borderRadius: 16, padding: '14px', fontSize: 16, fontWeight: 700, width: '100%', border: 'none', cursor: 'pointer', background: 'var(--brand)', color: 'white', boxShadow: 'var(--shadow-btn-brand)', marginTop: 8 }}>
        Enviar solicitud
      </button>
    </form>
  );
}

import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Contacto',
  description: 'Ponte en contacto con el equipo de Ludum.',
};

export default function Contacto() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} mobileItems={[{ href: '/auth/login', label: 'Entrar', variant: 'brand' }]} />
      <main style={{ maxWidth: 640, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          Hablemos
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 16 }}>
          Contacto
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-3)', lineHeight: 1.7, marginBottom: 48 }}>
          Somos un equipo pequeño pero respondemos rápido. Si tienes una duda, sugerencia o quieres colaborar, no dudes en escribirnos.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {[
            {
              icon: '✉️',
              title: 'Email general',
              desc: 'Para cualquier consulta',
              value: 'info@ludumgames.es',
              href: 'mailto:info@ludumgames.es',
            },
            {
              icon: '🐛',
              title: 'Bugs y soporte técnico',
              desc: 'Si algo no funciona como debería',
              value: 'soporte@ludum.es',
              href: 'mailto:soporte@ludum.es',
            },
            {
              icon: '🤝',
              title: 'Colaboraciones y prensa',
              desc: 'Tiendas, clubes, eventos y medios',
              value: 'colabora@ludum.es',
              href: 'mailto:colabora@ludum.es',
            },
          ].map(item => (
            <a
              key={item.href}
              href={item.href}
              style={{ padding: '20px 24px', background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-card)', textDecoration: 'none', display: 'flex', gap: 16, alignItems: 'flex-start' }}
              className="hover-lift"
            >
              <span style={{ fontSize: 24, lineHeight: 1, flexShrink: 0, marginTop: 2 }}>{item.icon}</span>
              <div>
                <p style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)', marginBottom: 2 }}>{item.title}</p>
                <p style={{ fontSize: 13, color: 'var(--text-3)', marginBottom: 6 }}>{item.desc}</p>
                <p style={{ fontSize: 14, fontWeight: 600, color: 'var(--brand)' }}>{item.value}</p>
              </div>
            </a>
          ))}
        </div>

        <p style={{ fontSize: 13, color: 'var(--text-4)', marginTop: 36, lineHeight: 1.65 }}>
          Tiempo de respuesta habitual: menos de 48 horas en días laborables.
        </p>
      </main>
    </>
  );
}

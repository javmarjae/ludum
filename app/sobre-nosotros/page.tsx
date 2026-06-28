import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Sobre Ludum',
  description: 'Conoce el proyecto Ludum: quiénes somos y por qué lo construimos.',
};

export default function SobreNosotros() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} mobileItems={[{ href: '/auth/login', label: 'Entrar', variant: 'brand' }]} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          El proyecto
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 24 }}>
          Sobre Ludum
        </h1>
        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 16 }}>
          Ludum nació de una necesidad simple: llevar la cuenta de las partidas que jugamos con amigos sin perder papeles ni olvidar quién ganó la última vez.
        </p>
        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 16 }}>
          Lo que empezó como un tracker personal ha crecido hasta convertirse en una plataforma completa: más de 138.000 juegos de BoardGameGeek, recomendador personalizado, grupos, torneos y comunidades para conectar jugadores de toda España.
        </p>
        <p style={{ fontSize: 16, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 40 }}>
          Ludum es un proyecto independiente, hecho por aficionados a los juegos de mesa. Sin inversores, sin agenda corporativa: solo queremos que encuentres tu próximo juego favorito.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 48 }}>
          {[
            { value: '138k+', label: 'Juegos en catálogo' },
            { value: '100%', label: 'Gratuito' },
            { value: 'BGG', label: 'Datos verificados' },
          ].map(s => (
            <div key={s.label} style={{ padding: '20px 24px', background: 'var(--bg-card)', borderRadius: 12, boxShadow: 'var(--shadow-card)' }}>
              <p style={{ fontSize: 28, fontWeight: 800, color: 'var(--brand)', letterSpacing: '-0.02em', lineHeight: 1 }}>{s.value}</p>
              <p style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)', marginTop: 4 }}>{s.label}</p>
            </div>
          ))}
        </div>

        <h2 style={{ fontSize: 22, fontWeight: 800, color: 'var(--text)', marginBottom: 12, letterSpacing: '-0.01em' }}>¿Tienes alguna pregunta?</h2>
        <p style={{ fontSize: 15, color: 'var(--text-3)', marginBottom: 20, lineHeight: 1.65 }}>
          Si quieres saber más, colaborar o simplemente saludar, escríbenos a{' '}
          <a href="mailto:info@ludumgames.es" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>info@ludumgames.es</a>.
        </p>
      </main>
    </>
  );
}

import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ — Preguntas frecuentes',
  description: 'Respuestas a las preguntas más habituales sobre Ludum.',
};

const FAQS = [
  {
    q: '¿Ludum es gratuito?',
    a: 'Sí, completamente. Puedes registrar partidas, usar el recomendador y participar en grupos sin pagar nada. Nos financiamos con publicidad no intrusiva.',
  },
  {
    q: '¿De dónde vienen los datos de los juegos?',
    a: 'Importamos el catálogo de BoardGameGeek (BGG), la mayor base de datos de juegos de mesa del mundo. Actualizamos los rankings y datos de forma periódica.',
  },
  {
    q: '¿Puedo importar mi colección de BGG?',
    a: 'Sí. En tu perfil encontrarás la opción "Importar colección de BGG". Solo necesitas tu nombre de usuario de BoardGameGeek.',
  },
  {
    q: '¿Cómo funciona el recomendador?',
    a: 'El recomendador analiza los juegos de tu grupo (colección, partidas jugadas, valoraciones y preferencias) para sugerir títulos que encajen con la sesión de hoy.',
  },
  {
    q: '¿Puedo usar Ludum sin registrarme?',
    a: 'Puedes buscar juegos y ver fichas sin cuenta. Para registrar partidas, crear grupos o usar el recomendador necesitas una cuenta gratuita.',
  },
  {
    q: '¿Cómo creo un grupo?',
    a: 'Desde el menú "Grupos" puedes crear uno en segundos. Luego invita a tus amigos con un enlace o código QR y empezad a registrar partidas juntos.',
  },
  {
    q: '¿Mis datos están seguros?',
    a: 'Sí. Usamos Supabase con autenticación segura. No vendemos datos personales a terceros. Puedes leer nuestra política de privacidad para más detalles.',
  },
  {
    q: '¿Puedo solicitar que se añada un juego?',
    a: 'Si un juego está en BoardGameGeek, lo tenemos (o lo tendremos en la próxima sincronización). Si no está en BGG, escríbenos a info@ludumgames.es.',
  },
];

export default function FAQ() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} mobileItems={[{ href: '/auth/login', label: 'Entrar', variant: 'brand' }]} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          Ayuda
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 8 }}>
          Preguntas frecuentes
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 48, lineHeight: 1.6 }}>
          ¿Tienes dudas? Aquí están las respuestas más habituales.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
          {FAQS.map(({ q, a }, i) => (
            <div
              key={i}
              style={{
                padding: '24px 0',
                borderBottom: i < FAQS.length - 1 ? '1px solid var(--border)' : 'none',
              }}
            >
              <h2 style={{ fontSize: 16, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>{q}</h2>
              <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-3)', lineHeight: 1.75 }}>{a}</p>
            </div>
          ))}
        </div>

        <div style={{ marginTop: 56, padding: '28px 32px', background: 'var(--bg-card)', borderRadius: 16, boxShadow: 'var(--shadow-card)' }}>
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>¿No encuentras tu respuesta?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65 }}>
            Escríbenos a{' '}
            <a href="mailto:info@ludumgames.es" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>info@ludumgames.es</a>{' '}
            y te respondemos en menos de 48h.
          </p>
        </div>
      </main>
    </>
  );
}

import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'FAQ â€” Preguntas frecuentes',
  description: 'Respuestas a las preguntas mÃ¡s habituales sobre Ludum.',
};

const FAQS = [
  {
    q: 'Â¿Ludum es gratuito?',
    a: 'SÃ­, completamente. Puedes registrar partidas, usar el recomendador y participar en grupos sin pagar nada. Nos financiamos con publicidad no intrusiva.',
  },
  {
    q: 'Â¿De dÃ³nde vienen los datos de los juegos?',
    a: 'Importamos el catÃ¡logo de BoardGameGeek (BGG), la mayor base de datos de juegos de mesa del mundo. Actualizamos los rankings y datos de forma periÃ³dica.',
  },
  {
    q: 'Â¿Puedo importar mi colecciÃ³n de BGG?',
    a: 'SÃ­. En tu perfil encontrarÃ¡s la opciÃ³n "Importar colecciÃ³n de BGG". Solo necesitas tu nombre de usuario de BoardGameGeek.',
  },
  {
    q: 'Â¿CÃ³mo funciona el recomendador?',
    a: 'El recomendador analiza los juegos de tu grupo (colecciÃ³n, partidas jugadas, valoraciones y preferencias) para sugerir tÃ­tulos que encajen con la sesiÃ³n de hoy.',
  },
  {
    q: 'Â¿Puedo usar Ludum sin registrarme?',
    a: 'Puedes buscar juegos y ver fichas sin cuenta. Para registrar partidas, crear grupos o usar el recomendador necesitas una cuenta gratuita.',
  },
  {
    q: 'Â¿CÃ³mo creo un grupo?',
    a: 'Desde el menÃº "Grupos" puedes crear uno en segundos. Luego invita a tus amigos con un enlace o cÃ³digo QR y empezad a registrar partidas juntos.',
  },
  {
    q: 'Â¿Mis datos estÃ¡n seguros?',
    a: 'SÃ­. Usamos Supabase con autenticaciÃ³n segura. No vendemos datos personales a terceros. Puedes leer nuestra polÃ­tica de privacidad para mÃ¡s detalles.',
  },
  {
    q: 'Â¿Puedo solicitar que se aÃ±ada un juego?',
    a: 'Si un juego estÃ¡ en BoardGameGeek, lo tenemos (o lo tendremos en la prÃ³xima sincronizaciÃ³n). Si no estÃ¡ en BGG, escrÃ­benos a info@ludumgames.es.',
  },
];

export default function FAQ() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          Ayuda
        </p>
        <h1 style={{ fontSize: 'clamp(28px, 4vw, 44px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 8 }}>
          Preguntas frecuentes
        </h1>
        <p style={{ fontSize: 16, color: 'var(--text-3)', marginBottom: 48, lineHeight: 1.6 }}>
          Â¿Tienes dudas? AquÃ­ estÃ¡n las respuestas mÃ¡s habituales.
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
          <h2 style={{ fontSize: 18, fontWeight: 800, color: 'var(--text)', marginBottom: 8 }}>Â¿No encuentras tu respuesta?</h2>
          <p style={{ fontSize: 14, color: 'var(--text-3)', lineHeight: 1.65 }}>
            EscrÃ­benos a{' '}
            <a href="mailto:info@ludumgames.es" style={{ color: 'var(--brand)', fontWeight: 600, textDecoration: 'none' }}>info@ludumgames.es</a>{' '}
            y te respondemos en menos de 48h.
          </p>
        </div>
      </main>
    </>
  );
}

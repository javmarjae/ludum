import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'TÃ©rminos de uso',
  description: 'Condiciones de uso de la plataforma Ludum.',
};

export default function Terminos() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 8 }}>
          TÃ©rminos de uso
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 48 }}>Ãšltima actualizaciÃ³n: junio 2025</p>

        {[
          {
            title: '1. AceptaciÃ³n',
            body: 'Al usar Ludum aceptas estos tÃ©rminos. Si no estÃ¡s de acuerdo, por favor no uses la plataforma.',
          },
          {
            title: '2. Uso permitido',
            body: 'Puedes usar Ludum para registrar partidas, buscar juegos, interactuar con la comunidad y gestionar tu colecciÃ³n. EstÃ¡ prohibido hacer scraping masivo, automatizar peticiones de forma abusiva, publicar contenido ilegal u ofensivo, o suplantar la identidad de otros usuarios.',
          },
          {
            title: '3. Contenido generado por usuarios',
            body: 'Eres responsable del contenido que publicas (reseÃ±as, comentarios, nombres de grupo, etc.). Nos reservamos el derecho a eliminar contenido que infrinja estas normas o la ley espaÃ±ola.',
          },
          {
            title: '4. Propiedad intelectual',
            body: 'Los datos de juegos provienen de BoardGameGeek bajo su licencia. El cÃ³digo, diseÃ±o y marca Ludum son propiedad de sus autores. No puedes reproducir ni distribuir el servicio sin autorizaciÃ³n.',
          },
          {
            title: '5. Disponibilidad',
            body: 'Ludum es un proyecto en desarrollo activo. Podemos interrumpir, modificar o discontinuar el servicio (o partes de Ã©l) sin previo aviso, aunque haremos todo lo posible por avisar con antelaciÃ³n.',
          },
          {
            title: '6. LimitaciÃ³n de responsabilidad',
            body: 'Ludum se ofrece "tal cual". No garantizamos la exactitud de todos los datos de juegos ni la disponibilidad continua del servicio. No somos responsables de pÃ©rdidas derivadas del uso de la plataforma.',
          },
          {
            title: '7. Ley aplicable',
            body: 'Estos tÃ©rminos se rigen por la ley espaÃ±ola. Cualquier disputa se someterÃ¡ a los tribunales competentes de EspaÃ±a.',
          },
          {
            title: '8. Contacto',
            body: 'Para cualquier cuestiÃ³n legal: info@ludumgames.es.',
          },
        ].map(section => (
          <div key={section.title} style={{ marginBottom: 32 }}>
            <h2 style={{ fontSize: 17, fontWeight: 700, color: 'var(--text)', marginBottom: 8, letterSpacing: '-0.01em' }}>{section.title}</h2>
            <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8 }}>{section.body}</p>
          </div>
        ))}
      </main>
    </>
  );
}

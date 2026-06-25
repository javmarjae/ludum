import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Términos de uso',
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
          Términos de uso
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 48 }}>Última actualización: junio 2025</p>

        {[
          {
            title: '1. Aceptación',
            body: 'Al usar Ludum aceptas estos términos. Si no estás de acuerdo, por favor no uses la plataforma.',
          },
          {
            title: '2. Uso permitido',
            body: 'Puedes usar Ludum para registrar partidas, buscar juegos, interactuar con la comunidad y gestionar tu colección. Está prohibido hacer scraping masivo, automatizar peticiones de forma abusiva, publicar contenido ilegal u ofensivo, o suplantar la identidad de otros usuarios.',
          },
          {
            title: '3. Contenido generado por usuarios',
            body: 'Eres responsable del contenido que publicas (reseñas, comentarios, nombres de grupo, etc.). Nos reservamos el derecho a eliminar contenido que infrinja estas normas o la ley española.',
          },
          {
            title: '4. Propiedad intelectual',
            body: 'Los datos de juegos provienen de BoardGameGeek bajo su licencia. El código, diseño y marca Ludum son propiedad de sus autores. No puedes reproducir ni distribuir el servicio sin autorización.',
          },
          {
            title: '5. Disponibilidad',
            body: 'Ludum es un proyecto en desarrollo activo. Podemos interrumpir, modificar o discontinuar el servicio (o partes de él) sin previo aviso, aunque haremos todo lo posible por avisar con antelación.',
          },
          {
            title: '6. Limitación de responsabilidad',
            body: 'Ludum se ofrece "tal cual". No garantizamos la exactitud de todos los datos de juegos ni la disponibilidad continua del servicio. No somos responsables de pérdidas derivadas del uso de la plataforma.',
          },
          {
            title: '7. Ley aplicable',
            body: 'Estos términos se rigen por la ley española. Cualquier disputa se someterá a los tribunales competentes de España.',
          },
          {
            title: '8. Contacto',
            body: 'Para cualquier cuestión legal: hola@ludum.es.',
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

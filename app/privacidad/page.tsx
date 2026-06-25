import { Nav, NavButton } from '@/components/Nav';
import { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Política de privacidad',
  description: 'Cómo Ludum gestiona tus datos personales.',
};

export default function Privacidad() {
  return (
    <>
      <Nav right={<NavButton href="/auth/login" variant="brand">Entrar</NavButton>} />
      <main style={{ maxWidth: 720, margin: '0 auto', padding: '64px 32px 80px' }}>
        <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--brand)', marginBottom: 16 }}>
          Legal
        </p>
        <h1 style={{ fontSize: 'clamp(24px, 4vw, 40px)', fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: 'var(--text)', marginBottom: 8 }}>
          Política de privacidad
        </h1>
        <p style={{ fontSize: 13, color: 'var(--text-4)', marginBottom: 48 }}>Última actualización: junio 2025</p>

        {[
          {
            title: '1. Responsable del tratamiento',
            body: 'Ludum (en adelante, "nosotros") es responsable del tratamiento de los datos personales que recoges al usar esta plataforma. Puedes contactarnos en hola@ludum.es.',
          },
          {
            title: '2. Datos que recopilamos',
            body: 'Recopilamos el email y contraseña que usas para registrarte (gestionados de forma segura por Supabase), el nombre de usuario que eliges, las partidas, valoraciones y listas que creas dentro de la plataforma, y los datos de colección que importas voluntariamente desde BoardGameGeek.',
          },
          {
            title: '3. Finalidad del tratamiento',
            body: 'Usamos tus datos exclusivamente para prestarte el servicio: gestionar tu cuenta, mostrar tu historial de partidas y ofrecer recomendaciones personalizadas. No vendemos datos a terceros ni los usamos para publicidad personalizada.',
          },
          {
            title: '4. Publicidad',
            body: 'Ludum muestra publicidad para cubrir sus costes de operación. Los anuncios pueden ser contextuales (basados en el contenido de la página) pero no en tu perfil personal.',
          },
          {
            title: '5. Cookies',
            body: 'Usamos únicamente cookies técnicas necesarias para mantener tu sesión iniciada. No utilizamos cookies de seguimiento de terceros.',
          },
          {
            title: '6. Tus derechos',
            body: 'Tienes derecho a acceder, rectificar o eliminar tus datos. Para ejercerlos, escríbenos a hola@ludum.es indicando tu solicitud. Eliminaremos tu cuenta y todos tus datos en un plazo máximo de 30 días.',
          },
          {
            title: '7. Seguridad',
            body: 'Tus datos se almacenan en servidores de Supabase con cifrado en tránsito (HTTPS) y en reposo. Las contraseñas nunca se almacenan en texto plano.',
          },
          {
            title: '8. Cambios en esta política',
            body: 'Podemos actualizar esta política ocasionalmente. Te notificaremos los cambios relevantes por email si tienes una cuenta activa.',
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

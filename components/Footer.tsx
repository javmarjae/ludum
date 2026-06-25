import Link from 'next/link';

const SECTIONS = [
  {
    title: 'Explorar',
    links: [
      { label: 'Buscar juegos', href: '/buscar' },
      { label: 'Recomendador', href: '/recomendador' },
      { label: 'Blog', href: '/blog' },
      { label: 'Eventos', href: '/eventos' },
    ],
  },
  {
    title: 'Comunidad',
    links: [
      { label: 'Grupos', href: '/grupos' },
      { label: 'Torneos', href: '/torneos' },
      { label: 'Comunidades', href: '/comunidades' },
      { label: 'Organizaciones', href: '/organizaciones' },
    ],
  },
  {
    title: 'Empresa',
    links: [
      { label: 'Sobre Ludum', href: '/sobre-nosotros' },
      { label: 'FAQ', href: '/faq' },
      { label: 'Contacto', href: '/contacto' },
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacidad', href: '/privacidad' },
      { label: 'Términos de uso', href: '/terminos' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-brand">
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none', marginBottom: 12 }}>
            <img src="/logo.svg" alt="Ludum" style={{ height: 30, width: 'auto', filter: 'brightness(0) invert(1) opacity(0.9)' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 18, letterSpacing: '-0.01em', color: 'rgba(255,255,255,0.92)' }}>Ludum</span>
          </Link>
          <p style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.45)', lineHeight: 1.65, maxWidth: 220 }}>
            Registra partidas, descubre juegos y conecta con otros jugadores.
          </p>
          <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)', marginTop: 20 }}>
            Datos de <a href="https://boardgamegeek.com" target="_blank" rel="noopener noreferrer" style={{ color: 'rgba(255,255,255,0.45)', textDecoration: 'none' }}>BoardGameGeek</a>
          </p>
        </div>

        <nav className="site-footer-nav" aria-label="Footer">
          {SECTIONS.map(section => (
            <div key={section.title}>
              <p style={{ fontSize: 11, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'rgba(255,255,255,0.35)', marginBottom: 14 }}>
                {section.title}
              </p>
              <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {section.links.map(link => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      style={{ fontSize: 13, fontWeight: 500, color: 'rgba(255,255,255,0.60)', textDecoration: 'none', transition: 'color 0.15s' }}
                      className="footer-link"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', marginTop: 40, paddingTop: 20, display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 8 }}>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.28)' }}>
          © {new Date().getFullYear()} Ludum. Hecho con amor por jugadores, para jugadores.
        </p>
        <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.20)' }}>
          v0.1
        </p>
      </div>
    </footer>
  );
}

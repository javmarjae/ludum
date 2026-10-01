'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { logout } from '@/app/auth/actions';

function matchesRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function MobileBottomNav({ isAdmin = false, registerHref = '/grupos' }: { isAdmin?: boolean; registerHref?: string }) {
  const pathname = usePathname();
  const [moreOpen, setMoreOpen] = useState(false);

  const sheetRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    sheetRef.current?.querySelector<HTMLElement>('a, button')?.focus();
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setMoreOpen(false);
        btnRef.current?.focus();
      }
    }
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = prevOverflow;
      document.removeEventListener('keydown', handleKey);
    };
  }, [moreOpen]);

  const moreItems = [
    { href: '/recomendador',   label: 'Recomendador',   icon: <RecommendSvg /> },
    { href: '/partidas',       label: 'Mis partidas',   icon: <TrackerSvg /> },
    { href: '/perfil',         label: 'Perfil',         icon: <ProfileSvg /> },
    { href: '/torneos',        label: 'Torneos',        icon: <TorneosSvg /> },
    { href: '/eventos',        label: 'Eventos',        icon: <EventsSvg /> },
    { href: '/notificaciones', label: 'Avisos',         icon: <BellSvg /> },
    { href: '/mensajes',       label: 'Mensajes',       icon: <ChatSvg /> },
    { href: '/blog',           label: 'Blog',           icon: <BlogSvg /> },
    ...(isAdmin ? [{ href: '/admin', label: 'Admin', icon: <AdminSvg /> }] : []),
  ];

  const registerActive = pathname.endsWith('/partidas/nueva');
  const moreActive = !registerActive && moreItems.some(i => matchesRoute(pathname, i.href));

  return (
    <>
      {moreOpen && <div className="mbn-backdrop" aria-hidden="true" onClick={() => setMoreOpen(false)} />}
      {moreOpen && (
        <div ref={sheetRef} id="mbn-more-sheet" role="dialog" aria-modal="true" aria-label="Más secciones" className="mbn-sheet">
          <div className="mbn-sheet-grip" aria-hidden="true" />
          <div className="mbn-sheet-grid">
            {moreItems.map(({ href, label, icon }) => {
              const active = matchesRoute(pathname, href);
              return (
                <Link key={href} href={href} prefetch={false} className="mbn-sheet-item" data-active={active} aria-current={active ? 'page' : undefined}>
                  {icon}
                  <span>{label}</span>
                </Link>
              );
            })}
          </div>
          <div className="mbn-sheet-footer">
            <div className="mbn-sheet-theme">
              <ThemeToggle />
              <span>Tema</span>
            </div>
            <form action={logout}>
              <button type="submit" className="mbn-sheet-logout">
                <LogoutSvg />
                Cerrar sesión
              </button>
            </form>
          </div>
        </div>
      )}

      <nav className="mobile-bottom-nav" aria-label="Navegación principal">
        <NavItem href="/" label="Inicio" icon={<HomeSvg />} active={pathname === '/'} />
        <NavItem href="/buscar" label="Buscar" icon={<SearchSvg />} active={matchesRoute(pathname, '/buscar')} />
        <Link
          href={registerHref}
          prefetch={false}
          className="mbn-item mbn-register"
          data-active={registerActive}
          aria-current={registerActive ? 'page' : undefined}
        >
          <span className="mbn-register-btn"><PlusSvg /></span>
          <span className="mbn-label">Registrar</span>
        </Link>
        <NavItem href="/grupos" label="Grupos" icon={<GroupsSvg />} active={!registerActive && matchesRoute(pathname, '/grupos')} />
        <button
          ref={btnRef}
          type="button"
          className="mbn-item"
          data-active={moreOpen || moreActive}
          onClick={() => setMoreOpen(v => !v)}
          aria-expanded={moreOpen}
          aria-controls="mbn-more-sheet"
          aria-haspopup="dialog"
        >
          <span className="mbn-icon"><GridSvg /></span>
          <span className="mbn-label">Más</span>
        </button>
      </nav>
    </>
  );
}

function NavItem({ href, label, icon, active }: { href: string; label: string; icon: React.ReactNode; active: boolean }) {
  return (
    <Link href={href} prefetch={false} className="mbn-item" data-active={active} aria-current={active ? 'page' : undefined}>
      <span className="mbn-icon">{icon}</span>
      <span className="mbn-label">{label}</span>
    </Link>
  );
}

function HomeSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 10.5 12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/><path d="M10 21v-6h4v6"/></svg>;
}
function PlusSvg() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
}
function GridSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1.5"/><rect x="14" y="3" width="7" height="7" rx="1.5"/><rect x="3" y="14" width="7" height="7" rx="1.5"/><rect x="14" y="14" width="7" height="7" rx="1.5"/></svg>;
}

function ProfileSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function GroupsSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function TrackerSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function RecommendSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function TorneosSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>;
}
function EventsSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>;
}
function SearchSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function BlogSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>;
}
function BellSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
}
function ChatSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function AdminSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function LogoutSvg() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

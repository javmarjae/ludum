'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useState, useEffect, useRef } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { logout } from '@/app/auth/actions';

function matchesRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function MobileBottomNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    router.prefetch('/recomendador');
    fetch('/api/recomendador/warm', { keepalive: true }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps
  const popupRef = useRef<HTMLDivElement>(null);
  const btnRef = useRef<HTMLButtonElement>(null);

  useEffect(() => { setMoreOpen(false); }, [pathname]);

  useEffect(() => {
    if (!moreOpen) return;
    function handleClick(e: MouseEvent) {
      const target = e.target as Node;
      if (popupRef.current?.contains(target)) return;
      if (btnRef.current?.contains(target)) return;
      setMoreOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [moreOpen]);

  const baseItems = [
    { href: '/perfil',        label: 'Perfil',   icon: <ProfileSvg /> },
    { href: '/grupos',        label: 'Grupos',   icon: <GroupsSvg /> },
    { href: '/partidas',      label: 'Tracker',  icon: <TrackerSvg /> },
    { href: '/recomendador',  label: 'Recomend', icon: <RecommendSvg /> },
    { href: '/torneos',       label: 'Torneos',  icon: <TorneosSvg /> },
    { href: '/eventos',       label: 'Eventos',  icon: <EventsSvg /> },
    { href: '/buscar',        label: 'Buscar',   icon: <SearchSvg /> },
    { href: '/blog',          label: 'Blog',     icon: <BlogSvg /> },
    { href: '/notificaciones', label: 'Noti',    icon: <BellSvg /> },
    { href: '/mensajes',      label: 'Chat',     icon: <ChatSvg /> },
  ];

  const items = isAdmin
    ? [...baseItems, { href: '/admin', label: 'Admin', icon: <AdminSvg /> }]
    : baseItems;

  return (
    <>
      {moreOpen && (
        <div
          ref={popupRef}
          style={{
            position: 'fixed',
            bottom: 'calc(62px + env(safe-area-inset-bottom, 0px) + 8px)',
            right: 12,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 16,
            padding: '10px',
            boxShadow: '0 -4px 32px rgba(58,55,47,0.18)',
            zIndex: 55,
            display: 'flex',
            flexDirection: 'column',
            gap: 4,
            minWidth: 200,
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '8px 10px' }}>
            <ThemeToggle />
            <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)' }}>Cambiar tema</span>
          </div>
          <div style={{ height: 1, background: 'var(--border)', margin: '2px 0' }} />
          <form action={logout} style={{ width: '100%' }}>
            <button
              type="submit"
              style={{
                width: '100%',
                padding: '10px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                background: 'transparent',
                color: 'var(--text-2)',
                fontSize: 14,
                fontWeight: 600,
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                fontFamily: 'inherit',
                textAlign: 'left',
              }}
            >
              <LogoutSvg />
              Cerrar sesión
            </button>
          </form>
        </div>
      )}

      <nav className="mobile-bottom-nav">
        {items.map(({ href, label, icon }) => {
          const active = matchesRoute(pathname, href);
          return (
            <Link
              key={href}
              href={href}
              style={{
                display: 'flex', flexDirection: 'column', alignItems: 'center',
                gap: 4, padding: '6px 10px', textDecoration: 'none',
                minWidth: 60, flexShrink: 0,
              }}
            >
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'var(--brand)' : 'transparent',
                color: active ? 'white' : 'var(--text-3)',
                transition: 'background 0.15s, color 0.15s',
                boxShadow: active ? '0 3px 10px rgba(62,94,59,0.35)' : 'none',
              }}>
                {icon}
              </div>
              <span style={{
                fontSize: 9, fontWeight: 700, lineHeight: 1.2, textAlign: 'center',
                letterSpacing: '0.03em',
                color: active ? 'var(--brand)' : 'var(--text-4)',
              }}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* Botón Más: tema + cerrar sesión */}
        <button
          ref={btnRef}
          onClick={() => setMoreOpen(v => !v)}
          style={{
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            gap: 4, padding: '6px 10px',
            minWidth: 58, flexShrink: 0,
            border: 'none', background: 'transparent',
            cursor: 'pointer', fontFamily: 'inherit',
          }}
        >
          <div style={{
            width: 38, height: 38, borderRadius: 11,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: moreOpen ? 'var(--brand)' : 'transparent',
            color: moreOpen ? 'white' : 'var(--text-3)',
            transition: 'background 0.15s, color 0.15s',
            boxShadow: moreOpen ? '0 3px 10px rgba(62,94,59,0.35)' : 'none',
          }}>
            <MoreSvg />
          </div>
          <span style={{
            fontSize: 9, fontWeight: 700, lineHeight: 1.2, textAlign: 'center',
            letterSpacing: '0.03em',
            color: moreOpen ? 'var(--brand)' : 'var(--text-4)',
          }}>
            Más
          </span>
        </button>
      </nav>
    </>
  );
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
function MoreSvg() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="5" r="1"/><circle cx="12" cy="12" r="1"/><circle cx="12" cy="19" r="1"/></svg>;
}
function LogoutSvg() {
  return <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}

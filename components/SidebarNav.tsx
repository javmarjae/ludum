'use client';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { ThemeToggle } from './ThemeToggle';
import { logout } from '@/app/auth/actions';
import { NotificationBell } from './NotificationBell';
import { ChatIcon } from './ChatIcon';
import { SidebarUserAvatar } from './SidebarUserAvatar';

function matchesRoute(pathname: string, href: string) {
  if (href === '/') return pathname === '/';
  return pathname === href || pathname.startsWith(href + '/');
}

export function SidebarNav({ isAdmin = false }: { isAdmin?: boolean }) {
  const pathname = usePathname();
  const router = useRouter();

  // Prefetch /recomendador shell + warm recommendation cache in background
  useEffect(() => {
    router.prefetch('/recomendador');
    fetch('/api/recomendador/warm', { keepalive: true }).catch(() => {});
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const baseItems = [
    { href: '/grupos',       label: 'Grupos',      icon: <GroupsSvg />,    homeActive: true },
    { href: '/partidas',     label: 'Tracker',     icon: <TrackerSvg /> },
    { href: '/recomendador', label: 'Recomend',    icon: <RecommendSvg /> },
    { href: '/torneos',      label: 'Torneos',     icon: <TorneosSvg /> },
    { href: '/eventos',      label: 'Eventos',     icon: <EventsSvg /> },
    { href: '/buscar',       label: 'Buscar',      icon: <SearchSvg /> },
    { href: '/blog',         label: 'Blog',        icon: <BlogSvg /> },
  ];
  const items = isAdmin
    ? [...baseItems, { href: '/admin', label: 'Admin', icon: <AdminSvg /> }]
    : baseItems;

  return (
    <nav
      className="app-sidebar"
      style={{
        width: 76,
        flexShrink: 0,
        background: 'var(--bg-card)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        padding: '14px 0 18px',
        position: 'sticky',
        top: 0,
        height: '100vh',
        zIndex: 40,
        boxShadow: '3px 0 16px rgba(58,55,47,0.07)',
      }}
    >
      {/* Logo → home */}
      <Link
        href="/"
        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: 46, height: 46, marginBottom: 4, textDecoration: 'none', borderRadius: 12 }}
      >
        <img src="/logo.svg" alt="Ludum" style={{ width: 46, height: 46, objectFit: 'contain' }} />
      </Link>

      {/* Avatar usuario */}
      <SidebarUserAvatar />

      {/* Nav items */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, width: '100%' }}>
        {items.map(({ href, label, icon, ...rest }) => {
          const home = (rest as any).homeActive;
          const active = matchesRoute(pathname, href) || (home && pathname === '/');
          return (
            <SidebarItem key={href} href={href} label={label} icon={icon} isActive={active} />
          );
        })}
        <NotificationBell />
        <ChatIcon />
      </div>

      {/* Bottom controls */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
        <ThemeToggle />
        <form action={logout}>
          <button
            type="submit"
            title="Cerrar sesión"
            style={{
              width: 36, height: 36, borderRadius: '50%', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--bg-inset)', color: 'var(--text-4)',
              boxShadow: 'var(--shadow-btn)',
              transition: 'background 0.15s, color 0.15s',
            }}
          >
            <LogoutSvg />
          </button>
        </form>
      </div>
    </nav>
  );
}

function SidebarItem({ href, label, icon, isActive }: { href: string; label: string; icon: React.ReactNode; isActive: boolean }) {
  return (
    <Link
      href={href}
      style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 5, padding: '7px 6px', borderRadius: 12, textDecoration: 'none', width: 66 }}
    >
      <div
        style={{
          width: 46,
          height: 46,
          borderRadius: 13,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isActive ? 'var(--brand)' : 'transparent',
          color: isActive ? 'white' : 'var(--text-3)',
          transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
          boxShadow: isActive ? '0 4px 12px rgba(62,94,59,0.38)' : 'none',
        }}
      >
        {icon}
      </div>
      <span style={{ fontSize: 9, fontWeight: 700, color: isActive ? 'var(--brand)' : 'var(--text-4)', textAlign: 'center', letterSpacing: '0.03em', lineHeight: 1.2 }}>
        {label}
      </span>
    </Link>
  );
}

/* ── Icons ─────────────────────────────────────────── */

function ProfileSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
}
function GroupsSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>;
}
function TrackerSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>;
}
function RecommendSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
}
function SearchSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>;
}
function CommunitySvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>;
}
function EventsSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" ry="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/><path d="M8 14h.01"/><path d="M12 14h.01"/><path d="M16 14h.01"/><path d="M8 18h.01"/><path d="M12 18h.01"/></svg>;
}
function TorneosSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>;
}
function BlogSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/><line x1="9" y1="7" x2="15" y2="7"/><line x1="9" y1="11" x2="15" y2="11"/></svg>;
}
function LogoutSvg() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function AdminSvg() {
  return <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}

import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Nav, NavLink, NavButton, ThemeToggle } from './Nav';

function BlogIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 20h9" />
      <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4L16.5 3.5z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="11" cy="11" r="8" />
      <line x1="21" y1="21" x2="16.65" y2="16.65" />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
    </svg>
  );
}

function GroupsIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

function UserIcon() {
  return (
    <svg width="17" height="17" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

/* Auth-aware top nav: slim back bar for logged-in users, full nav for guests */
export async function AppNav({ back }: { back?: { href: string; label: string } }) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (user) {
    if (!back) return null;
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          padding: '0 28px',
          height: 52,
          borderBottom: '1px solid var(--border)',
          background: 'var(--bg-card)',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          position: 'sticky',
          top: 0,
          zIndex: 30,
        }}
      >
        <Link
          href={back.href}
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            fontSize: 13,
            fontWeight: 700,
            color: 'var(--text-3)',
            textDecoration: 'none',
            padding: '6px 12px',
            borderRadius: 8,
            background: 'var(--bg-inset)',
            boxShadow: 'var(--shadow-btn)',
          }}
        >
          ← {back.label}
        </Link>
      </div>
    );
  }

  return (
    <Nav
      back={back}
      right={
        <>
          <NavLink href="/blog" icon={<BlogIcon />}>Blog</NavLink>
          <NavLink href="/buscar" icon={<SearchIcon />}>Buscar</NavLink>
          <NavLink href="/recomendador" icon={<StarIcon />}>Recomendador</NavLink>
          <NavLink href="/grupos" icon={<GroupsIcon />}>Mis grupos</NavLink>
          <ThemeToggle />
          <NavButton href="/perfil" variant="brand" icon={<UserIcon />}>Perfil</NavButton>
        </>
      }
      mobileItems={[
        { href: '/blog',          label: 'Blog' },
        { href: '/buscar',        label: 'Buscar' },
        { href: '/recomendador',  label: 'Recomendador' },
        { href: '/grupos',        label: 'Mis grupos' },
        { href: '/perfil',        label: 'Entrar', variant: 'brand' },
      ]}
    />
  );
}

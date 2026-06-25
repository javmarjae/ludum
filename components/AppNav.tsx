import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Nav, NavLink, NavButton, ThemeToggle } from './Nav';

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
          <NavLink href="/blog">Blog</NavLink>
          <NavLink href="/buscar">Buscar</NavLink>
          <NavLink href="/recomendador">Recomendador</NavLink>
          <NavLink href="/grupos">Mis grupos</NavLink>
          <ThemeToggle />
          <NavButton href="/perfil" variant="brand">Perfil</NavButton>
        </>
      }
      mobileItems={[
        { href: '/blog', label: 'Blog' },
        { href: '/buscar', label: 'Buscar' },
        { href: '/recomendador', label: 'Recomendador' },
        { href: '/grupos', label: 'Mis grupos' },
        { href: '/perfil', label: 'Entrar / Perfil', variant: 'brand' },
      ]}
    />
  );
}

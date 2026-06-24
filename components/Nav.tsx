import Link from 'next/link';
import { ThemeToggle } from './ThemeToggle';

export { ThemeToggle };

interface NavProps {
  back?: { href: string; label: string };
  right?: React.ReactNode;
}

export function Nav({ back, right }: NavProps) {
  return (
    <header className="app-nav" style={{ backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderBottom: '1px solid var(--border)', position: 'sticky', top: 0, zIndex: 50 }}>
      <div style={{ maxWidth: 1120, margin: '0 auto', padding: '0 24px', height: 64, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24 }}>
          <Link href="/" style={{ display: 'flex', alignItems: 'center', gap: 10, textDecoration: 'none' }}>
            <img src="/logo.svg" alt="Ludum" style={{ height: 36, width: 'auto' }} />
            <span style={{ fontFamily: 'var(--font-display)', fontWeight: 700, fontSize: 20, letterSpacing: '-0.01em', color: 'var(--brand)' }}>Ludum</span>
          </Link>
          {back && (
            <Link href={back.href} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-3)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
              ← {back.label}
            </Link>
          )}
        </div>
        {right && <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>{right}</div>}
      </div>
    </header>
  );
}

export function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link href={href} style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-2)', textDecoration: 'none' }}>
      {children}
    </Link>
  );
}

export function NavButton({ href, children, variant = 'ghost' }: { href: string; children: React.ReactNode; variant?: 'ghost' | 'brand' }) {
  return (
    <Link
      href={href}
      style={{
        fontSize: 14,
        fontWeight: 700,
        padding: '7px 16px',
        borderRadius: 8,
        textDecoration: 'none',
        color: variant === 'brand' ? 'white' : 'var(--text-2)',
        background: variant === 'brand' ? 'var(--brand)' : 'var(--bg-card)',
        boxShadow: variant === 'brand' ? 'var(--shadow-btn-brand)' : 'var(--shadow-btn)',
      }}
    >
      {children}
    </Link>
  );
}

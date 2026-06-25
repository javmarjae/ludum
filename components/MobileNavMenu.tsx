'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface MenuItem {
  href: string;
  label: string;
  variant?: 'brand';
}

export function MobileNavMenu({ items }: { items: MenuItem[] }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  useEffect(() => { setOpen(false); }, [pathname]);

  useEffect(() => {
    if (!open) return;
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(v => !v)}
        aria-label={open ? 'Cerrar menú' : 'Abrir menú'}
        aria-expanded={open}
        style={{
          width: 40, height: 40, borderRadius: 10,
          border: 'none', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open ? 'var(--bg-inset)' : 'transparent',
          color: 'var(--text-2)',
          transition: 'background 0.15s',
        }}
      >
        {open ? <CloseIcon /> : <HamburgerIcon />}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute', top: 'calc(100% + 8px)', right: 0,
            minWidth: 200,
            background: 'var(--bg-card)',
            border: '1px solid var(--border)',
            borderRadius: 14,
            boxShadow: '0 8px 32px rgba(58,55,47,0.14)',
            padding: '6px',
            display: 'flex', flexDirection: 'column', gap: 2,
            zIndex: 100,
          }}
        >
          {items.map(({ href, label, variant }) => (
            <Link
              key={href}
              href={href}
              onClick={() => setOpen(false)}
              className={variant !== 'brand' ? 'mobile-nav-link' : undefined}
              style={{
                padding: '10px 14px',
                borderRadius: 10,
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 700,
                color: variant === 'brand' ? 'white' : 'var(--text-1)',
                background: variant === 'brand' ? 'var(--brand)' : 'transparent',
                transition: 'background 0.12s',
                display: 'block',
              }}
            >
              {label}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function HamburgerIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="3" y1="6" x2="21" y2="6" />
      <line x1="3" y1="12" x2="21" y2="12" />
      <line x1="3" y1="18" x2="21" y2="18" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  );
}

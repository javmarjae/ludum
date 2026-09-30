'use client';

import { useState, type ReactNode } from 'react';

/* Recorta el texto solo en móvil (ver .read-more en globals.css); el contenido completo sigue en el DOM para SEO. */
export function ReadMore({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(false);
  return (
    <div className="read-more" data-open={open}>
      <div className="read-more-body">{children}</div>
      <button type="button" className="read-more-btn" aria-expanded={open} onClick={() => setOpen(o => !o)}>
        {open ? 'Leer menos' : 'Leer más'}
      </button>
    </div>
  );
}

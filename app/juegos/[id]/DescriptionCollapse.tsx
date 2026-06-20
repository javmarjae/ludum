'use client';

import { useState } from 'react';

export function DescriptionCollapse({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const isLong = text.length > 600;
  const shown = !expanded && isLong ? text.slice(0, 600) : text;

  return (
    <div>
      <p style={{ fontSize: 14, fontWeight: 500, color: 'var(--text-2)', lineHeight: 1.7, whiteSpace: 'pre-line' }}>
        {shown}{!expanded && isLong && '…'}
      </p>
      {isLong && (
        <button
          onClick={() => setExpanded(!expanded)}
          style={{
            marginTop: 8, fontSize: 13, fontWeight: 700, color: 'var(--brand)',
            background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', padding: 0,
          }}
        >
          {expanded ? 'Ver menos ↑' : 'Ver más ↓'}
        </button>
      )}
    </div>
  );
}

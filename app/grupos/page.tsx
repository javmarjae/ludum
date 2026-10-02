import { Suspense } from 'react';
import { getAuthUserLite } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import type { Metadata } from 'next';
import { GruposContent } from './GruposContent';
import { GruposSkeleton } from './GruposSkeleton';

// @next-codemod-ignore Cache Components adoption: this segment temporarily allows blocking.
// Remove this opt-out after verifying the segment passes validation without it.
// See: https://nextjs.org/docs/app/guides/migrating-to-cache-components
export const instant = false;

export const metadata: Metadata = { title: 'Grupos y Comunidades' };

export default async function GruposPage({ searchParams }: { searchParams: Promise<{ org_request?: string }> }) {
  // Solo gating de UI: los datos reales van protegidos por RLS.
  const user = await getAuthUserLite();
  if (!user) redirect('/auth/login?next=/grupos');
  const { org_request } = await searchParams;

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh' }}>
      <div style={{ maxWidth: 860, margin: '0 auto', padding: '48px clamp(16px,4vw,32px) 80px' }}>

        {/* Banner solicitud org enviada */}
        {org_request === 'sent' && (
          <div style={{ borderRadius: 16, padding: '16px 20px', background: 'var(--brand-tint)', border: '1.5px solid rgba(62,94,59,0.2)', marginBottom: 28, display: 'flex', alignItems: 'center', gap: 12 }}>
            <span style={{ fontSize: 22 }}>✅</span>
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: 'var(--brand)', marginBottom: 2 }}>Solicitud enviada</p>
              <p style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-3)' }}>Revisaremos tu solicitud en 1–3 días hábiles y recibirás una notificación.</p>
            </div>
          </div>
        )}

        <Suspense fallback={<GruposSkeleton />}>
          <GruposContent userId={user.id} />
        </Suspense>

      </div>
    </div>
  );
}

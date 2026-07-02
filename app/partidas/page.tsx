import { Suspense } from 'react';
import { getAuthUserLite } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { TrackerContent } from './TrackerContent';
import { TrackerSkeleton } from './TrackerSkeleton';
import type { Metadata } from 'next';

export const metadata: Metadata = { title: 'Tracker' };

export default async function TrackerPage() {
  // Solo gating de UI: los datos reales van protegidos por RLS.
  const user = await getAuthUserLite();
  if (!user) redirect('/auth/login?next=/partidas');

  return (
    <Suspense fallback={<TrackerSkeleton />}>
      <TrackerContent userId={user.id} />
    </Suspense>
  );
}

import { createAdminClient } from '@/lib/supabase/admin';
import { OrgRequests } from './OrgRequests';

export default async function OrgRequestsSection() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('organization_requests')
    .select('id, name, type, description, location, website, created_at, profiles(display_name, avatar_url)')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: true });

  return <OrgRequests requests={(data ?? []) as any[]} />;
}

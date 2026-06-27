import { createAdminClient } from '@/lib/supabase/admin';
import { VerificationRequests } from './VerificationRequests';

export default async function VerificationRequestsSection() {
  const admin = createAdminClient();
  const { data } = await admin
    .from('verification_requests')
    .select('id, user_id, reason, category, social_links, created_at, profiles!user_id(display_name, avatar_url)')
    .eq('status', 'pendiente')
    .order('created_at', { ascending: true });

  const requests = data ?? [];

  // Fetch emails only for the pending users (typically 0–5) instead of all auth users.
  const emailEntries = await Promise.all(
    requests.map(async r => {
      const { data: u } = await admin.auth.admin.getUserById(r.user_id);
      return [r.user_id, u?.user?.email ?? ''] as [string, string];
    })
  );
  const emailMap = Object.fromEntries(emailEntries);

  const verifRequests = (requests as any[]).map(r => ({
    ...r,
    email: emailMap[r.user_id] ?? '',
  }));

  return <VerificationRequests requests={verifRequests} />;
}

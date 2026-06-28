import { NextResponse } from 'next/server';
import { getAuthUser, createClient } from '@/lib/supabase/server';
import { getCachedGroupRecommendations } from '@/lib/recommender';

// Warms the recommendation cache for the user's top groups.
// Called in the background from the sidebar on every page load.
export async function GET() {
  try {
    const user = await getAuthUser();
    if (!user) return NextResponse.json({ ok: false }, { status: 401 });

    const supabase = await createClient();
    const { data: memberships } = await supabase
      .from('group_members')
      .select('group_id, groups(id, group_members(count))')
      .eq('profile_id', user.id)
      .limit(2);

    // Warm cache for the top 2 groups sequentially (avoids hammering DB)
    for (const m of memberships ?? []) {
      const g = (m as any).groups;
      if (!g) continue;
      const memberCount = (g.group_members?.[0]?.count as number) ?? 1;
      await getCachedGroupRecommendations(m.group_id, memberCount);
    }

    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false });
  }
}

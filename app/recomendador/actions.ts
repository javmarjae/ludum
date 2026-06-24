'use server';

import { getGroupRecommendations, type GroupRecommendation, type GroupFilters } from '@/lib/recommender';

export async function dismissAndGetNext(
  groupId: string,
  memberCount: number,
  skippedGameIds: string[],
  filters?: GroupFilters
): Promise<GroupRecommendation | null> {
  const recs = await getGroupRecommendations(groupId, memberCount, {
    ...filters,
    skippedGameIds,
  });
  return recs?.top ?? null;
}

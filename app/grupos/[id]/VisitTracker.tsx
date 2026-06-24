'use client';
import { useEffect } from 'react';
import { trackGroupVisit } from './actions';

export function VisitTracker({ groupId }: { groupId: string }) {
  useEffect(() => {
    trackGroupVisit(groupId);
  }, [groupId]);
  return null;
}

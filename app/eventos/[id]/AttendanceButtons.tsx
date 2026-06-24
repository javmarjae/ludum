'use client';

import { useState, useTransition } from 'react';
import { toggleAttendance } from '../actions';

type Status = 'interested' | 'going' | null;

interface Props {
  eventId: string;
  myStatus: Status;
  goingCount: number;
  interestedCount: number;
}

export function AttendanceButtons({ eventId, myStatus: initialStatus, goingCount: initialGoing, interestedCount: initialInterested }: Props) {
  const [myStatus, setMyStatus] = useState<Status>(initialStatus);
  const [goingCount, setGoingCount] = useState(initialGoing);
  const [interestedCount, setInterestedCount] = useState(initialInterested);
  const [isPending, startTransition] = useTransition();

  function handleToggle(status: 'interested' | 'going') {
    const prev = myStatus;
    // Optimistic update
    setMyStatus(s => s === status ? null : status);
    if (status === 'going') {
      setGoingCount(c => prev === 'going' ? c - 1 : c + 1);
      if (prev === 'interested') setInterestedCount(c => c - 1);
    } else {
      setInterestedCount(c => prev === 'interested' ? c - 1 : c + 1);
      if (prev === 'going') setGoingCount(c => c - 1);
    }

    startTransition(async () => {
      try {
        await toggleAttendance(eventId, status);
      } catch {
        // Revert on error
        setMyStatus(prev);
        setGoingCount(initialGoing);
        setInterestedCount(initialInterested);
      }
    });
  }

  const btnBase: React.CSSProperties = {
    flex: 1, padding: '12px 0', borderRadius: 12, border: 'none',
    cursor: isPending ? 'wait' : 'pointer', fontSize: 14, fontWeight: 700,
    transition: 'background 0.15s, color 0.15s, box-shadow 0.15s',
    opacity: isPending ? 0.75 : 1,
  };

  return (
    <div style={{ display: 'flex', gap: 10 }}>
      <button
        onClick={() => handleToggle('interested')}
        disabled={isPending}
        style={{
          ...btnBase,
          background: myStatus === 'interested' ? '#7C3AED' : 'var(--bg-inset)',
          color: myStatus === 'interested' ? 'white' : 'var(--text-2)',
          boxShadow: myStatus === 'interested' ? '0 4px 14px rgba(124,58,237,0.35)' : 'var(--shadow-btn)',
        }}
      >
        ⭐ Me interesa{interestedCount > 0 ? ` (${interestedCount})` : ''}
      </button>
      <button
        onClick={() => handleToggle('going')}
        disabled={isPending}
        style={{
          ...btnBase,
          background: myStatus === 'going' ? 'var(--brand)' : 'var(--bg-inset)',
          color: myStatus === 'going' ? 'white' : 'var(--text-2)',
          boxShadow: myStatus === 'going' ? '0 4px 14px rgba(62,94,59,0.35)' : 'var(--shadow-btn)',
        }}
      >
        ✅ Asistiré{goingCount > 0 ? ` (${goingCount})` : ''}
      </button>
    </div>
  );
}

'use client';

import { useState } from 'react';
import { followUser, unfollowUser } from '../actions';

interface Props {
  profileId: string;
  initialIsFollowing: boolean;
  initialFollowersCount: number;
}

export function FollowButton({ profileId, initialIsFollowing, initialFollowersCount }: Props) {
  const [isFollowing, setIsFollowing] = useState(initialIsFollowing);
  const [followersCount, setFollowersCount] = useState(initialFollowersCount);
  const [loading, setLoading] = useState(false);

  async function handleToggle() {
    setLoading(true);
    if (isFollowing) {
      setIsFollowing(false);
      setFollowersCount((c) => c - 1);
      await unfollowUser(profileId);
    } else {
      setIsFollowing(true);
      setFollowersCount((c) => c + 1);
      await followUser(profileId);
    }
    setLoading(false);
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
      <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-3)' }}>
        <strong style={{ color: 'var(--text)', fontWeight: 800 }}>{followersCount}</strong>{' '}
        {followersCount === 1 ? 'seguidor' : 'seguidores'}
      </span>
      <button
        onClick={handleToggle}
        disabled={loading}
        style={{
          padding: '9px 22px',
          borderRadius: 999,
          fontSize: 14,
          fontWeight: 700,
          border: isFollowing ? '1.5px solid var(--border)' : 'none',
          cursor: loading ? 'default' : 'pointer',
          fontFamily: 'inherit',
          opacity: loading ? 0.7 : 1,
          transition: 'all 0.15s',
          background: isFollowing ? 'var(--bg-card)' : 'var(--brand)',
          color: isFollowing ? 'var(--text-2)' : 'white',
          boxShadow: isFollowing ? 'var(--shadow-btn)' : 'var(--shadow-btn-brand)',
        }}
      >
        {isFollowing ? 'Siguiendo' : 'Seguir'}
      </button>
    </div>
  );
}

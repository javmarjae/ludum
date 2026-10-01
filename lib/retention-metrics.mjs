const DAY_MS = 24 * 60 * 60 * 1000;

function percent(part, total) {
  return total >= 5 ? Math.round((part / total) * 1000) / 10 : null;
}

export function calculateRetentionCohorts(groups, plays, now = Date.now()) {
  const playTimesByGroup = new Map();
  for (const play of plays) {
    if (!play.group_id || !play.created_at) continue;
    const createdAt = Date.parse(play.created_at);
    if (!Number.isFinite(createdAt)) continue;
    const timestamps = playTimesByGroup.get(play.group_id) ?? [];
    timestamps.push(createdAt);
    playTimesByGroup.set(play.group_id, timestamps);
  }

  const cohorts = new Map();
  for (const group of groups) {
    if (!group.id || !group.created_at) continue;
    const createdAt = Date.parse(group.created_at);
    if (!Number.isFinite(createdAt) || createdAt > now) continue;

    const month = new Date(createdAt).toISOString().slice(0, 7);
    const cohort = cohorts.get(month) ?? {
      month,
      groupsCreated: 0,
      activationEligible: 0,
      activatedWithin7Days: 0,
      repeat7Eligible: 0,
      repeatedWithin7Days: 0,
      repeat30Eligible: 0,
      repeatedWithin30Days: 0,
    };
    cohort.groupsCreated += 1;

    const playTimes = (playTimesByGroup.get(group.id) ?? [])
      .filter((playedAt) => playedAt >= createdAt && playedAt <= now)
      .sort((a, b) => a - b);
    const firstPlayAt = playTimes[0];
    const hasFirstPlay = Number.isFinite(firstPlayAt);

    if (createdAt <= now - 7 * DAY_MS) {
      cohort.activationEligible += 1;
      if (hasFirstPlay && firstPlayAt <= createdAt + 7 * DAY_MS) {
        cohort.activatedWithin7Days += 1;
      }
    }

    if (hasFirstPlay && firstPlayAt <= now - 7 * DAY_MS) {
      cohort.repeat7Eligible += 1;
      if (playTimes.some((playedAt) => playedAt > firstPlayAt && playedAt <= firstPlayAt + 7 * DAY_MS)) {
        cohort.repeatedWithin7Days += 1;
      }
    }

    if (hasFirstPlay && firstPlayAt <= now - 30 * DAY_MS) {
      cohort.repeat30Eligible += 1;
      if (playTimes.some((playedAt) => playedAt > firstPlayAt && playedAt <= firstPlayAt + 30 * DAY_MS)) {
        cohort.repeatedWithin30Days += 1;
      }
    }

    cohorts.set(month, cohort);
  }

  return [...cohorts.values()]
    .sort((a, b) => a.month.localeCompare(b.month))
    .map((cohort) => ({
      cohort_month: cohort.month,
      groups_created: cohort.groupsCreated,
      activation_eligible_7d: cohort.activationEligible,
      first_play_within_7d: cohort.activatedWithin7Days,
      activation_rate_7d_pct: percent(cohort.activatedWithin7Days, cohort.activationEligible),
      repeat_eligible_7d: cohort.repeat7Eligible,
      groups_repeated_within_7d: cohort.repeatedWithin7Days,
      repeat_rate_7d_pct: percent(cohort.repeatedWithin7Days, cohort.repeat7Eligible),
      repeat_eligible_30d: cohort.repeat30Eligible,
      groups_repeated_within_30d: cohort.repeatedWithin30Days,
      repeat_rate_30d_pct: percent(cohort.repeatedWithin30Days, cohort.repeat30Eligible),
    }));
}
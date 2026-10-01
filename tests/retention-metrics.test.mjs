import assert from 'node:assert/strict';
import test from 'node:test';
import { calculateRetentionCohorts } from '../lib/retention-metrics.mjs';

const date = (value) => Date.parse(`2026-06-${value}T00:00:00.000Z`);
const iso = (value) => new Date(date(value)).toISOString();
const NOW = Date.parse('2026-07-03T00:00:00.000Z');

test('measures activation and repeat windows from group creation and first recorded play', () => {
  const rows = calculateRetentionCohorts(
    [{ id: 'g1', created_at: iso('01') }],
    [
      { group_id: 'g1', created_at: iso('02') },
      { group_id: 'g1', created_at: iso('08') },
      { group_id: 'g1', created_at: iso('20') },
    ],
    NOW,
  );

  assert.deepEqual(rows, [{
    cohort_month: '2026-06',
    groups_created: 1,
    activation_eligible_7d: 1,
    first_play_within_7d: 1,
    activation_rate_7d_pct: null,
    repeat_eligible_7d: 1,
    groups_repeated_within_7d: 1,
    repeat_rate_7d_pct: null,
    repeat_eligible_30d: 1,
    groups_repeated_within_30d: 1,
    repeat_rate_30d_pct: null,
  }]);
});

test('excludes immature windows and plays recorded before group creation', () => {
  const rows = calculateRetentionCohorts(
    [
      { id: 'mature', created_at: iso('01') },
      { id: 'new', created_at: iso('28') },
    ],
    [
      { group_id: 'mature', created_at: '2026-05-31T00:00:00.000Z' },
      { group_id: 'new', created_at: iso('29') },
    ],
    NOW,
  );

  assert.equal(rows[0].activation_eligible_7d, 1);
  assert.equal(rows[0].first_play_within_7d, 0);
  assert.equal(rows[0].repeat_eligible_7d, 0);
  assert.equal(rows[0].groups_created, 2);
});

test('suppresses rates below five eligible groups and reports them at five', () => {
  const groups = Array.from({ length: 5 }, (_, index) => ({
    id: `g${index}`,
    created_at: iso('01'),
  }));
  const plays = groups.flatMap(({ id }) => [
    { group_id: id, created_at: iso('02') },
    { group_id: id, created_at: iso('03') },
  ]);

  const rows = calculateRetentionCohorts(groups, plays, NOW);
  assert.equal(rows[0].activation_eligible_7d, 5);
  assert.equal(rows[0].activation_rate_7d_pct, 100);
  assert.equal(rows[0].repeat_eligible_7d, 5);
  assert.equal(rows[0].repeat_rate_7d_pct, 100);
});
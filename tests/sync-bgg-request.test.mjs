import assert from 'node:assert/strict';
import test from 'node:test';
import { isAuthorizedSyncBggRequest, parseSyncBggParams } from '../lib/sync-bgg-request.mjs';

test('accepts the configured secret in a dedicated header', () => {
  const headers = new Headers({ 'x-cron-secret': 'test-secret' });
  assert.equal(isAuthorizedSyncBggRequest(headers, 'test-secret'), true);
});

test('accepts a bearer token and rejects an absent or incorrect secret', () => {
  assert.equal(isAuthorizedSyncBggRequest(new Headers({ authorization: 'Bearer test-secret' }), 'test-secret'), true);
  assert.equal(isAuthorizedSyncBggRequest(new Headers(), 'test-secret'), false);
  assert.equal(isAuthorizedSyncBggRequest(new Headers({ 'x-cron-secret': 'wrong' }), 'test-secret'), false);
  assert.equal(isAuthorizedSyncBggRequest(new Headers({ 'x-cron-secret': 'test-secret' }), undefined), false);
});

test('defaults to ranked mode and a batch of 100', () => {
  assert.deepEqual(parseSyncBggParams(new URLSearchParams()), { ok: true, mode: 'ranked', batch: 100 });
});

test('accepts supported modes and batch boundaries', () => {
  assert.deepEqual(parseSyncBggParams(new URLSearchParams('mode=new&batch=1')), { ok: true, mode: 'new', batch: 1 });
  assert.deepEqual(parseSyncBggParams(new URLSearchParams('mode=all&batch=200')), { ok: true, mode: 'all', batch: 200 });
});

test('rejects unknown modes and invalid batch values', () => {
  assert.equal(parseSyncBggParams(new URLSearchParams('mode=other')).ok, false);
  for (const batch of ['0', '-1', '201', '1.5', '10oops', '']) {
    assert.equal(parseSyncBggParams(new URLSearchParams(`batch=${batch}`)).ok, false, `batch=${batch}`);
  }
});

test('a secret in query parameters is never considered authentication', () => {
  const headers = new Headers();
  const query = new URLSearchParams('secret=test-secret');
  assert.equal(isAuthorizedSyncBggRequest(headers, 'test-secret'), false);
  assert.equal(parseSyncBggParams(query).ok, true);
});
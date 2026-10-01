export type SyncBggMode = 'ranked' | 'new' | 'all';

export type SyncBggParams =
  | { ok: true; mode: SyncBggMode; batch: number }
  | { ok: false; error: string };

export function isAuthorizedSyncBggRequest(headers: Headers, expectedSecret: string | undefined): boolean;
export function parseSyncBggParams(searchParams: URLSearchParams): SyncBggParams;
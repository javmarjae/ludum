const VALID_MODES = new Set(['ranked', 'new', 'all']);

export function isAuthorizedSyncBggRequest(headers, expectedSecret) {
  if (!expectedSecret) return false;

  const bearerSecret = headers.get('authorization')?.match(/^Bearer\s+(.+)$/i)?.[1] ?? null;
  const providedSecret = headers.get('x-cron-secret') ?? bearerSecret;
  return providedSecret === expectedSecret;
}

export function parseSyncBggParams(searchParams) {
  const mode = searchParams.get('mode') ?? 'ranked';
  if (!VALID_MODES.has(mode)) {
    return { ok: false, error: 'Modo no válido' };
  }

  const batch = Number(searchParams.get('batch') ?? '100');
  if (!Number.isInteger(batch) || batch < 1 || batch > 200) {
    return { ok: false, error: 'Batch debe ser un entero entre 1 y 200' };
  }

  return { ok: true, mode, batch };
}
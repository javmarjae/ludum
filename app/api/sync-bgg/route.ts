/**
 * POST /api/sync-bgg
 *
 * Endpoint de sincronización con BGG — llamado por el cron job diario de Vercel.
 * Protegido por CRON_SECRET para que solo pueda invocarlo el propio sistema.
 *
 * Modos (query param ?mode=):
 *   ranked   — actualiza los juegos rankeados con last_synced_at más antiguo (por defecto)
 *   new      — juegos sin last_synced_at (nunca sincronizados), rankeados primero
 *   all      — todos los juegos, más antiguos primero
 *
 * Query params:
 *   batch    — cuántos juegos procesar por invocación (default: 100)
 */

import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
);

const BGG_USER = process.env.BGG_USERNAME!;
const BGG_PASS = process.env.BGG_PASSWORD!;

// ── Auth BGG ──────────────────────────────────────────────────────────────────
async function bggLogin(): Promise<string> {
  const res = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
    body: JSON.stringify({ credentials: { username: BGG_USER, password: BGG_PASS } }),
  });
  if (res.status !== 204) throw new Error(`BGG login failed: ${res.status}`);

  const cookieMap = new Map<string, string>();
  for (const raw of (res.headers.getSetCookie?.() ?? [])) {
    const [name, value] = raw.split(';')[0].split('=');
    if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
  }
  return [...cookieMap.values()].join('; ');
}

// ── Fetch game from Geekdo JSON API ──────────────────────────────────────────
async function fetchGame(bggId: number, cookies: string): Promise<Record<string, unknown> | null> {
  const res = await fetch(
    `https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=${bggId}`,
    { headers: { 'User-Agent': 'Mozilla/5.0', Cookie: cookies, Accept: 'application/json' } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  return data?.item ?? null;
}

// ── Parse response ────────────────────────────────────────────────────────────
function stripHtml(str: string): string {
  return str
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&#[0-9]+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1))))
    .replace(/\n{3,}/g, '\n\n').trim();
}

function parseGameItem(item: Record<string, unknown>): Record<string, unknown> {
  const links = (item.links as Record<string, Array<{ name: string; objectid: string }>>) ?? {};
  const subtypes = (item.subtypes as string[]) ?? [];

  const mechanics  = (links.boardgamemechanic  ?? []).map(l => l.name).filter(Boolean);
  const categories = (links.boardgamecategory  ?? []).map(l => l.name).filter(Boolean);

  const isExpansion  = subtypes.includes('boardgameexpansion');
  const parentLink   = (links.expandsboardgame ?? [])[0];
  const parentBggId  = parentLink ? parseInt(parentLink.objectid) : null;
  const numExpansions = (links.boardgameexpansion ?? []).length || null;

  const imageSets = item.imageSets as Record<string, { src: string }> | null;
  const rawImg = imageSets?.['480x360']?.src ?? imageSets?.['320x240']?.src
    ?? (item.imageurl as string | null) ?? null;
  const imgUrl = rawImg ? (rawImg.startsWith('//') ? `https:${rawImg}` : rawImg) : null;

  const rawDesc = item.description as string | null;
  const desc    = rawDesc ? stripHtml(rawDesc).slice(0, 3000) : null;

  const n = (key: string) => item[key] ? parseInt(item[key] as string) : null;

  return {
    ...(imgUrl      ? { image_url: imgUrl }            : {}),
    ...(n('yearpublished') ? { year_published: n('yearpublished') } : {}),
    ...(n('minplayers')    ? { min_players: n('minplayers') }       : {}),
    ...(n('maxplayers')    ? { max_players: n('maxplayers') }       : {}),
    ...(n('minplaytime')   ? { min_playtime: n('minplaytime') }     : {}),
    ...(n('maxplaytime')   ? { max_playtime: n('maxplaytime') }     : {}),
    ...(n('minage')        ? { min_age: n('minage') }               : {}),
    ...(desc               ? { description: desc }                  : {}),
    ...(mechanics.length   ? { mechanics }                          : {}),
    ...(categories.length  ? { categories }                         : {}),
    ...(numExpansions      ? { num_expansions: numExpansions }      : {}),
    is_expansion:   isExpansion,
    parent_bgg_id:  isExpansion && parentBggId ? parentBggId : null,
    last_synced_at: new Date().toISOString(),
  };
}

// ── Handler ───────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  // Verificar secreto del cron
  const secret = req.headers.get('x-cron-secret') ?? req.nextUrl.searchParams.get('secret');
  if (secret !== process.env.CRON_SECRET) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const mode  = req.nextUrl.searchParams.get('mode') ?? 'ranked';
  const batch = parseInt(req.nextUrl.searchParams.get('batch') ?? '100');

  try {
    // Cargar juegos a sincronizar
    let query = supabase
      .from('games')
      .select('id, bgg_id')
      .order('last_synced_at', { ascending: true, nullsFirst: true })
      .limit(batch);

    if (mode === 'ranked') {
      query = query.gt('bgg_rank', 0);
    } else if (mode === 'new') {
      query = query.is('last_synced_at', null).gt('bgg_rank', 0);
    }

    const { data: games, error: dbErr } = await query;
    if (dbErr) throw new Error(dbErr.message);
    if (!games?.length) return NextResponse.json({ updated: 0, message: 'Nada que sincronizar' });

    const cookies = await bggLogin();
    let updated = 0;
    let failed  = 0;

    // Procesar con pequeñas ráfagas de 5 concurrentes
    const CONCURRENCY = 5;
    const delay = (ms: number) => new Promise(r => setTimeout(r, ms));

    for (let i = 0; i < games.length; i += CONCURRENCY) {
      const chunk = games.slice(i, i + CONCURRENCY);

      await Promise.all(chunk.map(async game => {
        try {
          const item = await fetchGame(game.bgg_id, cookies);
          if (!item) { failed++; return; }

          const patch = parseGameItem(item);
          const { error } = await supabase.from('games').update(patch).eq('id', game.id);
          if (error) throw new Error(error.message);
          updated++;
        } catch {
          failed++;
        }
      }));

      if (i + CONCURRENCY < games.length) await delay(300);
    }

    return NextResponse.json({
      updated,
      failed,
      mode,
      batch: games.length,
      timestamp: new Date().toISOString(),
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

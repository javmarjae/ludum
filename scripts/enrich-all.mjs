/**
 * Full BGG enrichment using the Geekdo JSON API (authenticated).
 *
 * Fields updated per game:
 *   image_url, min/max_players, min/max_playtime, year_published, min_age,
 *   description, mechanics[], categories[], num_expansions,
 *   is_expansion, parent_bgg_id, last_synced_at
 *
 * Note: complexity, bgg_rating, bgg_rank, num_ratings, num_owned, best_players
 *       require the BGG XMLapi2 which now returns 401.
 *
 * Usage:
 *   node scripts/enrich-all.mjs
 *   node scripts/enrich-all.mjs --resume             # continue from checkpoint
 *   node scripts/enrich-all.mjs --only-missing       # skip games with description+mechanics
 *   node scripts/enrich-all.mjs --ranked-only        # only games with bgg_rank > 0
 *   node scripts/enrich-all.mjs --concurrency=5 --delay=300
 *   node scripts/enrich-all.mjs --limit=5000
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = join(__dir, '.enrich-checkpoint.json');

// ── Env ──────────────────────────────────────────────────────────────────────
const env = Object.fromEntries(
  readFileSync(join(__dir, '../.env.local'), 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
const BGG_USER = env['BGG_USERNAME'];
const BGG_PASS = env['BGG_PASSWORD'];

// ── Args ─────────────────────────────────────────────────────────────────────
const args = {};
for (const a of process.argv.slice(2)) {
  const [k, v] = a.replace(/^--/, '').split('=');
  args[k] = v ?? true;
}

const CONCURRENCY  = parseInt(args.concurrency ?? '5');
const DELAY        = parseInt(args.delay ?? '300');
const LIMIT        = args.limit ? parseInt(args.limit) : Infinity;
const RESUME       = !!args.resume;
const ONLY_MISS    = !!args['only-missing'];
const RANKED_ONLY  = !!args['ranked-only'];

// ── Auth ─────────────────────────────────────────────────────────────────────
let bggCookies = '';

async function bggLogin() {
  const res = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    body: JSON.stringify({ credentials: { username: BGG_USER, password: BGG_PASS } }),
  });
  if (res.status !== 204) throw new Error(`BGG login failed: ${res.status}`);
  const cookieMap = new Map();
  for (const raw of (res.headers.getSetCookie?.() ?? [])) {
    const [name, value] = raw.split(';')[0].split('=');
    if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
  }
  bggCookies = [...cookieMap.values()].join('; ');
  console.log('✓ BGG login OK');
}

// ── Helpers ──────────────────────────────────────────────────────────────────
const sleep = ms => new Promise(r => setTimeout(r, ms));

function loadCheckpoint() {
  if (!RESUME || !existsSync(CHECKPOINT_FILE)) return 0;
  try { return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8')).offset ?? 0; } catch { return 0; }
}

function saveCheckpoint(offset) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ offset, updatedAt: new Date().toISOString() }));
}

function stripHtml(str) {
  if (!str) return null;
  return str
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&#[0-9]+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1))))
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function getBestImage(item) {
  const sets = item?.imageSets;
  if (sets) {
    const url = sets['480x360']?.src ?? sets['320x240']?.src ?? sets['240x180']?.src;
    if (url) return url;
  }
  const raw = item?.imageurl ?? item?.['imageurl@2x'] ?? null;
  if (raw) return raw.startsWith('//') ? `https:${raw}` : raw;
  const sq = item?.images?.square;
  if (sq) return sq.startsWith('//') ? `https:${sq}` : sq;
  return null;
}

function parseGameItem(item) {
  const links = item?.links ?? {};

  const mechanics  = (links.boardgamemechanic  ?? []).map(l => l.name).filter(Boolean);
  const categories = (links.boardgamecategory  ?? []).map(l => l.name).filter(Boolean);

  // is_expansion: subtypes includes 'boardgameexpansion'
  const isExpansion = (item?.subtypes ?? []).includes('boardgameexpansion');

  // parent_bgg_id: from expandsboardgame link (the base game this expands)
  const parentLink  = (links.expandsboardgame ?? [])[0];
  const parentBggId = parentLink ? parseInt(parentLink.objectid) : null;

  // num_expansions: outbound expansion links
  const numExpansions = (links.boardgameexpansion ?? []).length || null;

  const imgUrl  = getBestImage(item);
  const desc    = item?.description ? stripHtml(item.description).slice(0, 3000) : null;

  const minPlayers  = item?.minplayers  ? parseInt(item.minplayers)  : null;
  const maxPlayers  = item?.maxplayers  ? parseInt(item.maxplayers)  : null;
  const minPlaytime = item?.minplaytime ? parseInt(item.minplaytime) : null;
  const maxPlaytime = item?.maxplaytime ? parseInt(item.maxplaytime) : null;
  const minAge      = item?.minage      ? parseInt(item.minage)      : null;
  const yearPub     = item?.yearpublished ? parseInt(item.yearpublished) : null;

  return {
    ...(imgUrl      ? { image_url: imgUrl }            : {}),
    ...(yearPub     ? { year_published: yearPub }      : {}),
    ...(minPlayers  ? { min_players: minPlayers }      : {}),
    ...(maxPlayers  ? { max_players: maxPlayers }      : {}),
    ...(minPlaytime ? { min_playtime: minPlaytime }    : {}),
    ...(maxPlaytime ? { max_playtime: maxPlaytime }    : {}),
    ...(minAge      ? { min_age: minAge }              : {}),
    ...(desc        ? { description: desc }            : {}),
    ...(mechanics.length  ? { mechanics }  : {}),
    ...(categories.length ? { categories } : {}),
    ...(numExpansions     ? { num_expansions: numExpansions } : {}),
    is_expansion:   isExpansion,
    parent_bgg_id:  isExpansion && parentBggId ? parentBggId : null,
    last_synced_at: new Date().toISOString(),
  };
}

async function fetchGame(bggId, retries = 3) {
  const url = `https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=${bggId}`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Cookie': bggCookies,
        'Accept': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      await bggLogin();
      continue;
    }

    if (res.status === 429) {
      await sleep(10000);
      continue;
    }

    if (!res.ok) return null;

    const data = await res.json();
    return data?.item ?? null;
  }

  return null;
}

// Simple concurrency pool
async function withConcurrency(tasks, limit) {
  const results = [];
  let i = 0;

  async function runNext() {
    while (i < tasks.length) {
      const idx = i++;
      results[idx] = await tasks[idx]();
    }
  }

  await Promise.all(Array.from({ length: Math.min(limit, tasks.length) }, runNext));
  return results;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('=== Ludum BGG Full Enrichment (Geekdo JSON API) ===');
  console.log(`Concurrency: ${CONCURRENCY} · Delay: ${DELAY}ms · Only-missing: ${ONLY_MISS} · Ranked-only: ${RANKED_ONLY} · Resume: ${RESUME}`);

  await bggLogin();

  console.log('\nLoading games from DB...');
  const PAGE_SIZE = 1000;
  const allGames = [];
  let offset = 0;

  while (true) {
    let query = supabase
      .from('games')
      .select('id, bgg_id, image_url, min_players, description, mechanics, is_expansion')
      .order('bgg_rank', { ascending: true, nullsFirst: false })
      .range(offset, offset + PAGE_SIZE - 1);

    if (RANKED_ONLY) query = query.gt('bgg_rank', 0);

    const { data, error } = await query;
    if (error) { console.error('DB error:', error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    allGames.push(...data);
    process.stdout.write(`\r  Loaded ${allGames.length} games...`);
    if (data.length < PAGE_SIZE) break;
    offset += PAGE_SIZE;
  }

  console.log(`\nTotal: ${allGames.length} games in DB`);

  let toProcess = allGames;
  if (ONLY_MISS) {
    toProcess = allGames.filter(g => !g.description || !g.mechanics);
    console.log(`Filtered to ${toProcess.length} games with missing description or mechanics`);
  }

  if (LIMIT < toProcess.length) {
    toProcess = toProcess.slice(0, LIMIT);
    console.log(`Limited to ${toProcess.length} games`);
  }

  const startOffset = loadCheckpoint();
  if (startOffset > 0) {
    console.log(`Resuming from offset ${startOffset}`);
    toProcess = toProcess.slice(startOffset);
  }

  console.log(`\nProcessing ${toProcess.length} games (concurrency=${CONCURRENCY})...\n`);

  const startTime = Date.now();
  let processed = 0;
  let updated   = 0;
  let failed    = 0;

  // Process in chunks of CONCURRENCY
  for (let i = 0; i < toProcess.length; i += CONCURRENCY) {
    const chunk = toProcess.slice(i, i + CONCURRENCY);

    const tasks = chunk.map(game => async () => {
      try {
        const item = await fetchGame(game.bgg_id);
        if (!item) return false;
        const patch = parseGameItem(item);
        const { error } = await supabase.from('games').update(patch).eq('id', game.id);
        if (error) throw new Error(error.message);
        return true;
      } catch {
        return false;
      }
    });

    const results = await withConcurrency(tasks, CONCURRENCY);
    updated += results.filter(Boolean).length;
    failed  += results.filter(r => !r).length;

    processed += chunk.length;

    const done      = startOffset + i + chunk.length;
    const total     = startOffset + toProcess.length;
    const pct       = Math.round((done / total) * 100);
    const elapsed   = (Date.now() - startTime) / 1000;
    const rate      = processed / elapsed;
    const remaining = (toProcess.length - processed) / rate;
    const eta       = remaining > 0 ? `ETA ${Math.round(remaining / 60)}min` : 'done';

    saveCheckpoint(startOffset + i + chunk.length);
    process.stdout.write(`\r  ${pct}% · ${done}/${total} · ${updated} updated · ${failed} failed · ${eta}  `);

    if (i + CONCURRENCY < toProcess.length && DELAY > 0) await sleep(DELAY);
  }

  console.log(`\n\n✓ Done! ${updated} updated, ${failed} failed.`);

  if (failed === 0 && existsSync(CHECKPOINT_FILE)) {
    try { writeFileSync(CHECKPOINT_FILE, JSON.stringify({ completed: true, at: new Date().toISOString() })); }
    catch {}
  }
}

main().catch(err => { console.error('\n' + err.message); process.exit(1); });

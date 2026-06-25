/**
 * Descubre juegos de BGG que no están en Ludum e inserta los que falten.
 *
 * Modos:
 *   --scan-new      Escanea IDs por encima del máximo actual en la BD (default)
 *   --fill-gaps     Busca huecos dentro del rango de IDs que ya tenemos
 *
 * Opciones:
 *   --start=N       ID de BGG desde el que empezar (anula el automático)
 *   --range=N       Cuántos IDs consecutivos escanear (default: 5000)
 *   --concurrency=N Peticiones en paralelo (default: 5)
 *   --delay=N       Ms de espera entre chunks (default: 300)
 *   --resume        Continuar desde el checkpoint guardado
 *
 * Uso:
 *   node scripts/discover-new-games.mjs
 *   node scripts/discover-new-games.mjs --fill-gaps --range=50000
 *   node scripts/discover-new-games.mjs --start=400000 --range=10000
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, writeFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dir = dirname(fileURLToPath(import.meta.url));
const CHECKPOINT_FILE = join(__dir, '.discover-checkpoint.json');

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

const MODE        = args['fill-gaps'] ? 'fill-gaps' : 'scan-new';
const CONCURRENCY = parseInt(args.concurrency ?? '5');
const DELAY       = parseInt(args.delay ?? '300');
const RANGE       = parseInt(args.range ?? '5000');
const RESUME      = !!args.resume;
const START_ARG   = args.start ? parseInt(args.start) : null;

// ── Auth ─────────────────────────────────────────────────────────────────────
let bggCookies = '';

async function bggLogin() {
  const res = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0' },
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
  if (!RESUME || !existsSync(CHECKPOINT_FILE)) return null;
  try { return JSON.parse(readFileSync(CHECKPOINT_FILE, 'utf-8')); } catch { return null; }
}

function saveCheckpoint(data) {
  writeFileSync(CHECKPOINT_FILE, JSON.stringify({ ...data, updatedAt: new Date().toISOString() }));
}

function stripHtml(str) {
  if (!str) return null;
  return str
    .replace(/<br\s*\/?>/gi, '\n').replace(/<\/p>/gi, '\n').replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
    .replace(/&#10;/g, '\n').replace(/&ndash;/g, '–').replace(/&mdash;/g, '—')
    .replace(/&#[0-9]+;/g, c => String.fromCharCode(parseInt(c.slice(2, -1))))
    .replace(/\n{3,}/g, '\n\n').trim();
}

function getBestImage(item) {
  const sets = item?.imageSets;
  if (sets) {
    const url = sets['480x360']?.src ?? sets['320x240']?.src ?? sets['240x180']?.src;
    if (url) return url.startsWith('//') ? `https:${url}` : url;
  }
  const raw = item?.imageurl ?? item?.['imageurl@2x'] ?? null;
  if (raw) return raw.startsWith('//') ? `https:${raw}` : raw;
  return null;
}

function parseGameItem(bggId, item) {
  const links = item?.links ?? {};
  const subtypes = item?.subtypes ?? [];

  const mechanics  = (links.boardgamemechanic ?? []).map(l => l.name).filter(Boolean);
  const categories = (links.boardgamecategory ?? []).map(l => l.name).filter(Boolean);

  const isExpansion  = subtypes.includes('boardgameexpansion');
  const isRpg        = subtypes.includes('rpgitem');
  const gameType     = isRpg ? 'rpg' : isExpansion ? 'expansion' : 'boardgame';
  const parentLink   = (links.expandsboardgame ?? [])[0];
  const parentBggId  = parentLink ? parseInt(parentLink.objectid) : null;
  const numExpansions = (links.boardgameexpansion ?? []).length || null;

  const imgUrl  = getBestImage(item);
  const desc    = item?.description ? stripHtml(item.description).slice(0, 3000) : null;

  // Nombre: primaryname > name en el objeto
  const nameObj = item?.name;
  const name = (typeof nameObj === 'string' ? nameObj : nameObj?.primary ?? nameObj?.[0]) ?? null;
  if (!name) return null;

  return {
    bgg_id:        bggId,
    name,
    bgg_rank:      item?.rank ? parseInt(item.rank) : null,
    bgg_rating:    item?.stats?.baverage ? parseFloat(item.stats.baverage) : null,
    year_published: item?.yearpublished ? parseInt(item.yearpublished) : null,
    min_players:   item?.minplayers ? parseInt(item.minplayers) : null,
    max_players:   item?.maxplayers ? parseInt(item.maxplayers) : null,
    min_playtime:  item?.minplaytime ? parseInt(item.minplaytime) : null,
    max_playtime:  item?.maxplaytime ? parseInt(item.maxplaytime) : null,
    min_age:       item?.minage ? parseInt(item.minage) : null,
    ...(imgUrl           ? { image_url: imgUrl }           : {}),
    ...(desc             ? { description: desc }           : {}),
    ...(mechanics.length ? { mechanics }                   : {}),
    ...(categories.length ? { categories }                 : {}),
    ...(numExpansions    ? { num_expansions: numExpansions } : {}),
    game_type:      gameType,
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
        'User-Agent': 'Mozilla/5.0',
        'Cookie': bggCookies,
        'Accept': 'application/json',
      },
    });

    if (res.status === 401 || res.status === 403) {
      await bggLogin();
      continue;
    }
    if (res.status === 429) { await sleep(10000); continue; }
    if (res.status === 404) return null;
    if (!res.ok) return null;

    const data = await res.json();
    const item = data?.item;
    if (!item) return null;

    // Filtrar: boardgames, expansiones y RPGs
    const subtypes = item?.subtypes ?? [];
    const isValid = subtypes.some(s => ['boardgame', 'boardgameexpansion', 'rpgitem'].includes(s));
    if (subtypes.length > 0 && !isValid) return null;

    return item;
  }

  return null;
}

// ── DB helpers ────────────────────────────────────────────────────────────────
async function getMaxBggId() {
  const { data, error } = await supabase
    .from('games')
    .select('bgg_id')
    .order('bgg_id', { ascending: false })
    .limit(1)
    .single();
  if (error) throw new Error(error.message);
  return data.bgg_id;
}

async function getExistingBggIds(minId, maxId) {
  const ids = new Set();
  const PAGE = 1000;
  let from = 0;

  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('bgg_id')
      .gte('bgg_id', minId)
      .lte('bgg_id', maxId)
      .range(from, from + PAGE - 1);
    if (error) throw new Error(error.message);
    if (!data?.length) break;
    data.forEach(r => ids.add(r.bgg_id));
    if (data.length < PAGE) break;
    from += PAGE;
    if (from % 10000 === 0) process.stdout.write(` ${ids.size} encontrados...`);
  }

  return ids;
}

// ── Main ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log(`=== Ludum BGG Discover New Games (modo: ${MODE}) ===`);
  console.log(`Concurrency: ${CONCURRENCY} · Delay: ${DELAY}ms · Range: ${RANGE}`);

  await bggLogin();

  const maxInDb = await getMaxBggId();
  console.log(`Max bgg_id en BD: ${maxInDb}`);

  let idsToCheck;

  if (MODE === 'scan-new') {
    const checkpoint = loadCheckpoint();
    const startId = START_ARG ?? (RESUME && checkpoint?.nextId ? checkpoint.nextId : maxInDb + 1);
    const endId   = startId + RANGE - 1;
    console.log(`Escaneando IDs ${startId} → ${endId}`);
    idsToCheck = Array.from({ length: RANGE }, (_, i) => startId + i);
  } else {
    // fill-gaps: busca huecos dentro del rango que ya tenemos
    const minId = START_ARG ?? 1;
    const endId = maxInDb;
    console.log(`Buscando huecos en el rango ${minId} → ${endId}...`);
    process.stdout.write('  Cargando IDs existentes de la BD...');
    const existing = await getExistingBggIds(minId, endId);
    console.log(` ${existing.size} encontrados`);
    idsToCheck = [];
    for (let i = minId; i <= endId; i++) {
      if (!existing.has(i)) idsToCheck.push(i);
    }
    console.log(`Huecos encontrados: ${idsToCheck.length}`);
    if (idsToCheck.length === 0) { console.log('Sin huecos. Fin.'); return; }
  }

  const startTime = Date.now();
  let checked  = 0;
  let inserted = 0;
  let skipped  = 0;
  let failed   = 0;

  for (let i = 0; i < idsToCheck.length; i += CONCURRENCY) {
    const chunk = idsToCheck.slice(i, i + CONCURRENCY);

    await Promise.all(chunk.map(async bggId => {
      try {
        const item = await fetchGame(bggId);
        if (!item) { skipped++; return; }

        const gameData = parseGameItem(bggId, item);
        if (!gameData) { skipped++; return; }

        const { error } = await supabase
          .from('games')
          .upsert(gameData, { onConflict: 'bgg_id' });

        if (error) { failed++; return; }
        inserted++;
      } catch {
        failed++;
      }
    }));

    checked += chunk.length;

    const elapsed   = (Date.now() - startTime) / 1000;
    const rate      = checked / elapsed;
    const remaining = (idsToCheck.length - checked) / rate;
    const eta       = remaining > 60 ? `ETA ${Math.round(remaining / 60)}min` : `ETA ${Math.round(remaining)}s`;

    const nextId = MODE === 'scan-new' ? idsToCheck[i + CONCURRENCY] ?? idsToCheck[idsToCheck.length - 1] + 1 : null;
    if (nextId) saveCheckpoint({ nextId });

    process.stdout.write(
      `\r  ${checked}/${idsToCheck.length} IDs · ${inserted} insertados · ${skipped} sin juego · ${failed} errores · ${eta}  `
    );

    if (i + CONCURRENCY < idsToCheck.length && DELAY > 0) await sleep(DELAY);
  }

  console.log(`\n\n✓ Fin. ${inserted} juegos nuevos insertados, ${skipped} IDs sin juego, ${failed} errores.`);

  if (MODE === 'scan-new') {
    const lastChecked = idsToCheck[idsToCheck.length - 1];
    saveCheckpoint({ nextId: lastChecked + 1, completedAt: new Date().toISOString() });
    console.log(`Próxima ejecución puede empezar desde ID ${lastChecked + 1} con --resume`);
  }
}

main().catch(err => { console.error('\n' + err.message); process.exit(1); });

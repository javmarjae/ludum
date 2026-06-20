/**
 * Enrich games with BGG data using the Geekdo internal API.
 * Gets: description, image_url, min/max players, playtime, complexity.
 *
 * Usage:
 *   node scripts/enrich-bgg-auth.mjs              # all without description, ranked first
 *   node scripts/enrich-bgg-auth.mjs --limit=5000 # top N games
 *   node scripts/enrich-bgg-auth.mjs --missing-images # only games without image
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);
const BGG_USER = env['BGG_USERNAME'];
const BGG_PASS = env['BGG_PASSWORD'];

const args = Object.fromEntries(process.argv.slice(2).filter(a => a.startsWith('--')).map(a => { const [k, v] = a.slice(2).split('='); return [k, v ?? true]; }));
const LIMIT = args.limit ? parseInt(args.limit) : null;
const MISSING_IMAGES = args['missing-images'] === true;
const DELAY = 800; // ms between requests — conservative

let bggCookies = '';

async function bggLogin() {
  const login = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
    body: JSON.stringify({ credentials: { username: BGG_USER, password: BGG_PASS } }),
  });
  if (login.status !== 204) throw new Error(`BGG login failed: ${login.status}`);
  const cookieMap = new Map();
  for (const raw of (login.headers.getSetCookie?.() ?? [])) {
    const [name, value] = raw.split(';')[0].split('=');
    if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
  }
  bggCookies = [...cookieMap.values()].join('; ');
  console.log(`✓ BGG login OK (${bggCookies.slice(0, 30)}...)`);
}

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function stripHtml(html) {
  if (!html) return null;
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').replace(/&#10;/g, '\n').replace(/&#[0-9]+;/g, '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

async function fetchGame(bggId, retries = 2) {
  const url = `https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=${bggId}`;
  for (let i = 0; i <= retries; i++) {
    try {
      const res = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Cookie': bggCookies, 'Accept': 'application/json' },
      });
      if (res.status === 401 || res.status === 403) {
        await bggLogin();
        continue;
      }
      if (!res.ok) return null;
      const data = await res.json();
      return data?.item ?? null;
    } catch { if (i === retries) return null; }
  }
  return null;
}

function getBestImage(item) {
  // Prefer large images over thumbnails
  const sets = item?.imageSets;
  if (sets) {
    const large = sets['480x360']?.src ?? sets['320x240']?.src ?? sets['240x180']?.src;
    if (large) return large;
  }
  // Fall back to imageurl (usually full size)
  const raw = item?.imageurl ?? item?.['imageurl@2x'] ?? null;
  if (raw) return raw.startsWith('//') ? `https:${raw}` : raw;
  // Last resort: square thumbnail (better than nothing)
  const sq = item?.images?.square;
  if (sq) return sq.startsWith('//') ? `https:${sq}` : sq;
  return null;
}

async function main() {
  await bggLogin();

  console.log('Loading games from DB...');
  let q = supabase
    .from('games')
    .select('id, bgg_id, name')
    .order('bgg_rank', { ascending: true, nullsFirst: false });

  if (MISSING_IMAGES) {
    q = q.is('image_url', null);
  } else {
    q = q.is('description', null);
  }

  if (LIMIT) q = q.limit(LIMIT);
  else q = q.limit(200000);

  const { data: games, error } = await q;
  if (error) { console.error(error.message); process.exit(1); }
  console.log(`${games.length} games to enrich\n`);

  let enriched = 0, failed = 0, skipped = 0, totalProcessed = 0;

  while (true) {
    // Fetch next batch of games still needing enrichment
    let q = supabase
      .from('games')
      .select('id, bgg_id, name')
      .order('bgg_rank', { ascending: true, nullsFirst: false });

    if (MISSING_IMAGES) q = q.is('image_url', null);
    else q = q.is('description', null);

    // Ranked games first (bgg_rank > 0), skip unranked (rank = 0 = no rank on BGG)
    if (!MISSING_IMAGES) q = q.gt('bgg_rank', 0);

    const batchLimit = LIMIT ? Math.min(1000, LIMIT - totalProcessed) : 1000;
    q = q.limit(batchLimit);

    const { data: games, error } = await q;
    if (error) { console.error(error.message); break; }
    if (!games || games.length === 0) { console.log('\n\nNo more games to enrich.'); break; }

    for (let i = 0; i < games.length; i++) {
      const game = games[i];
      try {
        const item = await fetchGame(game.bgg_id);
        if (!item) { skipped++; } else {
          const description = stripHtml(item.description ?? item.short_description);
          const imageUrl = getBestImage(item);
          const minAge = parseInt(item.minage);
          const update = {
            id: game.id, bgg_id: game.bgg_id, name: game.name,
            ...(description  ? { description }                          : {}),
            ...(imageUrl     ? { image_url: imageUrl }                  : {}),
            ...(item.minplayers  ? { min_players: parseInt(item.minplayers) }   : {}),
            ...(item.maxplayers  ? { max_players: parseInt(item.maxplayers) }   : {}),
            ...(item.minplaytime ? { min_playtime: parseInt(item.minplaytime) } : {}),
            ...(item.maxplaytime ? { max_playtime: parseInt(item.maxplaytime) } : {}),
            ...(!isNaN(minAge) && minAge > 0 ? { min_age: minAge } : {}),
          };
          const { error: upErr } = await supabase.from('games').upsert([update], { onConflict: 'id' });
          if (upErr) throw new Error(upErr.message);
          enriched++;
        }
      } catch (err) {
        failed++;
        if (failed % 50 === 1) process.stdout.write(`\n  ⚠ ${err.message}\n`);
      }

      totalProcessed++;
      process.stdout.write(`\r  ${totalProcessed} processed · ${enriched} enriched · ${skipped} no data · ${failed} errors`);
      if (i + 1 < games.length) await sleep(DELAY);

      if (LIMIT && totalProcessed >= LIMIT) break;
    }

    if (LIMIT && totalProcessed >= LIMIT) break;
    // Brief pause between batches
    await sleep(1000);
  }

  console.log(`\n\nDone! ${enriched} enriched, ${skipped} no data, ${failed} errors.`);
}

main().catch(err => { console.error(err); process.exit(1); });

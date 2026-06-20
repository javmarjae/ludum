/**
 * Enrich top games with BGG API data (players, playtime, complexity)
 *
 * Usage: node scripts/enrich-bgg.mjs --limit=5000 --batch=20 --delay=1200
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { parseStringPromise } from 'xml2js';

// Load env
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => {
      const idx = l.indexOf('=');
      return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()];
    })
);

const supabaseUrl = env['NEXT_PUBLIC_SUPABASE_URL'];
const serviceRoleKey = env['SUPABASE_SERVICE_ROLE_KEY'];

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Parse --key=value args
const args = {};
for (const a of process.argv.slice(2)) {
  const [k, v] = a.replace(/^--/, '').split('=');
  args[k] = v ?? true;
}

const LIMIT = parseInt(args.limit ?? '5000');
const BATCH = parseInt(args.batch ?? '20');
const DELAY = parseInt(args.delay ?? '1500');

const BGG_HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  'Accept': 'application/xml, text/xml, */*',
};

async function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

async function fetchBggBatch(ids, retries = 3) {
  const url = `https://boardgamegeek.com/xmlapi2/thing?id=${ids.join(',')}&stats=1&type=boardgame`;

  for (let attempt = 0; attempt < retries; attempt++) {
    const res = await fetch(url, { headers: BGG_HEADERS });

    // BGG returns 202 when the request is queued — wait and retry
    if (res.status === 202) {
      await sleep(3000);
      continue;
    }

    if (!res.ok) throw new Error(`BGG API ${res.status}`);

    const xml = await res.text();
    const parsed = await parseStringPromise(xml);
    return parsed?.items?.item ?? [];
  }

  throw new Error('BGG API: max retries reached');
}

function getVal(obj, field) {
  return obj?.[field]?.[0]?.['$']?.value ?? null;
}

async function main() {
  console.log(`Fetching top ${LIMIT} games from DB...`);

  const { data: games, error } = await supabase
    .from('games')
    .select('id, bgg_id, min_players')
    .not('bgg_rank', 'is', null)
    .order('bgg_rank', { ascending: true })
    .limit(LIMIT);

  if (error) { console.error(error.message); process.exit(1); }

  const needsEnrich = games.filter(g => g.min_players === null);
  console.log(`${needsEnrich.length} games need enrichment (${games.length - needsEnrich.length} already done)\n`);

  if (needsEnrich.length === 0) {
    console.log('Nothing to do.');
    return;
  }

  let enriched = 0;
  let failed = 0;

  for (let i = 0; i < needsEnrich.length; i += BATCH) {
    const batch = needsEnrich.slice(i, i + BATCH);
    const ids = batch.map(g => g.bgg_id);

    try {
      const items = await fetchBggBatch(ids);

      const updates = [];
      for (const item of items) {
        const bggId = parseInt(item['$']?.id);
        const dbGame = batch.find(g => g.bgg_id === bggId);
        if (!dbGame) continue;

        const minPlayers = getVal(item, 'minplayers');
        const maxPlayers = getVal(item, 'maxplayers');
        const minPlaytime = getVal(item, 'minplaytime');
        const maxPlaytime = getVal(item, 'maxplaytime');
        const complexity = item?.statistics?.[0]?.ratings?.[0]?.averageweight?.[0]?.['$']?.value ?? null;
        const imageUrl = item?.image?.[0]?.trim() ?? null;

        updates.push({
          id: dbGame.id,
          min_players: minPlayers ? parseInt(minPlayers) : null,
          max_players: maxPlayers ? parseInt(maxPlayers) : null,
          min_playtime: minPlaytime ? parseInt(minPlaytime) : null,
          max_playtime: maxPlaytime ? parseInt(maxPlaytime) : null,
          complexity: complexity ? parseFloat(complexity) : null,
          ...(imageUrl ? { image_url: imageUrl } : {}),
        });
      }

      if (updates.length > 0) {
        const { error: upErr } = await supabase.from('games').upsert(updates, { onConflict: 'id' });
        if (upErr) throw new Error(upErr.message);
        enriched += updates.length;
      }

    } catch (err) {
      failed += batch.length;
      process.stdout.write(`\n  ⚠ Batch ${Math.floor(i / BATCH) + 1} failed: ${err.message}\n`);
    }

    const pct = Math.round(((i + batch.length) / needsEnrich.length) * 100);
    process.stdout.write(`\r  ${pct}% · ${i + batch.length}/${needsEnrich.length} · ${enriched} enriched · ${failed} failed`);

    if (i + BATCH < needsEnrich.length) await sleep(DELAY);
  }

  console.log(`\n\nDone! ${enriched} enriched, ${failed} failed.`);
}

main().catch(err => { console.error(err); process.exit(1); });

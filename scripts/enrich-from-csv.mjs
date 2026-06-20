/**
 * Enrich games DB from the local BGG CSV dataset
 *
 * Usage: node scripts/enrich-from-csv.mjs CSV/extracted/games.csv
 *
 * Updates: min_players, max_players, min_playtime, max_playtime,
 *          complexity (GameWeight), image_url, bgg_rank, bgg_rating, year_published
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, createReadStream } from 'fs';
import { resolve } from 'path';
import csv from 'csv-parser';

// Load .env.local
const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

const csvPath = resolve(process.argv[2] ?? 'CSV/extracted/games.csv');

function parseNum(val, type = 'int') {
  if (!val || val === '' || val === 'N/A') return null;
  const n = type === 'float' ? parseFloat(val) : parseInt(val);
  return isNaN(n) ? null : n;
}

async function main() {
  console.log(`Reading ${csvPath}...`);

  const rows = [];
  await new Promise((resolve, reject) => {
    createReadStream(csvPath)
      .pipe(csv())
      .on('data', row => rows.push(row))
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`${rows.length} rows loaded. Fetching existing bgg_ids from DB...`);

  // Build a map of bgg_id -> internal id for all existing games
  const existingMap = new Map();
  let from = 0;
  while (true) {
    const { data, error } = await supabase
      .from('games')
      .select('id, bgg_id')
      .range(from, from + 999);
    if (error) { console.error(error.message); process.exit(1); }
    if (!data || data.length === 0) break;
    data.forEach(g => existingMap.set(g.bgg_id, g.id));
    from += 1000;
    process.stdout.write(`\r  Loaded ${existingMap.size} existing games...`);
    if (data.length < 1000) break;
  }
  console.log(`\n${existingMap.size} existing games found. Enriching...`);

  const BATCH = 500;
  let processed = 0;
  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);

    const updates = batch.map(r => {
      const bggId = parseNum(r['BGGId']);
      if (!bggId) return null;

      const internalId = existingMap.get(bggId);
      if (!internalId) { skipped++; return null; } // not in our DB, skip

      const name   = r['Name']?.trim() || null;
      const rank   = parseNum(r['Rank:boardgame']);
      const rating = parseNum(r['BayesAvgRating'], 'float');
      const minP   = parseNum(r['MinPlayers']);
      const maxP   = parseNum(r['MaxPlayers']);
      const minT   = parseNum(r['ComMinPlaytime']);
      const maxT   = parseNum(r['ComMaxPlaytime']);
      const weight = parseNum(r['GameWeight'], 'float');
      const year   = parseNum(r['YearPublished']);
      const image  = r['ImagePath']?.trim() || null;

      if (!name) return null; // name is NOT NULL in DB, skip if missing

      return {
        id: internalId,
        bgg_id: bggId,
        name,
        ...(rank    ? { bgg_rank: rank }       : {}),
        ...(rating  ? { bgg_rating: rating }   : {}),
        ...(minP    ? { min_players: minP }     : {}),
        ...(maxP    ? { max_players: maxP }     : {}),
        ...(minT    ? { min_playtime: minT }    : {}),
        ...(maxT    ? { max_playtime: maxT }    : {}),
        ...(weight  ? { complexity: weight }    : {}),
        ...(year    ? { year_published: year }  : {}),
        ...(image   ? { image_url: image }      : {}),
      };
    }).filter(Boolean);

    if (updates.length === 0) {
      processed += batch.length;
      continue;
    }

    const { error } = await supabase
      .from('games')
      .upsert(updates, { onConflict: 'id' });

    if (error) {
      console.error(`\nBatch ${Math.floor(i / BATCH) + 1} error: ${error.message}`);
    } else {
      updated += updates.length;
    }

    processed += batch.length;
    process.stdout.write(`\r  ${processed}/${rows.length} CSV rows · ${updated} updated · ${skipped} not in DB`);
  }

  console.log(`\n\nDone! ${updated} games enriched.`);
}

main().catch(err => { console.error(err); process.exit(1); });

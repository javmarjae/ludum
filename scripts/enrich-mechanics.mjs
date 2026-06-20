/**
 * Enrich games with mechanics and categories from CSV files
 *
 * Usage: node scripts/enrich-mechanics.mjs
 *
 * Requires:
 *   CSV/extracted/mechanics.csv
 *   CSV/extracted/games.csv   (for Cat: columns)
 *
 * Requires columns in games table:
 *   ALTER TABLE games ADD COLUMN IF NOT EXISTS mechanics TEXT[];
 *   ALTER TABLE games ADD COLUMN IF NOT EXISTS categories TEXT[];
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, createReadStream } from 'fs';
import { resolve } from 'path';
import csv from 'csv-parser';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

async function readCsv(path) {
  return new Promise((resolve, reject) => {
    const rows = [];
    createReadStream(path).pipe(csv()).on('data', r => rows.push(r)).on('end', () => resolve(rows)).on('error', reject);
  });
}

async function main() {
  // 1. Load existing bgg_id → id map
  console.log('Loading existing games from DB...');
  const existingMap = new Map();
  let from = 0;
  while (true) {
    const { data } = await supabase.from('games').select('id, bgg_id, name').range(from, from + 999);
    if (!data || data.length === 0) break;
    data.forEach(g => existingMap.set(g.bgg_id, { id: g.id, name: g.name }));
    from += 1000;
    process.stdout.write(`\r  ${existingMap.size} games loaded`);
    if (data.length < 1000) break;
  }
  console.log(`\n${existingMap.size} games in DB\n`);

  // 2. Parse mechanics.csv — columns are mechanic names, value is 1/0
  console.log('Reading mechanics.csv...');
  const mechanicsRows = await readCsv(resolve('CSV/extracted/mechanics.csv'));
  const mechanicsMap = new Map(); // bgg_id → string[]
  for (const row of mechanicsRows) {
    const bggId = parseInt(row['BGGId']);
    if (isNaN(bggId)) continue;
    const mechs = Object.entries(row)
      .filter(([k, v]) => k !== 'BGGId' && v === '1')
      .map(([k]) => k);
    if (mechs.length > 0) mechanicsMap.set(bggId, mechs);
  }
  console.log(`${mechanicsMap.size} games with mechanics\n`);

  // 3. Parse categories from games.csv Cat: columns
  console.log('Reading categories from games.csv...');
  const gamesRows = await readCsv(resolve('CSV/extracted/games.csv'));
  const categoriesMap = new Map(); // bgg_id → string[]
  const CAT_LABELS = {
    'Cat:Thematic': 'Temático',
    'Cat:Strategy': 'Estrategia',
    'Cat:War': 'Guerra',
    'Cat:Family': 'Familiar',
    'Cat:CGS': 'Cartas',
    'Cat:Abstract': 'Abstracto',
    'Cat:Party': 'Fiesta',
    'Cat:Childrens': 'Infantil',
  };
  for (const row of gamesRows) {
    const bggId = parseInt(row['BGGId']);
    if (isNaN(bggId)) continue;
    const cats = Object.entries(CAT_LABELS)
      .filter(([k]) => row[k] === '1')
      .map(([, label]) => label);
    if (cats.length > 0) categoriesMap.set(bggId, cats);
  }
  console.log(`${categoriesMap.size} games with categories\n`);

  // 4. Build updates and upsert in batches
  const allBggIds = new Set([...mechanicsMap.keys(), ...categoriesMap.keys()]);
  const updates = [];
  for (const bggId of allBggIds) {
    const entry = existingMap.get(bggId);
    if (!entry) continue;
    updates.push({
      id: entry.id,
      bgg_id: bggId,
      name: entry.name,
      ...(mechanicsMap.has(bggId)  ? { mechanics:  mechanicsMap.get(bggId)  } : {}),
      ...(categoriesMap.has(bggId) ? { categories: categoriesMap.get(bggId) } : {}),
    });
  }

  console.log(`Upserting ${updates.length} games...`);
  const BATCH = 500;
  let done = 0;
  for (let i = 0; i < updates.length; i += BATCH) {
    const batch = updates.slice(i, i + BATCH);
    const { error } = await supabase.from('games').upsert(batch, { onConflict: 'id' });
    if (error) console.error(`\nBatch error: ${error.message}`);
    else done += batch.length;
    process.stdout.write(`\r  ${i + batch.length}/${updates.length} · ${done} updated`);
  }

  console.log(`\n\nDone! ${done} games enriched with mechanics/categories.`);
}

main().catch(err => { console.error(err); process.exit(1); });

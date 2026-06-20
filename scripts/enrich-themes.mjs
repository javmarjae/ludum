/**
 * Enrich games with themes[] from themes.csv + subcategories.csv
 * Merges both into a single themes TEXT[] column.
 *
 * Usage: node scripts/enrich-themes.mjs
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, createReadStream } from 'fs';
import csvParser from 'csv-parser';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);
const supabase = createClient(env['NEXT_PUBLIC_SUPABASE_URL'], env['SUPABASE_SERVICE_ROLE_KEY']);

function cleanLabel(label) {
  return label.replace(/^Theme_/, '').trim();
}

async function parseThemeCsv(filepath) {
  return new Promise((resolve, reject) => {
    const result = new Map(); // bggId → string[]
    let headers = null;
    createReadStream(filepath)
      .pipe(csvParser())
      .on('headers', h => { headers = h.slice(1); }) // skip BGGId column
      .on('data', row => {
        const bggId = parseInt(row.BGGId ?? row[Object.keys(row)[0]]);
        if (isNaN(bggId)) return;
        const themes = [];
        for (const col of headers) {
          if (row[col] === '1' || row[col] === 1) themes.push(cleanLabel(col));
        }
        if (themes.length > 0) result.set(bggId, themes);
      })
      .on('end', () => resolve(result))
      .on('error', reject);
  });
}

async function loadAllGames() {
  const all = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data } = await supabase.from('games').select('id, bgg_id, name').range(offset, offset + PAGE - 1);
    if (!data || data.length === 0) break;
    all.push(...data);
    process.stdout.write(`\r  Loading DB: ${all.length} games...`);
    if (data.length < PAGE) break;
    offset += PAGE;
  }
  console.log(`\r  ${all.length} games loaded from DB`);
  return all;
}

async function main() {
  console.log('Loading existing games from DB...');
  const existing = await loadAllGames();
  const existingMap = new Map(existing.map(g => [g.bgg_id, { id: g.id, name: g.name }]));
  console.log(`${existingMap.size} games in DB`);

  console.log('Parsing themes.csv...');
  const themeMap = await parseThemeCsv('CSV/extracted/themes.csv');
  console.log(`${themeMap.size} games with themes`);

  console.log('Parsing subcategories.csv...');
  const subMap = await parseThemeCsv('CSV/subcategories.csv');
  console.log(`${subMap.size} games with subcategories`);

  // Merge themes + subcategories
  const merged = new Map();
  for (const [bggId, themes] of themeMap) merged.set(bggId, [...themes]);
  for (const [bggId, subs] of subMap) {
    const existing = merged.get(bggId) ?? [];
    for (const s of subs) if (!existing.includes(s)) existing.push(s);
    merged.set(bggId, existing);
  }

  const batch = [];
  let skipped = 0;
  for (const [bggId, themes] of merged) {
    const game = existingMap.get(bggId);
    if (!game) { skipped++; continue; }
    batch.push({ id: game.id, bgg_id: bggId, name: game.name, themes });
  }

  console.log(`\n${batch.length} games to update, ${skipped} not in DB\n`);

  const CHUNK = 500;
  let processed = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    const { error } = await supabase.from('games').upsert(chunk, { onConflict: 'id' });
    if (error) console.error('\nChunk error:', error.message);
    processed += chunk.length;
    process.stdout.write(`\r  ${processed}/${batch.length} upserted`);
  }

  console.log(`\n\nDone! ${processed} games enriched with themes.`);
}

main().catch(err => { console.error(err); process.exit(1); });

/**
 * Enrich games with extra columns from games.csv:
 * best_players, num_ratings, num_owned, language_ease, min_age, num_expansions
 *
 * Usage: node scripts/enrich-games-extra.mjs
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
  console.log(`${existingMap.size} games in DB\n`);

  const batch = [];
  let skipped = 0;

  await new Promise((resolve, reject) => {
    createReadStream('CSV/extracted/games.csv')
      .pipe(csvParser())
      .on('data', row => {
        const bggId = parseInt(row.BGGId);
        const game = existingMap.get(bggId);
        if (!game) { skipped++; return; }

        const entry = { id: game.id, bgg_id: bggId, name: game.name };

        const bestPlayers = parseInt(row.BestPlayers);
        if (!isNaN(bestPlayers) && bestPlayers > 0) entry.best_players = bestPlayers;

        const numRatings = parseInt(row.NumUserRatings);
        if (!isNaN(numRatings) && numRatings > 0) entry.num_ratings = numRatings;

        const numOwned = parseInt(row.NumOwned);
        if (!isNaN(numOwned) && numOwned > 0) entry.num_owned = numOwned;

        const langEase = parseFloat(row.LanguageEase);
        if (!isNaN(langEase) && langEase >= 1 && langEase <= 5) entry.language_ease = Math.round(langEase * 10) / 10;

        const minAge = Math.round(parseFloat(row.ComAgeRec));
        if (!isNaN(minAge) && minAge > 0 && minAge <= 21) entry.min_age = minAge;

        const numExp = parseInt(row.NumExpansions);
        if (!isNaN(numExp) && numExp > 0) entry.num_expansions = numExp;

        batch.push(entry);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`${batch.length} games to update, ${skipped} not in DB\n`);

  const CHUNK = 500;
  let processed = 0;
  for (let i = 0; i < batch.length; i += CHUNK) {
    const chunk = batch.slice(i, i + CHUNK);
    const { error } = await supabase.from('games').upsert(chunk, { onConflict: 'id' });
    if (error) console.error('\nChunk error:', error.message);
    processed += chunk.length;
    process.stdout.write(`\r  ${processed}/${batch.length} upserted`);
  }

  console.log(`\n\nDone! ${processed} games enriched.`);
}

main().catch(err => { console.error(err); process.exit(1); });

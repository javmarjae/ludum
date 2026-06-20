/**
 * Script to import games from BGG rankings CSV export
 *
 * Usage:
 * npx ts-node --esm scripts/import-csv.ts <path-to-csv-file>
 *
 * CSV columns (boardgames_ranks.csv from BGG):
 * id, name, yearpublished, rank, bayesaverage, average, usersrated,
 * is_expansion, abstracts_rank, cgs_rank, childrensgames_rank,
 * familygames_rank, partygames_rank, strategygames_rank, thematic_rank, wargames_rank
 */

import fs from 'fs';
import path from 'path';
import csv from 'csv-parser';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

interface GameRow {
  id: string;
  name: string;
  yearpublished?: string;
  rank?: string;
  bayesaverage?: string;
  average?: string;
  usersrated?: string;
  is_expansion?: string;
}

async function importGamesFromCSV(filePath: string) {
  const absolutePath = path.resolve(filePath);

  if (!fs.existsSync(absolutePath)) {
    throw new Error(`File not found: ${absolutePath}`);
  }

  const games: GameRow[] = [];

  await new Promise<void>((resolve, reject) => {
    fs.createReadStream(absolutePath)
      .pipe(csv())
      .on('data', (row: GameRow) => {
        // Skip expansions
        if (row.is_expansion === '1') return;
        games.push(row);
      })
      .on('end', resolve)
      .on('error', reject);
  });

  console.log(`Found ${games.length} base games (expansions excluded). Importing...`);

  const batchSize = 200;
  for (let i = 0; i < games.length; i += batchSize) {
    const batch = games.slice(i, i + batchSize);

    const inserts = batch.map((game) => ({
      bgg_id: parseInt(game.id),
      name: game.name,
      year_published: game.yearpublished ? parseInt(game.yearpublished) : null,
      bgg_rank: game.rank ? parseInt(game.rank) : null,
      bgg_rating: game.bayesaverage ? parseFloat(game.bayesaverage) : null,
    }));

    const { error } = await supabase
      .from('games')
      .upsert(inserts, { onConflict: 'bgg_id' });

    if (error) throw new Error(`Batch ${i / batchSize + 1} failed: ${error.message}`);

    console.log(`Imported ${Math.min(i + batchSize, games.length)}/${games.length}`);
  }

  console.log('Import completed!');
}

const csvPath = process.argv[2];
if (!csvPath) {
  console.error('Usage: npx ts-node --esm scripts/import-csv.ts <path-to-csv-file>');
  process.exit(1);
}

importGamesFromCSV(csvPath)
  .then(() => process.exit(0))
  .catch((err) => {
    console.error('Import failed:', err.message);
    process.exit(1);
  });

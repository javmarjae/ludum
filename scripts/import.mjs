import fs from 'fs';
import path from 'path';
import { parse } from 'csv-parse/sync';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

config({ path: path.resolve('.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars. Check .env.local');
  process.exit(1);
}

console.log('Connecting to:', supabaseUrl);

const supabase = createClient(supabaseUrl, serviceRoleKey);

// Test connection first
const { error: testError } = await supabase.from('games').select('id').limit(1);
if (testError) {
  console.error('Connection test failed:', testError.message);
  process.exit(1);
}
console.log('Connection OK');

const csvPath = process.argv[2] || 'boardgames_ranks.csv';
const content = fs.readFileSync(path.resolve(csvPath), 'utf-8');
const records = parse(content, { columns: true, skip_empty_lines: true });

const games = records
  .filter(r => r.is_expansion !== '1' && r.rank && r.rank !== '')
  .map(r => ({
    bgg_id: parseInt(r.id),
    name: r.name,
    year_published: r.yearpublished ? parseInt(r.yearpublished) : null,
    bgg_rank: r.rank ? parseInt(r.rank) : null,
    bgg_rating: r.bayesaverage ? parseFloat(r.bayesaverage) : null,
  }));

console.log(`Found ${games.length} ranked base games. Starting import...`);

const batchSize = 200;
let imported = 0;

for (let i = 0; i < games.length; i += batchSize) {
  const batch = games.slice(i, i + batchSize);
  const { error } = await supabase.from('games').upsert(batch, { onConflict: 'bgg_id' });
  if (error) {
    console.error(`\nBatch error at ${i}:`, error.message);
    process.exit(1);
  }
  imported += batch.length;
  process.stdout.write(`\rImported: ${imported}/${games.length}`);
}

console.log('\nDone!');

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { calculateRetentionCohorts } from '../lib/retention-metrics.mjs';

config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Configura NEXT_PUBLIC_SUPABASE_URL y SUPABASE_SERVICE_ROLE_KEY en .env.local.');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

const PAGE_SIZE = 1000;

async function fetchAllRows(table, columns, orderColumn) {
  const rows = [];

  for (let offset = 0; ; offset += PAGE_SIZE) {
    const { data, error } = await supabase
      .from(table)
      .select(columns)
      .order(orderColumn, { ascending: true })
      .range(offset, offset + PAGE_SIZE - 1);

    if (error) throw new Error(`No se pudo consultar ${table}: ${error.message}`);

    rows.push(...(data ?? []));
    if (!data || data.length < PAGE_SIZE) return rows;
  }
}

async function main() {
  const [groups, plays] = await Promise.all([
    fetchAllRows('groups', 'id, created_at', 'created_at'),
    fetchAllRows('plays', 'group_id, created_at', 'created_at'),
  ]);

  const now = Date.now();
  const rows = calculateRetentionCohorts(groups, plays, now);

  console.log(JSON.stringify({
    as_of_utc: new Date(now).toISOString(),
    method: 'Read-only aggregation of groups.created_at and plays.created_at; no profile fields are queried.',
    rate_suppression: 'Percentages are omitted when fewer than 5 groups are eligible.',
    cohorts: rows,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : 'No se pudo calcular la retención.');
  process.exitCode = 1;
});
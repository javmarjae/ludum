import { readFileSync } from 'fs';
import { createClient } from '@supabase/supabase-js';
const env = Object.fromEntries(readFileSync('.env.local','utf-8').split('\n').filter(l=>l.includes('=')&&!l.startsWith('#')).map(l=>{const i=l.indexOf('=');return[l.slice(0,i).trim(),l.slice(i+1).trim()]}));
const sb = createClient(env.NEXT_PUBLIC_SUPABASE_URL, env.SUPABASE_SERVICE_ROLE_KEY);

// Sample games WITH description
const { data: withDesc } = await sb.from('games')
  .select('bgg_id,name,bgg_rank,mechanics,themes,best_players,num_ratings')
  .not('description','is',null)
  .order('bgg_rank',{ascending:true,nullsFirst:false})
  .limit(10);
console.log('Games WITH description (top by rank):');
for (const g of withDesc ?? []) {
  console.log(`  [rank ${g.bgg_rank}] ${g.name} (${g.bgg_id}) | mechanics:${g.mechanics?.length??0} themes:${g.themes?.length??0} ratings:${g.num_ratings}`);
}

// Sample games WITH mechanics (top by rank)
const { data: withMech } = await sb.from('games')
  .select('bgg_id,name,bgg_rank,description,themes,num_ratings')
  .not('mechanics','is',null)
  .order('bgg_rank',{ascending:true,nullsFirst:false})
  .limit(5);
console.log('\nGames WITH mechanics (top by rank):');
for (const g of withMech ?? []) {
  console.log(`  [rank ${g.bgg_rank}] ${g.name} (${g.bgg_id}) | desc:${!!g.description} themes:${g.themes?.length??0} ratings:${g.num_ratings}`);
}

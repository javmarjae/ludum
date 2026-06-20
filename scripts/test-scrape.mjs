import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf-8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; }));

const login = await fetch('https://boardgamegeek.com/login/api/v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
  body: JSON.stringify({ credentials: { username: env.BGG_USERNAME, password: env.BGG_PASSWORD } }),
});
const cookieMap = new Map();
for (const raw of (login.headers.getSetCookie?.() ?? [])) {
  const [name, value] = raw.split(';')[0].split('=');
  if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
}
const cookies = [...cookieMap.values()].join('; ');

const HEADERS = { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Cookie': cookies };

// Full geekitems response
const r = await fetch('https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=174430', { headers: HEADERS });
const data = await r.json();
console.log('Keys:', Object.keys(data));
console.log('item keys:', Object.keys(data.item ?? {}));
console.log('\nDescription:', data.item?.description?.slice(0, 300));
console.log('\nImage:', data.item?.images?.square ?? data.item?.imageurl ?? data.item?.image ?? 'none');
console.log('\nFull item sample:', JSON.stringify(data.item).slice(0, 600));

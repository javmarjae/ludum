import { readFileSync } from 'fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8').split('\n')
    .filter(l => l.includes('=') && !l.startsWith('#'))
    .map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; })
);

const BGG_USER = env['BGG_USERNAME'];
const BGG_PASS = env['BGG_PASSWORD'];

async function tryLogin() {
  // Try 1: JSON credentials
  const r1 = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'User-Agent': 'Mozilla/5.0', 'Origin': 'https://boardgamegeek.com' },
    body: JSON.stringify({ credentials: { username: BGG_USER, password: BGG_PASS } }),
  });
  console.log('Try 1 (JSON):', r1.status, await r1.text().then(t => t.slice(0, 100)));

  // Try 2: with Accept header
  const r2 = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' },
    body: JSON.stringify({ credentials: { username: BGG_USER, password: BGG_PASS } }),
  });
  console.log('Try 2 (Accept JSON):', r2.status, [...r2.headers.entries()].filter(([k]) => k.toLowerCase().includes('cookie') || k.toLowerCase().includes('set')));
  const cookies = r2.headers.getSetCookie?.() ?? [];
  console.log('Cookies:', cookies);

  // Try 3: XMLapi2 directly with basic auth
  const r3 = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=174430&stats=1', {
    headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)', 'Authorization': 'Basic ' + Buffer.from(`${BGG_USER}:${BGG_PASS}`).toString('base64') },
  });
  console.log('Try 3 (Basic auth):', r3.status);
}

tryLogin().catch(console.error);

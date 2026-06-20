import { readFileSync } from 'fs';
const env = Object.fromEntries(readFileSync('.env.local', 'utf-8').split('\n').filter(l => l.includes('=') && !l.startsWith('#')).map(l => { const idx = l.indexOf('='); return [l.slice(0, idx).trim(), l.slice(idx + 1).trim()]; }));

const home = await fetch('https://boardgamegeek.com/', { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' } });
const sessionId = (home.headers.getSetCookie?.() ?? []).map(c => c.split(';')[0]).find(c => c.startsWith('SessionID')) ?? '';
console.log('SessionID:', sessionId.slice(0, 50));

const login = await fetch('https://boardgamegeek.com/login/api/v1', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36', 'Cookie': sessionId, 'Origin': 'https://boardgamegeek.com', 'Referer': 'https://boardgamegeek.com/login' },
  body: JSON.stringify({ credentials: { username: env.BGG_USERNAME, password: env.BGG_PASSWORD } }),
});
console.log('Login status:', login.status);
// Filter cookies: skip "deleted" values, deduplicate by name (last wins)
const rawLoginCookies = login.headers.getSetCookie?.() ?? [];
const cookieMap = new Map();
for (const raw of rawLoginCookies) {
  const pair = raw.split(';')[0];
  const [name, value] = pair.split('=');
  if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
}
const allCookies = [...cookieMap.values()].join('; ');
console.log('Clean cookies:', allCookies.slice(0, 100));

// Test with just the two auth cookies
const api1 = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=174430&stats=1', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36', 'Cookie': allCookies, 'Referer': 'https://boardgamegeek.com/' },
});
console.log('API (clean cookies) status:', api1.status);
const t1 = await api1.text(); console.log('Response:', t1.slice(0, 200));

// Test with NO cookies to compare
const api2 = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=174430&stats=1', {
  headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36' },
});
console.log('API (no cookies) status:', api2.status);

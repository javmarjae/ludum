import { readFileSync } from 'node:fs';

const env = Object.fromEntries(
  readFileSync('.env.local', 'utf-8')
    .split('\n')
    .filter((line) => line.includes('=') && !line.startsWith('#'))
    .map((line) => {
      const index = line.indexOf('=');
      return [line.slice(0, index).trim(), line.slice(index + 1).trim()];
    }),
);

if (!env.BGG_USERNAME || !env.BGG_PASSWORD) {
  throw new Error('Faltan BGG_USERNAME o BGG_PASSWORD en .env.local.');
}

const login = await fetch('https://boardgamegeek.com/login/api/v1', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
  },
  body: JSON.stringify({ credentials: { username: env.BGG_USERNAME, password: env.BGG_PASSWORD } }),
});

if (!login.ok) {
  console.log(`BGG login status: ${login.status}`);
  process.exitCode = 1;
} else {
  const cookieMap = new Map();
  for (const rawCookie of login.headers.getSetCookie?.() ?? []) {
    const [name, value] = rawCookie.split(';')[0].split('=');
    if (value && value !== 'deleted') cookieMap.set(name, `${name}=${value}`);
  }

  const response = await fetch('https://api.geekdo.com/api/geekitems?objecttype=thing&objectid=174430', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      Cookie: [...cookieMap.values()].join('; '),
    },
  });
  const data = response.ok ? await response.json() : null;
  const item = data?.item;
  console.log(JSON.stringify({
    login_status: login.status,
    scrape_status: response.status,
    item_found: Boolean(item),
    item_field_count: item ? Object.keys(item).length : 0,
    description_available: Boolean(item?.description),
    image_available: Boolean(item?.imageurl || item?.imageSets),
  }, null, 2));
}
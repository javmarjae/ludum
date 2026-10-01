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

const username = env.BGG_USERNAME;
const password = env.BGG_PASSWORD;
if (!username || !password) throw new Error('Faltan BGG_USERNAME o BGG_PASSWORD en .env.local.');

async function diagnoseLogin() {
  const jsonResponse = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'User-Agent': 'Mozilla/5.0',
      Origin: 'https://boardgamegeek.com',
    },
    body: JSON.stringify({ credentials: { username, password } }),
  });
  console.log(`JSON login status: ${jsonResponse.status}`);

  const acceptedResponse = await fetch('https://boardgamegeek.com/login/api/v1', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
    },
    body: JSON.stringify({ credentials: { username, password } }),
  });
  console.log(`JSON login with Accept header status: ${acceptedResponse.status}`);

  const xmlResponse = await fetch('https://boardgamegeek.com/xmlapi2/thing?id=174430&stats=1', {
    headers: {
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
      Authorization: `Basic ${Buffer.from(`${username}:${password}`).toString('base64')}`,
    },
  });
  console.log(`XML API status: ${xmlResponse.status}`);
}

diagnoseLogin().catch((error) => {
  console.error(error instanceof Error ? error.message : 'Falló el diagnóstico BGG.');
  process.exitCode = 1;
});
// Mide el rendimiento de las rutas públicas con Playwright y lo compara con la línea base local.
// Uso:
//   node scripts/perf-check.mjs --all [--save]          mide todas las rutas de perf-routes.json
//   node scripts/perf-check.mjs --routes / /blog        mide rutas concretas (patrones de perf-routes.json)
//   node scripts/perf-check.mjs --base-ref origin/main  mide solo las rutas afectadas desde esa referencia
//   node scripts/perf-check.mjs --pre-push              modo hook de git (lee las refs por stdin)
// Opciones: --url <http://host:puerto> (usa un servidor ya arrancado), --no-build, --runs <n>
import { spawn, execFileSync } from 'node:child_process';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(path.join(ROOT, 'scripts/perf-routes.json'), 'utf8'));
const OUT_DIR = path.join(ROOT, '.perf');
const BASELINE_FILE = path.join(OUT_DIR, 'baseline.json');
const REPORT_FILE = path.join(OUT_DIR, 'last-report.json');
const PORT = 3999;

// Umbrales de regresión: hace falta superar a la vez el margen relativo y el absoluto para filtrar ruido.
const TOLERANCE = {
  ttfb: { ratio: 1.3, abs: 150 },
  fcp: { ratio: 1.2, abs: 250 },
  lcp: { ratio: 1.2, abs: 300 },
  jsKB: { ratio: 1.1, abs: 20 },
  totalKB: { ratio: 1.2, abs: 100 },
  cls: { ratio: 1, abs: 0.05 },
};

const args = process.argv.slice(2);
const flag = (name) => args.includes(name);
const option = (name, fallback) => {
  const i = args.indexOf(name);
  return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : fallback;
};
const listOption = (name) => {
  const i = args.indexOf(name);
  if (i < 0) return [];
  const values = [];
  for (const v of args.slice(i + 1)) {
    if (v.startsWith('--')) break;
    values.push(v);
  }
  return values;
};

const git = (...a) => execFileSync('git', a, { cwd: ROOT, encoding: 'utf8' }).trim();

function readStdin() {
  try {
    return readFileSync(0, 'utf8');
  } catch {
    return '';
  }
}

function changedFiles() {
  if (flag('--pre-push')) {
    const files = new Set();
    for (const line of readStdin().split('\n').filter(Boolean)) {
      const [, localSha, , remoteSha] = line.trim().split(/\s+/);
      if (/^0+$/.test(localSha)) continue;
      let base = remoteSha;
      if (!base || /^0+$/.test(base)) {
        try {
          base = git('merge-base', localSha, 'origin/HEAD');
        } catch {
          return null;
        }
      }
      git('diff', '--name-only', base, localSha).split('\n').filter(Boolean).forEach((f) => files.add(f));
    }
    return [...files];
  }
  const ref = option('--base-ref');
  return ref ? git('diff', '--name-only', ref).split('\n').filter(Boolean) : null;
}

function routesForFiles(files) {
  const patterns = Object.keys(CONFIG.routes);
  const selected = new Set();
  for (const file of files) {
    if (CONFIG.sharedPaths.some((p) => file === p || file.startsWith(p))) {
      CONFIG.keyRoutes.forEach((r) => selected.add(r));
      continue;
    }
    if (!file.startsWith('app/') || file.startsWith('app/api/')) continue;
    const dir = '/' + path.posix.dirname(file).replace(/^app\/?/, '').replace(/\([^)]*\)\/?/g, '').replace(/\/$/, '');
    const routeDir = dir === '/.' || dir === '/' ? '/' : dir;
    const isLayout = /^(layout|template|loading)\./.test(path.posix.basename(file));
    for (const p of patterns) {
      if (p === routeDir || (isLayout && (routeDir === '/' || p.startsWith(routeDir + '/')))) selected.add(p);
    }
  }
  return [...selected];
}

function selectRoutes() {
  if (flag('--all')) return Object.keys(CONFIG.routes);
  const explicit = listOption('--routes');
  if (explicit.length) return explicit;
  const files = changedFiles();
  if (files === null) return CONFIG.keyRoutes;
  return routesForFiles(files);
}

async function waitForServer(url, timeoutMs = 60000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await fetch(url, { redirect: 'manual' });
      if (res.status < 500) return;
    } catch {}
    await new Promise((r) => setTimeout(r, 500));
  }
  throw new Error(`El servidor no respondió en ${url}`);
}

async function startServer() {
  const nextBin = path.join(ROOT, 'node_modules/next/dist/bin/next');
  if (!flag('--no-build')) {
    console.log('▸ Compilando (next build)…');
    execFileSync(process.execPath, [nextBin, 'build'], { cwd: ROOT, stdio: ['ignore', 'ignore', 'inherit'] });
  }
  console.log(`▸ Arrancando next start en el puerto ${PORT}…`);
  const child = spawn(process.execPath, [nextBin, 'start', '-p', String(PORT)], { cwd: ROOT, stdio: 'ignore' });
  const url = `http://localhost:${PORT}`;
  await waitForServer(url);
  return { url, stop: () => child.kill() };
}

const OBSERVERS = `
  window.__perf = { lcp: 0, cls: 0 };
  new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__perf.lcp = e.startTime; })
    .observe({ type: 'largest-contentful-paint', buffered: true });
  new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__perf.cls += e.value; })
    .observe({ type: 'layout-shift', buffered: true });
`;

async function measureOnce(browser, url) {
  // Perfil móvil similar al de Lighthouse: 4G lento y CPU 4x más lenta.
  const context = await browser.newContext({
    viewport: { width: 412, height: 823 },
    deviceScaleFactor: 1.75,
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (Linux; Android 11; moto g power) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0 Mobile Safari/537.36 ludum-perf-check',
  });
  const page = await context.newPage();
  const cdp = await context.newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 150,
    downloadThroughput: (1638.4 * 1024) / 8,
    uploadThroughput: (750 * 1024) / 8,
  });
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await page.addInitScript(OBSERVERS);
  const response = await page.goto(url, { waitUntil: 'load', timeout: 90000 });
  await page.waitForTimeout(1500);
  const m = await page.evaluate(() => {
    const nav = performance.getEntriesByType('navigation')[0];
    const fcp = performance.getEntriesByName('first-contentful-paint')[0];
    const resources = performance.getEntriesByType('resource');
    const size = (e) => e.transferSize || e.encodedBodySize || 0;
    const js = resources.filter((e) => e.initiatorType === 'script' || /\.js(\?|$)/.test(e.name));
    return {
      ttfb: nav.responseStart - nav.startTime,
      fcp: fcp ? fcp.startTime : 0,
      lcp: window.__perf.lcp,
      cls: window.__perf.cls,
      jsKB: js.reduce((a, e) => a + size(e), 0) / 1024,
      totalKB: (resources.reduce((a, e) => a + size(e), 0) + size(nav)) / 1024,
    };
  });
  await context.close();
  return { status: response?.status() ?? 0, ...m };
}

const median = (values) => {
  const s = [...values].sort((a, b) => a - b);
  return s[Math.floor(s.length / 2)];
};

async function measure(baseUrl, routes, runs) {
  const browser = await chromium.launch();
  const results = {};
  try {
    for (const route of routes) {
      const url = baseUrl + CONFIG.routes[route];
      await fetch(url).catch(() => {});
      const samples = [];
      for (let i = 0; i < runs; i++) samples.push(await measureOnce(browser, url));
      const result = { url: CONFIG.routes[route], status: samples[0].status };
      for (const k of Object.keys(TOLERANCE)) result[k] = Math.round(median(samples.map((s) => s[k])) * 1000) / 1000;
      results[route] = result;
      console.log(
        `  ${route.padEnd(18)} TTFB ${String(Math.round(result.ttfb)).padStart(5)}ms  FCP ${String(Math.round(result.fcp)).padStart(5)}ms  ` +
          `LCP ${String(Math.round(result.lcp)).padStart(5)}ms  CLS ${result.cls.toFixed(3)}  JS ${Math.round(result.jsKB)}KB  Total ${Math.round(result.totalKB)}KB`
      );
    }
  } finally {
    await browser.close();
  }
  return results;
}

function compare(results, baseline) {
  const regressions = [];
  for (const [route, r] of Object.entries(results)) {
    const b = baseline[route];
    if (!b) continue;
    for (const [metric, t] of Object.entries(TOLERANCE)) {
      if (r[metric] > b[metric] * t.ratio && r[metric] - b[metric] > t.abs) {
        regressions.push({ route, metric, before: b[metric], after: r[metric] });
      }
    }
  }
  return regressions;
}

function openAgent(regressions) {
  const detail = regressions.map((r) => `${r.route} ${r.metric}: ${Math.round(r.before)} -> ${Math.round(r.after)}`).join('; ');
  const prompt = `Modo B: corrige la regresión de rendimiento detectada antes del push (${detail}). Informe completo en .perf/last-report.json. Compara con git diff origin/HEAD.`;
  const winCode = path.join(process.env.LOCALAPPDATA ?? '', 'Programs/Microsoft VS Code/bin/code.cmd');
  const code = process.platform === 'win32' && existsSync(winCode) ? winCode : 'code';
  const quote = (s) => `"${s.replace(/"/g, "'")}"`;
  const command = [quote(code), 'chat', '-r', '-m', quote('Ludum Performance'), '-a', quote(REPORT_FILE), quote(prompt)].join(' ');
  console.log(`▸ Abriendo el agente Ludum Performance en VS Code. Si no se abre, pídele en el chat:\n  ${prompt}`);
  spawn(command, { shell: true, detached: true, stdio: 'ignore', cwd: ROOT }).on('error', () => {}).unref();
}

async function main() {
  const routes = selectRoutes().filter((r) => {
    if (CONFIG.routes[r]) return true;
    console.log(`  (sin URL de muestra en perf-routes.json, se omite ${r})`);
    return false;
  });
  if (!routes.length) {
    console.log('✓ perf-check: ninguna ruta pública afectada.');
    return 0;
  }
  console.log(`▸ perf-check: midiendo ${routes.length} ruta(s): ${routes.join(', ')}`);

  const external = option('--url');
  const server = external ? { url: external.replace(/\/$/, ''), stop() {} } : await startServer();
  let results;
  try {
    results = await measure(server.url, routes, Number(option('--runs', '3')));
  } finally {
    server.stop();
  }

  mkdirSync(OUT_DIR, { recursive: true });
  const baseline = existsSync(BASELINE_FILE) ? JSON.parse(readFileSync(BASELINE_FILE, 'utf8')) : {};
  const regressions = compare(results, baseline);
  writeFileSync(REPORT_FILE, JSON.stringify({ date: new Date().toISOString(), results, baseline, regressions }, null, 2));

  if (regressions.length) {
    console.log('\n✗ Regresiones de rendimiento:');
    for (const r of regressions) console.log(`  ${r.route} ${r.metric}: ${r.before} → ${r.after}`);
    if (flag('--pre-push')) openAgent(regressions);
    return 1;
  }

  // Sin regresiones, la línea base avanza para que la próxima comparación parta del estado actual.
  if (flag('--save') || flag('--pre-push') || !Object.keys(baseline).length) {
    writeFileSync(BASELINE_FILE, JSON.stringify({ ...baseline, ...results }, null, 2));
    console.log(`✓ Línea base actualizada en ${path.relative(ROOT, BASELINE_FILE)}`);
  }
  console.log('✓ perf-check: sin regresiones.');
  return 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error('perf-check falló:', err.message);
    process.exit(1);
  }
);

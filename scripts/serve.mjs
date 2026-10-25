#!/usr/bin/env node
// Local dev server: builds the site, serves dist/, rebuilds on change and
// live-reloads the browser. Zero dependencies. `npm run dev`

import { createServer } from 'node:http';
import { createReadStream, existsSync, readFileSync, statSync, watch } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { extname, join, normalize } from 'node:path';
import { ROOT, DIST } from './build.mjs';

const PORT = Number(process.env.PORT) || 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

const clients = new Set();
let base = '';

// Each rebuild runs in a fresh Node process, so edits to templates (ES modules,
// which Node caches) and branch switches are always picked up.
function rebuild(reason) {
  const result = spawnSync(process.execPath, [join(ROOT, 'scripts/build.mjs'), '--dev'], { stdio: 'inherit' });
  if (result.status !== 0) return; // build.mjs already printed the error
  try {
    base = new URL(JSON.parse(readFileSync(join(ROOT, 'data/site.json'), 'utf8')).siteUrl).pathname.replace(/\/+$/, '');
  } catch { /* keep the previous base */ }
  if (reason) console.log(`  ↻ ${reason}`);
  for (const res of clients) res.write('data: reload\n\n');
}

rebuild();

const server = createServer((req, res) => {
  const url = new URL(req.url, `http://${req.headers.host}`);
  if (url.pathname === '/__reload') {
    res.writeHead(200, { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache', Connection: 'keep-alive' });
    res.write(': connected\n\n');
    clients.add(res);
    req.on('close', () => clients.delete(res));
    return;
  }

  let path = decodeURIComponent(url.pathname);
  if (base && path.startsWith(base)) path = path.slice(base.length) || '/';
  let file = normalize(join(DIST, path));
  if (!file.startsWith(DIST)) { res.writeHead(403).end(); return; }
  if (existsSync(file) && statSync(file).isDirectory()) file = join(file, 'index.html');

  const found = existsSync(file);
  if (!found) file = join(DIST, '404.html');
  res.writeHead(found ? 200 : 404, { 'Content-Type': TYPES[extname(file)] || 'application/octet-stream', 'Cache-Control': 'no-store' });
  createReadStream(file).pipe(res);
});

server.listen(PORT, () => console.log(`\n  Portfolio running at http://localhost:${PORT}${base}/\n  Edit anything in data/, src/, assets/ or static/ and the page reloads.\n`));

let timer;
for (const dir of ['data', 'src', 'assets', 'static']) {
  watch(join(ROOT, dir), { recursive: true }, (_e, name) => {
    clearTimeout(timer);
    timer = setTimeout(() => rebuild(`${dir}/${name}`), 80);
  });
}

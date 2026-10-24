#!/usr/bin/env node
// Local dev server: builds the site, serves dist/, rebuilds on change and
// live-reloads the browser. Zero dependencies. `npm run dev`

import { createServer } from 'node:http';
import { createReadStream, existsSync, statSync, watch } from 'node:fs';
import { extname, join, normalize } from 'node:path';
import { build, ROOT, DIST } from './build.mjs';

const PORT = Number(process.env.PORT) || 4321;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.css': 'text/css; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.xml': 'application/xml', '.txt': 'text/plain',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp',
  '.avif': 'image/avif', '.gif': 'image/gif', '.ico': 'image/x-icon', '.mp4': 'video/mp4', '.woff2': 'font/woff2',
};

const clients = new Set();
let base = '';

function rebuild(reason) {
  try {
    ({ base } = build({ dev: true }));
    if (reason) console.log(`  ↻ ${reason}`);
    for (const res of clients) res.write('data: reload\n\n');
  } catch (e) {
    console.error(e.validation ? `\n${e.message}\n` : e);
  }
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

#!/usr/bin/env node
// Static site build: data/*.json + src/templates -> dist/
// Zero dependencies. Run with `npm run build` (or `node scripts/build.mjs`).

import { readFileSync, writeFileSync, mkdirSync, rmSync, cpSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

import { validate } from '../src/lib/validate.mjs';
import { renderHome } from '../src/templates/home.mjs';
import { renderProject, renderNotFound } from '../src/templates/project.mjs';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DIST = join(ROOT, 'dist');

const readJson = (file) => {
  const path = join(ROOT, 'data', file);
  try {
    return JSON.parse(readFileSync(path, 'utf8'));
  } catch (e) {
    throw new Error(`data/${file}: ${e.message}`);
  }
};

const shortHash = (text) => createHash('sha256').update(text).digest('hex').slice(0, 10);

function write(rel, content) {
  const out = join(DIST, rel);
  mkdirSync(dirname(out), { recursive: true });
  writeFileSync(out, content);
}

export function loadData() {
  return { site: readJson('site.json'), projects: readJson('projects.json'), career: readJson('career.json') };
}

export function build({ dev = false, quiet = false } = {}) {
  const started = Date.now();
  const data = loadData();

  const errors = validate(data, ROOT);
  if (errors.length) {
    const e = new Error(`Data validation failed:\n  - ${errors.join('\n  - ')}`);
    e.validation = true;
    throw e;
  }

  // The site may live at a domain root (user site) or under /repo-name (project site).
  const siteUrl = new URL(data.site.siteUrl);
  const base = siteUrl.pathname.replace(/\/+$/, '');
  const origin = siteUrl.origin;

  // Fingerprint CSS/JS so browsers never run stale code after a deploy.
  const assetFiles = {
    'css/main.css': join(ROOT, 'src/styles/main.css'),
    'js/main.js': join(ROOT, 'src/scripts/main.js'),
    'js/hero.js': join(ROOT, 'src/scripts/hero.js'),
  };
  const assetVersions = {};
  rmSync(DIST, { recursive: true, force: true });
  for (const [rel, src] of Object.entries(assetFiles)) {
    const text = readFileSync(src, 'utf8');
    assetVersions[rel] = shortHash(text);
    write(`assets/${rel}`, text);
  }

  const ctx = {
    ...data,
    dev,
    year: new Date().getFullYear(),
    url: (path) => `${base}${path}`,
    abs: (path) => `${origin}${base}${path}`,
    asset: (rel) => `${base}/assets/${rel}?v=${assetVersions[rel]}`,
    projectPath: (p) => `/projects/${p.slug}/`,
  };

  // Pages
  write('index.html', renderHome(ctx));
  data.projects.forEach((p, i) => write(`projects/${p.slug}/index.html`, renderProject(ctx, p, i)));
  write('404.html', renderNotFound(ctx));

  // Static files
  cpSync(join(ROOT, 'assets'), join(DIST, 'assets'), { recursive: true });
  cpSync(join(ROOT, 'static'), DIST, { recursive: true });
  write('.nojekyll', '');

  // SEO files
  const today = new Date().toISOString().slice(0, 10);
  const urls = [
    { loc: ctx.abs('/'), lastmod: today, priority: '1.0' },
    ...data.projects.map((p) => ({ loc: ctx.abs(ctx.projectPath(p)), lastmod: p.updated || today, priority: p.featured ? '0.9' : '0.7' })),
  ];
  write('sitemap.xml', `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u.loc}</loc><lastmod>${u.lastmod}</lastmod><priority>${u.priority}</priority></url>`).join('\n')}
</urlset>
`);
  write('robots.txt', `User-agent: *\nAllow: /\n\nSitemap: ${ctx.abs('/sitemap.xml')}\n`);
  write('site.webmanifest', JSON.stringify({
    name: data.site.name,
    short_name: data.site.shortName,
    description: data.site.seo.description,
    start_url: `${base}/`,
    scope: `${base}/`,
    display: 'browser',
    background_color: '#0a0b10',
    theme_color: '#0a0b10',
    icons: [
      { src: `${base}/favicon.svg`, sizes: 'any', type: 'image/svg+xml' },
      { src: `${base}/apple-touch-icon.png`, sizes: '180x180', type: 'image/png' },
    ],
  }, null, 2));

  if (!quiet) {
    console.log(`Built ${data.projects.length + 2} pages to dist/ in ${Date.now() - started} ms${dev ? ' (dev)' : ''}`);
  }
  return { base };
}

// Run when invoked directly (`node scripts/build.mjs [--check]`).
if (import.meta.url === pathToFileURL(process.argv[1]).href) {
  try {
    if (process.argv.includes('--check')) {
      const errors = validate(loadData(), ROOT);
      if (errors.length) throw Object.assign(new Error(`Data validation failed:\n  - ${errors.join('\n  - ')}`), { validation: true });
      console.log('Data is valid.');
    } else {
      build();
    }
  } catch (e) {
    console.error(e.validation ? e.message : e);
    process.exit(1);
  }
}

export { ROOT, DIST };

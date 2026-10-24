import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { hasIcon } from '../templates/icons.mjs';

// Validates /data before anything is rendered, so a typo fails the build
// with a readable message instead of shipping a broken page.

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DATE = /^\d{4}-\d{2}-\d{2}$/;
const SAFE_URL = /^(https?:\/\/|mailto:)/;

export function validate({ site, projects, career }, root) {
  const errors = [];
  const err = (where, msg) => errors.push(`${where}: ${msg}`);
  const need = (obj, keys, where) => keys.forEach((k) => {
    const v = obj?.[k];
    if (v === undefined || v === null || v === '' || (Array.isArray(v) && v.length === 0)) err(where, `"${k}" is required`);
  });
  const checkUrl = (url, where) => { if (!SAFE_URL.test(url || '')) err(where, `URL must start with https://, http:// or mailto: (got "${url}")`); };
  const checkFile = (src, where) => {
    if (!src) return;
    if (!src.startsWith('/')) return err(where, `image path must start with "/" (got "${src}")`);
    if (!existsSync(join(root, src))) err(where, `file not found: ${src}`);
  };
  const checkImage = (img, where) => {
    need(img, ['src', 'width', 'height', 'alt'], where);
    checkFile(img?.src, where);
    checkFile(img?.srcSmall, where);
    if (img?.srcSmall && !/-\d+\.\w+$/.test(img.srcSmall)) err(where, `srcSmall must end in "-<width>.<ext>", e.g. "shot-800.webp"`);
  };

  // site.json
  need(site, ['siteUrl', 'lang', 'name', 'role', 'intro', 'email', 'about', 'socials', 'portrait', 'seo'], 'site.json');
  try { new URL(site.siteUrl); } catch { err('site.json', `siteUrl is not a valid URL: "${site.siteUrl}"`); }
  checkImage(site.portrait, 'site.json portrait');
  checkFile(site.seo?.ogImage, 'site.json seo.ogImage');
  (site.socials || []).forEach((s, i) => {
    const where = `site.json socials[${i}]`;
    need(s, ['label', 'icon', 'url'], where);
    checkUrl(s.url, where);
    if (s.icon && !hasIcon(s.icon)) err(where, `unknown icon "${s.icon}"`);
  });
  if (site.contact?.formAction) checkUrl(site.contact.formAction, 'site.json contact.formAction');

  // projects.json
  if (!Array.isArray(projects) || !projects.length) err('projects.json', 'must be a non-empty array');
  const seen = new Set();
  (projects || []).forEach((p, i) => {
    const where = `projects.json [${i}] "${p.slug || p.title || '?'}"`;
    need(p, ['slug', 'title', 'status', 'category', 'role', 'tagline', 'summary', 'overview', 'tech', 'image'], where);
    if (p.slug && !SLUG.test(p.slug)) err(where, `slug must be lowercase-kebab-case`);
    if (seen.has(p.slug)) err(where, `duplicate slug "${p.slug}"`);
    seen.add(p.slug);
    if (!['wip', 'complete'].includes(p.status)) err(where, `status must be "wip" or "complete"`);
    if (p.updated && !DATE.test(p.updated)) err(where, `updated must be YYYY-MM-DD`);
    if (p.video && !/^[\w-]{11}$/.test(p.video)) err(where, `video must be an 11-character YouTube ID, not a URL`);
    if (p.image) checkImage(p.image, `${where} image`);
    (p.gallery || []).forEach((g, j) => checkImage(g, `${where} gallery[${j}]`));
    (p.links || []).forEach((l, j) => {
      need(l, ['label', 'url'], `${where} links[${j}]`);
      checkUrl(l.url, `${where} links[${j}]`);
      if (l.icon && !hasIcon(l.icon)) err(`${where} links[${j}]`, `unknown icon "${l.icon}"`);
    });
  });
  if ((projects || []).filter((p) => p.featured).length > 1) err('projects.json', 'only one project can be "featured"');

  // career.json
  need(career, ['skills', 'experience', 'education', 'achievements'], 'career.json');
  (career.testimonials || []).forEach((t, i) => {
    need(t, ['name', 'title', 'pull', 'quote'], `career.json testimonials[${i}]`);
    if (t.url) checkUrl(t.url, `career.json testimonials[${i}]`);
  });

  return errors;
}

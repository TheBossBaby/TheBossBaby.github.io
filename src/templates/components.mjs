import { html, cx } from '../lib/html.mjs';
import { icon } from './icons.mjs';

const STATUS_LABEL = { wip: 'In progress', complete: 'Complete' };

/** Width encoded in a responsive filename, e.g. "foo-800.webp" -> 800. */
const widthFromName = (src) => Number((/-(\d+)\.\w+$/.exec(src) || [])[1]) || 0;

/** Responsive <img>. Width/height are always set so the layout never shifts. */
export function image(ctx, img, { sizes = '100vw', eager = false, className = '' } = {}) {
  const smallW = img.srcSmall ? widthFromName(img.srcSmall) : 0;
  const srcset = smallW ? `${ctx.url(img.srcSmall)} ${smallW}w, ${ctx.url(img.src)} ${img.width}w` : '';
  return html`<img class="${className}" src="${ctx.url(img.src)}" ${srcset ? html`srcset="${srcset}" sizes="${sizes}"` : ''} width="${img.width}" height="${img.height}" alt="${img.alt}" ${eager ? html`fetchpriority="high"` : html`loading="lazy"`} decoding="async">`;
}

export const statusBadge = (status) =>
  html`<span class="${cx('badge', `badge-${status}`)}">${status === 'wip' ? html`<span class="pulse" aria-hidden="true"></span>` : ''}${STATUS_LABEL[status]}</span>`;

export const techList = (items, label = 'Tech stack') =>
  html`<ul class="tags" aria-label="${label}">${items.map((t) => html`<li>${t}</li>`)}</ul>`;

export function linkButton(link, variant = 'ghost') {
  return html`<a class="${cx('btn', `btn-${variant}`)}" href="${link.url}" target="_blank" rel="noopener">${link.icon ? icon(link.icon, { size: 18 }) : ''}<span>${link.label}</span>${icon('arrowUpRight', { size: 16 })}</a>`;
}

export function formatDate(iso, lang) {
  if (!iso) return '';
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang, { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

export function sectionHead({ id, eyebrow, title, lede }) {
  return html`<header class="section-head">
    <p class="eyebrow">${eyebrow}</p>
    <h2 id="${id}-title">${title}</h2>
    ${lede ? html`<p class="section-lede">${lede}</p>` : ''}
  </header>`;
}

/** Project tile used in the work grid and in "more work" on project pages. */
export function projectCard(ctx, project, { headingLevel = 3 } = {}) {
  const href = ctx.url(ctx.projectPath(project));
  const link = html`<a class="card-link" href="${href}">${project.shortTitle || project.title}</a>`;
  // The link's ::after stretches over the whole card, so the card is one tab stop.
  return html`<article class="card">
    <div class="card-media">
      ${image(ctx, project.image, { sizes: '(min-width: 1100px) 360px, (min-width: 700px) 45vw, 100vw' })}
    </div>
    <div class="card-body">
      <p class="card-meta">${statusBadge(project.status)}<span class="mono">${project.category}</span></p>
      ${headingLevel === 2 ? html`<h2 class="card-title">${link}</h2>` : html`<h3 class="card-title">${link}</h3>`}
      <p class="card-text">${project.tagline}</p>
      ${techList(project.tech.slice(0, 4))}
    </div>
  </article>`;
}

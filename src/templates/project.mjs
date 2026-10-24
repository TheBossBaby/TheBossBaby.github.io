import { html } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { layout } from './layout.mjs';
import { projectJsonLd } from './seo.mjs';
import { image, statusBadge, techList, linkButton, formatDate, projectCard } from './components.mjs';

function meta(ctx, p) {
  const rows = [
    ['Status', statusBadge(p.status)],
    ['Role', p.role],
    p.year && ['Year', p.year],
    p.updated && ['Last update', formatDate(p.updated, ctx.site.lang)],
    p.platforms?.length && ['Platforms', p.platforms.join(', ')],
  ].filter(Boolean);
  return html`<dl class="meta">
    ${rows.map(([k, v]) => html`<div><dt>${k}</dt><dd>${v}</dd></div>`)}
    <div class="meta-wide"><dt>Stack</dt><dd>${techList(p.tech)}</dd></div>
  </dl>`;
}

function media(ctx, p) {
  if (p.video) {
    // Click-to-load YouTube: no third-party requests until the visitor asks for the video.
    return html`<div class="video" data-youtube="${p.video}">
      ${image(ctx, p.image, { sizes: '(min-width: 1200px) 1120px, 100vw', eager: true })}
      <button class="video-play" type="button" aria-label="Play video: ${p.title}"><svg width="68" height="48" viewBox="0 0 68 48" aria-hidden="true"><path d="M66.5 7.7A8.5 8.5 0 0 0 60.5 1.7C55.2.3 34 .3 34 .3S12.8.3 7.5 1.7a8.5 8.5 0 0 0-6 6C.1 13 .1 24 .1 24s0 11 1.4 16.3a8.5 8.5 0 0 0 6 6C12.8 47.7 34 47.7 34 47.7s21.2 0 26.5-1.4a8.5 8.5 0 0 0 6-6C67.9 35 67.9 24 67.9 24s0-11-1.4-16.3z" fill="#e33"/><path d="M45 24 27 14v20" fill="#fff"/></svg></button>
    </div>`;
  }
  return html`<figure class="project-hero-media">${image(ctx, p.image, { sizes: '(min-width: 1200px) 1120px, 100vw', eager: true })}</figure>`;
}

function sections(ctx, p) {
  const out = [];
  out.push(html`<section class="block" aria-labelledby="overview">
    <h2 id="overview" class="block-title">Overview</h2>
    <div class="prose">${p.overview.map((para) => html`<p>${para}</p>`)}</div>
  </section>`);

  if (p.architecture) {
    out.push(html`<section class="block" aria-labelledby="architecture">
      <h2 id="architecture" class="block-title">Architecture</h2>
      <div class="prose"><p>${p.architecture}</p></div>
    </section>`);
  }

  if (p.highlights?.length) {
    out.push(html`<section class="block" aria-labelledby="highlights">
      <h2 id="highlights" class="block-title">${p.highlightsTitle || 'Highlights'}</h2>
      <ul class="checklist checklist-lg">${p.highlights.map((h) => html`<li>${icon('check', { size: 18 })}<span>${h}</span></li>`)}</ul>
    </section>`);
  }

  if (p.knownIssues?.length) {
    out.push(html`<section class="block" aria-labelledby="known-issues">
      <h2 id="known-issues" class="block-title">Known issues</h2>
      <ul class="issues">${p.knownIssues.map((h) => html`<li>${icon('alert', { size: 18 })}<span>${h}</span></li>`)}</ul>
    </section>`);
  }

  if (p.roadmap?.length) {
    out.push(html`<section class="block" aria-labelledby="roadmap">
      <h2 id="roadmap" class="block-title">Roadmap</h2>
      <ol class="roadmap">${p.roadmap.map((r) => html`<li><span>${r}</span></li>`)}</ol>
    </section>`);
  }

  if (p.gallery?.length) {
    out.push(html`<section class="block" aria-labelledby="gallery">
      <h2 id="gallery" class="block-title">${p.galleryTitle || 'From the source'}</h2>
      <div class="gallery">
        ${p.gallery.map((g) => html`<figure class="shot">
          <a href="${ctx.url(g.src)}" target="_blank" rel="noopener" aria-label="Open full size: ${g.title || g.alt}">${image(ctx, g, { sizes: '(min-width: 1200px) 820px, 100vw' })}</a>
          <figcaption>${g.title ? html`<strong>${g.title}</strong>` : ''}${g.caption ? html`<span>${g.caption}</span>` : ''}</figcaption>
        </figure>`)}
      </div>
    </section>`);
  }
  return out;
}

export function renderProject(ctx, p, index) {
  const list = ctx.projects;
  const next = list[(index + 1) % list.length];
  const others = list.filter((x) => x !== p).slice(0, 3);
  const name = p.shortTitle || p.title;
  const description = `${p.tagline} ${p.summary}`.slice(0, 300);

  return layout(ctx, {
    path: ctx.projectPath(p),
    title: `${p.title} | ${p.tech.slice(0, 3).join(', ')} | ${ctx.site.name}`,
    description,
    ogType: 'article',
    ogImage: p.image.src,
    ogImageAlt: p.image.alt,
    jsonLd: projectJsonLd(ctx, p),
    bodyClass: 'page-project',
    preload: html`<link rel="preload" as="image" href="${ctx.url(p.image.src)}" fetchpriority="high">`,
    main: html`<article class="project">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="${ctx.url('/')}">Home</a></li>
        <li><a href="${ctx.url('/')}#work">Work</a></li>
        <li><span aria-current="page">${name}</span></li>
      </ol>
    </nav>
    <header class="project-head">
      <p class="eyebrow">${p.category}</p>
      <h1 class="project-title">${p.title}</h1>
      <p class="project-tagline">${p.tagline}</p>
      ${p.updateNote ? html`<p class="update-note mono">${p.updateNote}</p>` : ''}
      ${p.links.length ? html`<div class="actions">${p.links.map((l, i) => linkButton(l, i === 0 ? 'primary' : 'ghost'))}</div>` : ''}
    </header>
    ${media(ctx, p)}
    <div class="project-layout">
      <aside class="project-aside">${meta(ctx, p)}</aside>
      <div class="project-content">${sections(ctx, p)}</div>
    </div>
    <nav class="next-project" aria-label="Next project">
      <a href="${ctx.url(ctx.projectPath(next))}">
        <span class="mono muted">Next project</span>
        <span class="next-title">${next.shortTitle || next.title}${icon('arrowRight', { size: 22 })}</span>
      </a>
    </nav>
  </div>
</article>
<section class="section section-alt" aria-labelledby="more-title">
  <div class="container">
    <h2 id="more-title" class="more-title">More work</h2>
    <div class="grid">${others.map((o) => projectCard(ctx, o))}</div>
  </div>
</section>`,
  });
}

export function renderNotFound(ctx) {
  return layout(ctx, {
    path: '/404.html',
    title: `Page not found | ${ctx.site.name}`,
    description: 'This page does not exist.',
    noindex: true,
    bodyClass: 'page-404',
    main: html`<section class="section not-found">
  <div class="container">
    <p class="eyebrow">404</p>
    <h1 class="project-title">This frame was never rendered.</h1>
    <p class="project-tagline">The page you were looking for doesn't exist or has moved.</p>
    <div class="actions">
      <a class="btn btn-primary" href="${ctx.url('/')}">${icon('arrowLeft', { size: 18 })}<span>Back to home</span></a>
      <a class="btn btn-ghost" href="${ctx.url('/')}#work"><span>See my work</span></a>
    </div>
  </div>
</section>`,
  });
}


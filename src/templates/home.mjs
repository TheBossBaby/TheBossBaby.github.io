import { html, cx } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { layout } from './layout.mjs';
import { homeJsonLd } from './seo.mjs';
import { image, statusBadge, techList, formatDate, sectionHead } from './components.mjs';

// Visual first, text later. The hero names the role and where it was shipped,
// a band of headline numbers follows, then the project reel. The detail lives
// on the project pages, the case study and /cv/.

function hero(ctx) {
  const { site, career } = ctx;
  const featured = ctx.projects.find((p) => p.featured);
  const orgs = career.experience.filter((j) => j.impact?.length).map((j) => j.org);
  return html`<section class="hero" aria-labelledby="hero-title">
  <canvas class="hero-canvas" data-hero-canvas aria-hidden="true"></canvas>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="container hero-inner">
    <p class="availability"><span class="pulse" aria-hidden="true"></span>${site.availability}</p>
    <h1 id="hero-title" class="hero-title">${site.name}</h1>
    <p class="hero-role">${site.role}</p>
    <p class="hero-headline">${site.headline}</p>
    <div class="hero-actions">
      <a class="btn btn-primary" href="#projects"><span>See my work</span>${icon('arrowRight', { size: 18 })}</a>
      <a class="btn btn-ghost" href="#contact">${icon('mail', { size: 18 })}<span>Get in touch</span></a>
    </div>
    ${orgs.length
      ? html`<div class="hero-orgs">
      <p class="hero-orgs-label mono">Shipped at</p>
      <ul>${orgs.map((o) => html`<li>${o}</li>`)}</ul>
    </div>`
      : ''}
  </div>
  ${featured
    ? html`<p class="hero-caption mono" aria-hidden="true">Live WebGL sketch: a wormhole onto another galaxy · the end goal of <a href="${ctx.url(ctx.projectPath(featured))}" tabindex="-1">${featured.shortTitle || featured.title}</a></p>`
    : ''}
</section>`;
}

// Headline numbers, each with where it happened. Ones with a story link to it.
function statBand(ctx) {
  const { stats } = ctx.site;
  if (!stats?.length) return '';
  const body = (s) => html`<span class="stat-value">${s.value}</span>
        <span class="stat-label">${s.label}</span>
        ${s.context ? html`<span class="stat-context mono">${s.context}${s.href ? icon('arrowUpRight', { size: 14 }) : ''}</span>` : ''}`;
  return html`<section class="stat-band" aria-labelledby="stats-title">
  <div class="container">
    <h2 id="stats-title" class="sr-only">Highlights</h2>
    <ul class="stat-list">
      ${stats.map((s) => html`<li class="${cx('stat-item', s.href && 'has-link')}">${s.href ? html`<a href="${ctx.url(s.href)}">${body(s)}</a>` : body(s)}</li>`)}
    </ul>
  </div>
</section>`;
}

// A reel tile: the clip plays muted while on screen (main.js), with the title
// over it. The first tile is the featured project and gets the most space.
function reelTile(ctx, p, lead) {
  const href = ctx.url(ctx.projectPath(p));
  const next = p.status === 'wip' ? p.roadmap?.[0] : '';
  const v = p.video;
  const poster = ctx.url(lead ? p.image.src : p.image.srcSmall || p.image.src);
  // Clips with titles burned into one edge are cropped in the reel, where the
  // tile already has a title. The project page still shows the full frame.
  const band = v?.captionBand;
  const crop = band ? html` style="--crop-${band.edge}: ${(band.height / v.height).toFixed(3)}"` : '';
  const media = v
    ? html`<div class="tile-media" aria-hidden="true"${crop}>
        <video muted loop playsinline preload="none" poster="${poster}" tabindex="-1" data-autoplay>
          ${lead && v.srcSmall ? html`<source src="${ctx.url(v.srcSmall)}" type="video/mp4" media="(max-width: 700px)">` : ''}
          <source src="${ctx.url(lead ? v.src : v.srcSmall || v.src)}" type="video/mp4">
        </video>
      </div>`
    : html`<div class="tile-media">${image(ctx, p.image, { sizes: lead ? '(min-width: 760px) 60vw, 100vw' : '(min-width: 760px) 45vw, 100vw' })}</div>`;
  return html`<article class="${cx('tile', lead && 'tile-lead')}">
    ${media}
    <div class="tile-top">
      ${p.status === 'wip'
        ? html`${statusBadge(p.status)}${p.updated ? html`<span class="tile-chip mono">Updated ${formatDate(p.updated, ctx.site.lang)}</span>` : ''}`
        : html`<span class="tile-chip mono">${p.category}</span>`}
    </div>
    <div class="tile-body">
      <h3 class="tile-title"><a class="tile-link" href="${href}">${lead ? p.title : p.shortTitle || p.title}</a></h3>
      <p class="tile-text">${p.tagline}</p>
      ${next ? html`<p class="tile-next mono">${icon('arrowRight', { size: 14 })}Next up: ${next}</p>` : ''}
    </div>
    <span class="tile-arrow" aria-hidden="true">${icon('arrowUpRight', { size: 20 })}</span>
  </article>`;
}

function projects(ctx) {
  const copy = ctx.site.sections.projects;
  const list = [...ctx.projects].sort((a, b) => Number(Boolean(b.featured)) - Number(Boolean(a.featured)));
  return html`<section id="projects" class="section" aria-labelledby="projects-title">
  <div class="container">
    ${sectionHead({ id: 'projects', ...copy })}
    <div class="reel">${list.map((p, i) => reelTile(ctx, p, i === 0))}</div>
  </div>
</section>`;
}

// Client work is under NDA, so each card leads with its measured outcomes.
function professionalCard(ctx, j) {
  return html`<article class="${cx('pro-card', j.current && 'is-current')}">
    <header class="pro-head">
      <p class="pro-org">${j.org}${j.current ? html`<span class="badge badge-complete">Current</span>` : ''}${j.context ? html`<span class="badge badge-note">${j.context}</span>` : ''}</p>
      <h3 class="pro-role">${j.role}</h3>
      <p class="pro-when mono">${j.period}</p>
    </header>
    <dl class="pro-impact">
      ${j.impact.map((m) => html`<div><dt>${m.label}</dt><dd>${m.value}</dd></div>`)}
    </dl>
    ${j.caseStudy ? html`<a class="pro-case-link" href="${ctx.url(ctx.caseStudyPath(j.caseStudy))}"><span><span class="pro-case-kicker">Case study</span>${j.caseStudy.title}</span>${icon('arrowRight', { size: 16 })}</a>` : ''}
  </article>`;
}

// One dated line from now back to the first job, study included, so the order of
// events (industry, MSc, then Tencent) is clear before the cards.
function careerPath(career) {
  const year = (d) => (d ? String(d).slice(0, 4) : '');
  const steps = [
    ...career.experience.filter((j) => j.path).map((j) => ({ ...j.path, start: j.start, end: j.end, current: j.current })),
    ...career.education.filter((e) => e.path).map((e) => ({ ...e.path, start: e.start, end: e.end, study: true })),
  ].sort((a, b) => String(b.start).localeCompare(String(a.start))); // newest first, like the cards
  if (steps.length < 2) return '';
  return html`<ol class="career-path" aria-label="Career path" style="--steps: ${steps.length}">
    ${steps.map((s) => html`<li class="${cx('path-step', s.current && 'is-current', s.study && 'is-study')}">
      <span class="path-years mono">${year(s.start)}–${s.current ? 'now' : year(s.end)}</span>
      <span class="path-org">${s.org}</span>
      <span class="path-label">${s.label}</span>
    </li>`)}
  </ol>`;
}

function professional(ctx) {
  const { career, site } = ctx;
  const featured = career.experience.filter((j) => j.impact?.length);
  const orgs = featured.map((j) => j.org).join(', ').replace(/, ([^,]*)$/, ' and $1');
  return html`<section id="work" class="section section-alt" aria-labelledby="work-title">
  <div class="container">
    ${sectionHead({ id: 'work', eyebrow: site.sections.work.eyebrow, title: `Shipped at ${orgs}`, lede: site.sections.work.lede })}
    ${careerPath(career)}
    <div class="pro-grid">${featured.map((j) => professionalCard(ctx, j))}</div>
    <div class="actions">
      <a class="btn btn-ghost" href="${ctx.url('/cv/')}"><span>Every role in detail on the CV</span>${icon('arrowRight', { size: 18 })}</a>
    </div>
  </div>
</section>`;
}

function about(ctx) {
  const { site, career } = ctx;
  const awards = career.achievements.filter((a) => a.kind === 'personal');
  const fact = (title, detail, glyph) => html`<li>${glyph ? icon(glyph, { size: 18 }) : html`<span class="fact-dot" aria-hidden="true"></span>`}<span><strong>${title}</strong><span>${detail}</span></span></li>`;
  return html`<section id="about" class="section" aria-labelledby="about-title">
  <div class="container about">
    <figure class="portrait">
      ${image(ctx, site.portrait, { sizes: '(min-width: 900px) 380px, 80vw' })}
      <figcaption class="mono">${icon('pin', { size: 14 })}${site.location}</figcaption>
    </figure>
    <div class="about-body">
      ${sectionHead({ id: 'about', ...site.sections.about })}
      <div class="prose">${site.about.map((para) => html`<p>${para}</p>`)}</div>
      <h3 class="mini-head">Core skills</h3>
      ${techList(career.coreSkills, 'Core skills')}
      <div class="facts">
        <div>
          <h3 class="mini-head">Education</h3>
          <ul class="facts-list">${career.education.map((e) => fact(e.course, [e.org, e.period].filter(Boolean).join(' · ')))}</ul>
        </div>
        ${awards.length
          ? html`<div>
          <h3 class="mini-head">Awards</h3>
          <ul class="facts-list">${awards.map((a) => fact(a.title, a.detail, 'award'))}</ul>
        </div>`
          : ''}
      </div>
    </div>
  </div>
</section>`;
}

function testimonials(ctx) {
  const list = ctx.career.testimonials;
  if (!list.length) return '';
  return html`<section class="section section-alt" aria-labelledby="testimonials-title">
  <div class="container">
    ${sectionHead({ id: 'testimonials', ...ctx.site.sections.testimonials })}
    ${list.map((t) => html`<figure class="testimonial">
      <blockquote>
        <p class="pull">“${t.pull}”</p>
        <details class="full-quote">
          <summary>Read the full recommendation</summary>
          ${t.quote.map((q) => html`<p>${q}</p>`)}
        </details>
      </blockquote>
      <figcaption>
        <span class="avatar" aria-hidden="true">${t.name.split(' ').map((n) => n[0]).join('')}</span>
        <span><a href="${t.url}" target="_blank" rel="noopener"><strong>${t.name}</strong></a><br><span class="muted">${t.title}</span><br><span class="muted small">${t.relation}</span></span>
      </figcaption>
    </figure>`)}
  </div>
</section>`;
}

function contact(ctx) {
  const { site } = ctx;
  const c = site.contact;
  return html`<section id="contact" class="section contact" aria-labelledby="contact-title">
  <div class="container contact-inner">
    ${sectionHead({ id: 'contact', eyebrow: 'Contact', title: c.heading, lede: c.text })}
    <div class="contact-email">
      <a class="email-link" href="mailto:${site.email}">${site.email}</a>
      <button class="btn btn-ghost btn-small" type="button" data-copy="${site.email}">${icon('copy', { size: 16 })}<span data-copy-label>Copy</span></button>
    </div>
    ${site.showPhone ? html`<p class="contact-phone"><a href="tel:${site.phone.replace(/\s+/g, '')}">${icon('phone', { size: 16 })}${site.phone}</a></p>` : ''}
    <ul class="contact-socials">
      ${site.socials.map((s) => html`<li><a class="social-card" href="${s.url}" target="_blank" rel="me noopener">${icon(s.icon, { size: 22 })}<span><strong>${s.label}</strong><span class="muted">${s.handle}</span></span>${icon('arrowUpRight', { size: 16 })}</a></li>`)}
    </ul>
    ${c.formAction ? contactForm(c.formAction) : ''}
  </div>
</section>`;
}

// Rendered only when data/site.json sets contact.formAction (e.g. a Formspree endpoint).
function contactForm(action) {
  return html`<form class="contact-form" action="${action}" method="POST">
    <div class="field"><label for="cf-name">Name</label><input id="cf-name" name="name" autocomplete="name" required></div>
    <div class="field"><label for="cf-email">Email</label><input id="cf-email" name="email" type="email" autocomplete="email" required></div>
    <div class="field field-full"><label for="cf-subject">Subject</label><input id="cf-subject" name="subject"></div>
    <div class="field field-full"><label for="cf-message">Message</label><textarea id="cf-message" name="message" rows="5" required></textarea></div>
    <button class="btn btn-primary" type="submit"><span>Send message</span>${icon('arrowRight', { size: 18 })}</button>
  </form>`;
}

export function renderHome(ctx) {
  const { site } = ctx;
  return layout(ctx, {
    path: '/',
    title: site.seo.title,
    description: site.seo.description,
    jsonLd: homeJsonLd(ctx),
    bodyClass: 'page-home',
    main: html`${hero(ctx)}${statBand(ctx)}${projects(ctx)}${professional(ctx)}${about(ctx)}${testimonials(ctx)}${contact(ctx)}`,
    scripts: html`<script src="${ctx.asset('js/hero.js')}" defer></script>`,
  });
}

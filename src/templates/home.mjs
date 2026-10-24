import { html } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { layout } from './layout.mjs';
import { homeJsonLd } from './seo.mjs';
import { image, statusBadge, techList, linkButton, formatDate, sectionHead, projectCard, videoPlayer } from './components.mjs';

function hero(ctx) {
  const { site } = ctx;
  const featured = ctx.projects.find((p) => p.featured);
  return html`<section class="hero" aria-labelledby="hero-title">
  <canvas class="hero-canvas" data-hero-canvas aria-hidden="true"></canvas>
  <div class="hero-scrim" aria-hidden="true"></div>
  <div class="container hero-inner">
    <p class="availability"><span class="pulse" aria-hidden="true"></span>${site.availability}</p>
    <h1 id="hero-title" class="hero-title">${site.name}</h1>
    <p class="hero-role">${site.role}</p>
    <p class="hero-intro">${site.intro}</p>
    <ul class="hero-focus" aria-label="Core stack">${site.focus.map((f) => html`<li>${f}</li>`)}</ul>
    <div class="hero-actions">
      <a class="btn btn-primary" href="#work"><span>See my work</span>${icon('arrowRight', { size: 18 })}</a>
      <a class="btn btn-ghost" href="#contact">${icon('mail', { size: 18 })}<span>Get in touch</span></a>
    </div>
    <dl class="stats">
      ${site.stats.map((s) => html`<div class="stat"><dt>${s.label}</dt><dd>${s.value}</dd></div>`)}
    </dl>
  </div>
  ${featured
    ? html`<p class="hero-caption mono" aria-hidden="true">Live WebGL sketch: a wormhole onto another galaxy · the end goal of <a href="${ctx.url(ctx.projectPath(featured))}" tabindex="-1">${featured.shortTitle || featured.title}</a></p>`
    : ''}
</section>`;
}

function featuredProject(ctx, p) {
  const href = ctx.url(ctx.projectPath(p));
  const next = p.roadmap?.[0];
  return html`<article class="featured" aria-labelledby="featured-title">
    <div class="featured-media">
      ${p.video
        ? videoPlayer(ctx, p.video, { controls: false, label: `${p.title}: video demo` })
        : image(ctx, p.image, { sizes: '(min-width: 1100px) 620px, 100vw' })}
      <span class="featured-flag mono">Currently building</span>
    </div>
    <div class="featured-body">
      <p class="card-meta">${statusBadge(p.status)}${p.updated ? html`<span class="mono">Updated ${formatDate(p.updated, ctx.site.lang)}</span>` : ''}</p>
      <h3 id="featured-title" class="featured-title"><a href="${href}">${p.title}</a></h3>
      <p class="featured-tagline">${p.tagline}</p>
      <p class="featured-summary">${p.summary}</p>
      <ul class="progress-line">
        ${p.highlights?.length ? html`<li>${icon('check', { size: 16 })}<span><strong>${p.highlights.length}</strong> features working</span></li>` : ''}
        ${next ? html`<li>${icon('arrowRight', { size: 16 })}<span>Next up: <strong>${next}</strong></span></li>` : ''}
      </ul>
      ${techList(p.tech.slice(0, 5))}
      <div class="actions">
        <a class="btn btn-primary" href="${href}"><span>Read the build log</span>${icon('arrowRight', { size: 18 })}</a>
        ${p.links.slice(0, 1).map((l) => linkButton(l))}
      </div>
    </div>
  </article>`;
}

function work(ctx) {
  const featured = ctx.projects.find((p) => p.featured);
  const rest = ctx.projects.filter((p) => p !== featured);
  return html`<section id="work" class="section" aria-labelledby="work-title">
  <div class="container">
    ${sectionHead({ id: 'work', eyebrow: 'Selected work', title: 'Renderers, engines and games', lede: 'Everything here is built from scratch in C++. No middleware between my code and the GPU.' })}
    ${featured ? featuredProject(ctx, featured) : ''}
    <div class="grid">
      ${rest.map((p) => projectCard(ctx, p))}
    </div>
  </div>
</section>`;
}

function about(ctx) {
  const { site, career } = ctx;
  return html`<section id="about" class="section section-alt" aria-labelledby="about-title">
  <div class="container about">
    <figure class="portrait">
      ${image(ctx, site.portrait, { sizes: '(min-width: 900px) 380px, 80vw' })}
      <figcaption class="mono">${icon('pin', { size: 14 })}${site.location}</figcaption>
    </figure>
    <div class="about-body">
      ${sectionHead({ id: 'about', eyebrow: 'About', title: 'From Unity freelancing to Samsung, Tencent and my own Vulkan engine' })}
      <div class="prose">${site.about.map((para) => html`<p>${para}</p>`)}</div>
      <h3 class="mini-head">Core skills</h3>
      ${techList(career.coreSkills, 'Core skills')}
      <div class="actions">
        <a class="btn btn-ghost" href="${ctx.url('/cv/')}"><span>Full CV and skills</span>${icon('arrowRight', { size: 18 })}</a>
      </div>
    </div>
  </div>
</section>`;
}

// Home shows one line per role; the CV page has every bullet.
function experience(ctx) {
  const { career } = ctx;
  return html`<section id="experience" class="section" aria-labelledby="experience-title">
  <div class="container">
    ${sectionHead({ id: 'experience', eyebrow: 'Experience', title: 'Where I have shipped' })}
    <div class="experience">
      <ol class="roles">
        ${career.experience.map((j) => html`<li class="${j.current ? 'role is-current' : 'role'}">
          <p class="role-period mono">${j.period}</p>
          <div>
            <h3 class="role-title">${j.role} <span class="at">at ${j.org}</span>${j.current ? html` <span class="badge badge-complete">Current</span>` : ''}</h3>
            <p class="role-headline">${j.headline}</p>
          </div>
        </li>`)}
      </ol>
      <aside class="side-cards">
        <div class="panel">
          <h3 class="mini-head">Education</h3>
          <ul class="plain">${career.education.map((e) => html`<li><strong>${e.course}</strong><span>${e.org}</span></li>`)}</ul>
        </div>
        <div class="panel">
          <h3 class="mini-head">Recognition</h3>
          <ul class="plain">${career.achievements.map((a) => html`<li><strong>${a.title}</strong></li>`)}</ul>
        </div>
      </aside>
    </div>
    <div class="actions">
      <a class="btn btn-primary" href="${ctx.url('/cv/')}"><span>See the full CV</span>${icon('arrowRight', { size: 18 })}</a>
    </div>
  </div>
</section>`;
}

function testimonials(ctx) {
  const list = ctx.career.testimonials;
  if (!list.length) return '';
  return html`<section class="section section-alt" aria-labelledby="testimonials-title">
  <div class="container">
    ${sectionHead({ id: 'testimonials', eyebrow: 'Recommendation', title: 'What my manager said' })}
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
    main: html`${hero(ctx)}${work(ctx)}${about(ctx)}${experience(ctx)}${testimonials(ctx)}${contact(ctx)}`,
    scripts: html`<script src="${ctx.asset('js/hero.js')}" defer></script>`,
  });
}

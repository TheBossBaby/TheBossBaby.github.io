import { html } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { layout } from './layout.mjs';
import { cvJsonLd } from './seo.mjs';
import { techList } from './components.mjs';

// The full CV: every role, bullet and skill. The home page links here instead
// of carrying all of this itself. Prints cleanly to PDF (see @media print).

const bullets = (points) => html`<ul class="bullets">${points.map((pt) => html`<li>${pt}</li>`)}</ul>`;

function job(j) {
  return html`<article class="cv-item">
    <header class="cv-item-head">
      <h3>${j.role} <span class="at">at ${j.org}</span></h3>
      <p class="mono cv-when">${j.period}${j.location ? html` · ${j.location}` : ''}</p>
    </header>
    <p class="cv-item-summary">${j.summary}</p>
    ${j.points?.length ? bullets(j.points) : ''}
    ${(j.groups || []).map((g) => html`<div class="cv-group"><h4>${g.title}</h4>${bullets(g.points)}</div>`)}
  </article>`;
}

function project(ctx, p) {
  return html`<article class="cv-item">
    <header class="cv-item-head">
      <h3><a href="${ctx.url(ctx.projectPath(p))}">${p.title}</a></h3>
      <p class="mono cv-when">${[p.status === 'wip' ? 'In progress' : p.year, p.platforms?.join(', ')].filter(Boolean).join(' · ')}</p>
    </header>
    <p class="cv-item-summary">${p.tagline}</p>
    ${bullets(p.highlights.slice(0, 4))}
  </article>`;
}

const section = (id, title, body) => html`<section class="cv-section" aria-labelledby="cv-${id}">
  <h2 id="cv-${id}" class="cv-section-title">${title}</h2>
  <div class="cv-section-body">${body}</div>
</section>`;

export function renderCv(ctx) {
  const { site, career, projects } = ctx;
  const github = site.socials.find((s) => s.icon === 'github');
  const linkedin = site.socials.find((s) => s.icon === 'linkedin');

  return layout(ctx, {
    path: '/cv/',
    title: `CV | ${site.name}, ${site.role}`,
    description: `Full CV of ${site.name}: ${career.experience.map((j) => j.org).join(', ')}. ${site.role} with 7 years in C++, Unreal Engine, Unity, Vulkan and OpenGL.`.slice(0, 300),
    ogType: 'profile',
    jsonLd: cvJsonLd(ctx),
    bodyClass: 'page-cv',
    main: html`<article class="cv">
  <div class="container cv-container">
    <nav class="breadcrumbs no-print" aria-label="Breadcrumb">
      <ol>
        <li><a href="${ctx.url('/')}">Home</a></li>
        <li><span aria-current="page">CV</span></li>
      </ol>
    </nav>
    <header class="cv-head">
      <div>
        <p class="eyebrow">Curriculum vitae</p>
        <h1 class="cv-name">${site.name}</h1>
        <p class="cv-role">${site.role} · ${site.location}</p>
        <ul class="cv-contact">
          <li><a href="mailto:${site.email}">${icon('mail', { size: 16 })}<span>${site.email}</span></a></li>
          ${linkedin ? html`<li><a href="${linkedin.url}" rel="me noopener" target="_blank">${icon('linkedin', { size: 16 })}<span>${linkedin.handle}</span></a></li>` : ''}
          ${github ? html`<li><a href="${github.url}" rel="me noopener" target="_blank">${icon('github', { size: 16 })}<span>${github.handle}</span></a></li>` : ''}
          <li class="print-only"><span>${ctx.abs('/').replace(/^https?:\/\//, '').replace(/\/$/, '')}</span></li>
        </ul>
      </div>
      <div class="cv-actions no-print">
        <button class="btn btn-ghost" type="button" data-print>${icon('download', { size: 18 })}<span>Save as PDF</span></button>
        <a class="btn btn-primary" href="mailto:${site.email}">${icon('mail', { size: 18 })}<span>Email me</span></a>
      </div>
    </header>

    ${section('profile', 'Profile', html`<p class="cv-profile">${career.profile}</p>`)}
    ${section('experience', 'Experience', career.experience.map(job))}
    ${section('projects', 'Selected projects', projects.map((p) => project(ctx, p)))}
    ${section('skills', 'Skills', html`<dl class="skills">${career.skills.map((g) => html`<div class="skill-row"><dt>${g.group}</dt><dd>${techList(g.items, g.group)}</dd></div>`)}</dl>`)}
    ${section('education', 'Education', career.education.map((e) => html`<article class="cv-item">
      <header class="cv-item-head"><h3>${e.course}</h3><p class="mono cv-when">${e.period}</p></header>
      <p class="cv-item-summary">${e.org}</p>
    </article>`))}
    ${section('recognition', 'Recognition', html`<ul class="plain">${career.achievements.map((a) => html`<li><strong>${a.title}</strong><span>${a.detail}</span></li>`)}</ul>`)}
  </div>
</article>`,
  });
}

import { html } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { layout } from './layout.mjs';
import { caseStudyJsonLd } from './seo.mjs';
import { techList, metricsList } from './components.mjs';

// A professional case study gets its own page, linked from its role's card on
// the home page. Data: career.json -> experience[].caseStudy.

// Before/after bars drawn to scale, then what ships in the APK and what is
// downloaded on demand.
function sizeDiagram(size) {
  if (!size) return '';
  const pct = Math.max(0.5, Math.min(100, size.ratio * 100));
  return html`<figure class="size-diagram" aria-labelledby="size-caption">
    <div class="size-row">
      <p class="size-head"><span>Before</span><strong>${size.before}</strong></p>
      <div class="size-bar"><span class="size-fill is-before" style="width: 100%"></span></div>
      <p class="size-note">Everything packaged into the APK</p>
    </div>
    <div class="size-row">
      <p class="size-head"><span>After</span><strong>${size.after}</strong></p>
      <div class="size-bar"><span class="size-fill is-after" style="width: ${pct.toFixed(1)}%"></span></div>
      <p class="size-note">Ships only: ${size.shipped.join(' + ')}</p>
    </div>
    <div class="size-demand">
      <p class="size-head"><span>Downloaded on demand, mounted at runtime</span></p>
      <ul class="pak-list">${size.onDemand.map((p) => html`<li><span class="mono">PAK</span>${p}</li>`)}</ul>
    </div>
    <figcaption id="size-caption" class="media-caption">APK size before and after, drawn to scale.</figcaption>
  </figure>`;
}

export function renderCaseStudy(ctx, job) {
  const cs = job.caseStudy;
  const section = (id, title, body) => html`<section class="block" aria-labelledby="${id}">
    <h2 id="${id}" class="block-title">${title}</h2>
    ${body}
  </section>`;

  return layout(ctx, {
    path: ctx.caseStudyPath(cs),
    title: `${cs.title} | ${job.org} case study | ${ctx.site.name}`,
    description: cs.summary,
    ogType: 'article',
    jsonLd: caseStudyJsonLd(ctx, job),
    bodyClass: 'page-case',
    main: html`<article class="project case">
  <div class="container">
    <nav class="breadcrumbs" aria-label="Breadcrumb">
      <ol>
        <li><a href="${ctx.url('/')}">Home</a></li>
        <li><a href="${ctx.url('/')}#work">Work</a></li>
        <li><span aria-current="page">Case study</span></li>
      </ol>
    </nav>
    <header class="project-head">
      <p class="eyebrow">Case study · ${job.org}</p>
      <h1 class="project-title">${cs.title}</h1>
      <p class="project-tagline">${cs.summary}</p>
      ${metricsList(cs.metrics)}
    </header>
    ${sizeDiagram(cs.size)}
    <div class="project-layout">
      <aside class="project-aside">
        <dl class="meta">
          <div><dt>Company</dt><dd>${job.org}</dd></div>
          <div><dt>Role</dt><dd>${job.role}</dd></div>
          <div><dt>When</dt><dd>${job.period}</dd></div>
          ${job.location ? html`<div><dt>Where</dt><dd>${job.location}</dd></div>` : ''}
          ${cs.stack?.length ? html`<div class="meta-wide"><dt>Stack</dt><dd>${techList(cs.stack)}</dd></div>` : ''}
        </dl>
      </aside>
      <div class="project-content">
        ${section('challenge', 'The challenge', html`<div class="prose"><p>${cs.challenge}</p></div>`)}
        ${cs.insight ? section('insight', 'The insight', html`<div class="prose"><p>${cs.insight}</p></div>`) : ''}
        ${section('approach', 'The approach', html`<ol class="roadmap steps">${cs.approach.map((a) => html`<li><span>${a}</span></li>`)}</ol>`)}
        ${section('results', 'The results', html`<ul class="checklist checklist-lg">${cs.results.map((r) => html`<li>${icon('check', { size: 18 })}<span>${r}</span></li>`)}</ul>`)}
      </div>
    </div>
    <nav class="next-project" aria-label="More">
      <a href="${ctx.url('/')}#work">
        <span class="mono muted">Back to</span>
        <span class="next-title">Professional work${icon('arrowRight', { size: 22 })}</span>
      </a>
    </nav>
  </div>
</article>`,
  });
}

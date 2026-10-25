import { html, raw } from '../lib/html.mjs';
import { icon } from './icons.mjs';
import { analyticsScripts, consentBanner, consentFooterLink } from './analytics.mjs';

const NAV = [
  { label: 'Work', hash: 'work' },
  { label: 'About', hash: 'about' },
  { label: 'Experience', hash: 'experience' },
  { label: 'Contact', hash: 'contact' },
];

const FONTS_URL =
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Space+Grotesk:wght@400;500;600;700&display=swap';

/** The site's mark: a wormhole mouth with a galaxy on the far side, a nod to Project V's goal. */
export const brandMark = (size = 28) =>
  raw(`<svg class="brand-mark" width="${size}" height="${size}" viewBox="0 0 32 32" aria-hidden="true" focusable="false"><circle cx="16" cy="16" r="12" fill="none" stroke="currentColor" stroke-width="2.4"/><ellipse cx="16" cy="16" rx="7.5" ry="2.8" fill="currentColor" opacity=".4" transform="rotate(-28 16 16)"/><path d="M10.6 18.4c1.6 2.4 6.4 2.9 9.1.6M21.4 13.6c-1.6-2.4-6.4-2.9-9.1-.6" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" opacity=".75"/><circle cx="16" cy="16" r="2.2" fill="currentColor"/></svg>`);

function head(ctx, page) {
  const { site } = ctx;
  const canonical = ctx.abs(page.path);
  const ogImage = ctx.abs(page.ogImage || site.seo.ogImage);
  const ogAlt = page.ogImageAlt || site.seo.ogImageAlt;
  const jsonLd = page.jsonLd ? raw(JSON.stringify(page.jsonLd).replace(/</g, '\\u003c')) : null;

  return html`<head>
  <meta charset="utf-8">
  <script>document.documentElement.classList.replace('no-js','js')</script>
  <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
  <title>${page.title}</title>
  <meta name="description" content="${page.description}">
  <meta name="author" content="${site.name}">
  ${page.noindex ? html`<meta name="robots" content="noindex">` : html`<link rel="canonical" href="${canonical}">`}
  <meta name="theme-color" content="#0a0b10">
  <meta name="color-scheme" content="dark">

  <meta property="og:type" content="${page.ogType || 'website'}">
  <meta property="og:site_name" content="${site.name}">
  <meta property="og:locale" content="${site.locale}">
  <meta property="og:title" content="${page.title}">
  <meta property="og:description" content="${page.description}">
  <meta property="og:url" content="${canonical}">
  <meta property="og:image" content="${ogImage}">
  <meta property="og:image:alt" content="${ogAlt}">
  <meta name="twitter:card" content="summary_large_image">
  ${site.seo.twitterHandle ? html`<meta name="twitter:site" content="${site.seo.twitterHandle}">` : ''}

  <link rel="icon" href="${ctx.url('/favicon.svg')}" type="image/svg+xml">
  <link rel="apple-touch-icon" href="${ctx.url('/apple-touch-icon.png')}">
  <link rel="manifest" href="${ctx.url('/site.webmanifest')}">

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link rel="stylesheet" href="${FONTS_URL}">
  <link rel="stylesheet" href="${ctx.asset('css/main.css')}">
  ${page.preload || ''}
  ${jsonLd ? html`<script type="application/ld+json">${jsonLd}</script>` : ''}
</head>`;
}

function header(ctx) {
  const { site } = ctx;
  return html`<header class="site-header" data-header>
  <div class="container header-inner">
    <a class="brand" href="${ctx.url('/')}" aria-label="${site.name}, home">
      ${brandMark()}
      <span class="brand-name">${site.name}</span>
    </a>
    <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav" data-nav-toggle>
      <span class="sr-only">Menu</span>
      <span class="nav-toggle-open">${icon('menu')}</span>
      <span class="nav-toggle-close">${icon('close')}</span>
    </button>
    <nav class="site-nav" id="site-nav" aria-label="Primary" data-nav>
      <ul>
        ${NAV.map((item) => html`<li><a href="${ctx.url('/')}#${item.hash}" data-nav-link="${item.hash}">${item.label}</a></li>`)}
      </ul>
      <a class="btn btn-small btn-primary" href="mailto:${site.email}">${icon('mail', { size: 16 })}<span>Email me</span></a>
    </nav>
  </div>
</header>`;
}

function footer(ctx) {
  const { site } = ctx;
  return html`<footer class="site-footer">
  <div class="container footer-inner">
    <p class="footer-copy">© ${ctx.year} ${site.name}. ${site.role}, ${site.location}.</p>
    <ul class="social-row" aria-label="Social profiles">
      ${site.socials.map((s) => html`<li><a href="${s.url}" rel="me noopener" target="_blank" aria-label="${s.label}">${icon(s.icon)}</a></li>`)}
    </ul>
    ${consentFooterLink(ctx)}
    <a class="back-to-top" href="#top">${icon('arrowUp', { size: 16 })}<span>Back to top</span></a>
  </div>
</footer>`;
}

/** Full HTML document. `page.main` is the page body; everything else is metadata. */
export function layout(ctx, page) {
  const devReload = ctx.dev
    ? raw(`<script>new EventSource('/__reload').onmessage=()=>location.reload()</script>`)
    : '';
  return `<!doctype html>
${html`<html lang="${ctx.site.lang}" class="no-js">
${head(ctx, page)}
<body class="${page.bodyClass || ''}" id="top">
<a class="skip-link" href="#main">Skip to content</a>
${header(ctx)}
<main id="main" tabindex="-1">
${page.main}
</main>
${footer(ctx)}
${consentBanner(ctx)}
<script src="${ctx.asset('js/main.js')}" defer></script>
${analyticsScripts(ctx)}
${page.scripts || ''}
${devReload}
</body>
</html>`}
`;
}

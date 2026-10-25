import { html, raw } from '../lib/html.mjs';

// Markup for Google Analytics. Everything here renders only when
// data/site.json sets analytics.gaMeasurementId; otherwise the site ships
// with no analytics code at all. Behaviour lives in src/scripts/analytics.js.

const measurementId = (ctx) => ctx.site.analytics?.gaMeasurementId || '';

export const analyticsEnabled = (ctx) => Boolean(measurementId(ctx));

/** Config for analytics.js plus the script itself (deferred, first-party). */
export function analyticsScripts(ctx) {
  if (!analyticsEnabled(ctx)) return '';
  const config = JSON.stringify({ measurementId: measurementId(ctx) }).replace(/</g, '\\u003c');
  return html`<script id="analytics-config" type="application/json">${raw(config)}</script>
<script src="${ctx.asset('js/analytics.js')}" defer></script>`;
}

/** Consent banner, hidden until analytics.js decides to show it. */
export function consentBanner(ctx) {
  if (!analyticsEnabled(ctx)) return '';
  return html`<div class="consent" data-consent-banner hidden role="region" aria-label="Analytics consent">
  <p class="consent-text"><strong>Analytics.</strong> ${ctx.site.analytics.bannerText}</p>
  <div class="consent-actions">
    <button class="btn btn-small btn-ghost" type="button" data-consent="decline">Decline</button>
    <button class="btn btn-small btn-primary" type="button" data-consent="accept">Accept</button>
  </div>
</div>`;
}

/** Footer control to change the choice later. */
export function consentFooterLink(ctx) {
  if (!analyticsEnabled(ctx)) return '';
  return html`<button class="link-button" type="button" data-consent-open>Cookie settings</button>`;
}

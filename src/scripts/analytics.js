// Google Analytics 4 with consent first.
//
// Nothing is loaded from Google and no cookie is set until the visitor clicks
// "Accept" (UK GDPR / PECR). The choice is remembered in localStorage and can
// be changed from the footer. A browser sending Global Privacy Control is
// treated as a "Decline" and is not shown the banner.
//
// Config comes from <script id="analytics-config" type="application/json">,
// rendered by the build from data/site.json.
(() => {
  'use strict';
  const configEl = document.getElementById('analytics-config');
  if (!configEl) return;
  let config;
  try { config = JSON.parse(configEl.textContent); } catch { return; }
  const id = config.measurementId;
  if (!/^G-[A-Z0-9]+$/.test(id || '')) return;

  const STORAGE_KEY = 'analytics-consent';
  const banner = document.querySelector('[data-consent-banner]');
  let loaded = false;

  const readChoice = () => { try { return localStorage.getItem(STORAGE_KEY); } catch { return null; } };
  const saveChoice = (v) => { try { localStorage.setItem(STORAGE_KEY, v); } catch { /* private mode: ask again next visit */ } };

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() { window.dataLayer.push(arguments); };
  // Consent Mode v2 defaults: everything denied until the visitor opts in.
  gtag('consent', 'default', {
    analytics_storage: 'denied',
    ad_storage: 'denied',
    ad_user_data: 'denied',
    ad_personalization: 'denied',
  });

  function load() {
    if (loaded) return;
    loaded = true;
    gtag('consent', 'update', { analytics_storage: 'granted' });
    gtag('js', new Date());
    gtag('config', id, { allow_google_signals: false, allow_ad_personalization_signals: false });
    const s = document.createElement('script');
    s.async = true;
    s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
    document.head.appendChild(s);
  }

  function showBanner(show) {
    if (!banner) return;
    banner.hidden = !show;
    if (show) banner.querySelector('[data-consent="accept"]')?.focus({ preventScroll: true });
  }

  function choose(value) {
    saveChoice(value);
    showBanner(false);
    if (value === 'granted') load();
    // Revoking after GA has loaded: stop collection now and clear its cookies.
    if (value === 'denied' && loaded) {
      gtag('consent', 'update', { analytics_storage: 'denied' });
      document.cookie.split(';').map((c) => c.split('=')[0].trim()).filter((n) => /^_ga/.test(n)).forEach((n) => {
        document.cookie = `${n}=; Max-Age=0; path=/; domain=${location.hostname}`;
        document.cookie = `${n}=; Max-Age=0; path=/`;
      });
    }
  }

  banner?.addEventListener('click', (e) => {
    const btn = e.target.closest('[data-consent]');
    if (btn) choose(btn.dataset.consent === 'accept' ? 'granted' : 'denied');
  });
  document.querySelectorAll('[data-consent-open]').forEach((b) => b.addEventListener('click', () => showBanner(true)));

  // An explicit choice always wins. With no choice yet, Global Privacy Control
  // counts as "decline": no banner, no Google requests (the footer link still
  // lets the visitor opt in deliberately).
  const gpc = navigator.globalPrivacyControl === true;
  const stored = readChoice();
  if (stored === 'granted') load();
  else if (!stored && !gpc) showBanner(true);

  // ---- Events (sent only after consent) -----------------------------------
  const track = (name, params = {}) => { if (loaded) gtag('event', name, params); };
  const page = () => location.pathname;

  document.addEventListener('click', (e) => {
    const el = e.target.closest('a, button');
    if (!el) return;
    if (el.matches('a[href^="mailto:"]')) track('contact_email', { page_path: page() });
    else if (el.matches('[data-copy]')) track('copy_email', { page_path: page() });
    else if (el.matches('[data-print]')) track('cv_save_pdf', { page_path: page() });
    else if (el.matches('a[href*="github.com"]')) track('github_click', { link_url: el.href, page_path: page() });
  }, { capture: true });

  // Video engagement. Demo clips autoplay muted when scrolled into view, so a
  // "play" alone says nothing; count unmuting (a deliberate action) and plays
  // of videos that don't autoplay. Card hover previews are ignored.
  const seen = new WeakSet();
  const videoTitle = (v) => v.getAttribute('aria-label') || v.currentSrc;
  document.addEventListener('volumechange', (e) => {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement) || v.muted || seen.has(v)) return;
    seen.add(v);
    track('video_unmute', { video_title: videoTitle(v), page_path: page() });
  }, { capture: true });
  document.addEventListener('play', (e) => {
    const v = e.target;
    if (!(v instanceof HTMLVideoElement) || v.matches('.card-preview, [data-autoplay]')) return;
    track('video_play', { video_title: videoTitle(v), page_path: page() });
  }, { capture: true });
})();

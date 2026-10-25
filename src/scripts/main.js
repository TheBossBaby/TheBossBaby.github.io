// Progressive enhancement only: every feature here is optional and the site
// works fully without JavaScript.
(() => {
  'use strict';
  const doc = document.documentElement;
  doc.classList.replace('no-js', 'js');
  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // Header border once the page scrolls.
  const header = document.querySelector('[data-header]');
  if (header) {
    const onScroll = () => header.toggleAttribute('data-scrolled', scrollY > 8);
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  // Mobile navigation.
  const toggle = document.querySelector('[data-nav-toggle]');
  const nav = document.querySelector('[data-nav]');
  if (toggle && nav) {
    const setOpen = (open) => {
      toggle.setAttribute('aria-expanded', String(open));
      nav.toggleAttribute('data-open', open);
    };
    toggle.addEventListener('click', () => setOpen(toggle.getAttribute('aria-expanded') !== 'true'));
    nav.addEventListener('click', (e) => { if (e.target.closest('a')) setOpen(false); });
    addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') { setOpen(false); toggle.focus(); }
    });
    matchMedia('(min-width: 860px)').addEventListener('change', () => setOpen(false));
  }

  // Highlight the nav link for the section in view (home page only).
  const links = new Map([...document.querySelectorAll('[data-nav-link]')].map((a) => [a.dataset.navLink, a]));
  const sections = [...links.keys()].map((id) => document.getElementById(id)).filter(Boolean);
  if (sections.length && 'IntersectionObserver' in window) {
    const spy = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        links.forEach((a) => a.removeAttribute('aria-current'));
        links.get(entry.target.id)?.setAttribute('aria-current', 'true');
      });
    }, { rootMargin: '-45% 0px -50% 0px' });
    sections.forEach((s) => spy.observe(s));
  }

  // "Save as PDF" on the CV page uses the browser's print dialog and the print stylesheet.
  document.querySelectorAll('[data-print]').forEach((btn) => btn.addEventListener('click', () => window.print()));

  // Copy-to-clipboard for the email address.
  document.querySelectorAll('[data-copy]').forEach((btn) => {
    const label = btn.querySelector('[data-copy-label]');
    btn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(btn.dataset.copy);
        if (label) label.textContent = 'Copied';
      } catch {
        if (label) label.textContent = 'Press Ctrl+C';
        getSelection()?.selectAllChildren(btn.previousElementSibling || btn);
      }
      setTimeout(() => { if (label) label.textContent = 'Copy'; }, 2200);
    });
  });

  // Click-to-load YouTube embeds (privacy-enhanced domain, no requests until clicked).
  document.querySelectorAll('[data-youtube]').forEach((box) => {
    box.querySelector('button')?.addEventListener('click', () => {
      const iframe = document.createElement('iframe');
      iframe.src = `https://www.youtube-nocookie.com/embed/${encodeURIComponent(box.dataset.youtube)}?autoplay=1&rel=0`;
      iframe.title = box.querySelector('img')?.alt || 'Project video';
      iframe.allow = 'accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture; fullscreen';
      iframe.allowFullscreen = true;
      box.replaceChildren(iframe);
    });
  });

  // Muted demo clips play only while on screen, so off-screen videos cost
  // nothing. With reduced motion they stay on their poster frame; the
  // project-page player still has controls for anyone who wants to play it.
  const autoplay = document.querySelectorAll('video[data-autoplay]');
  if (autoplay.length && !reduceMotion && 'IntersectionObserver' in window) {
    const io = new IntersectionObserver((entries) => {
      entries.forEach(({ target, isIntersecting }) => {
        if (isIntersecting) target.play().catch(() => {});
        else target.pause();
      });
    }, { threshold: 0.35 });
    autoplay.forEach((v) => io.observe(v));
  }

  // Card previews: play the low-res clip while a mouse or keyboard focus is on the card.
  if (!reduceMotion && matchMedia('(hover: hover)').matches) {
    document.querySelectorAll('.card.has-video').forEach((card) => {
      const clip = card.querySelector('[data-hover-play]');
      if (!clip) return;
      const start = () => {
        clip.play().then(() => card.classList.add('is-playing')).catch(() => {});
      };
      const stop = () => {
        card.classList.remove('is-playing');
        clip.pause();
        clip.currentTime = 0;
      };
      card.addEventListener('pointerenter', start);
      card.addEventListener('pointerleave', stop);
      card.addEventListener('focusin', start);
      card.addEventListener('focusout', stop);
    });
  }

  // Gentle reveal for content below the fold. Content already on screen is
  // never hidden, so there is no flash on load.
  if (!reduceMotion && 'IntersectionObserver' in window) {
    const targets = document.querySelectorAll('.section-head, .featured, .card, .about > *, .timeline-item, .panel, .testimonial, .block, .social-card');
    const reveal = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        reveal.unobserve(entry.target);
      });
    }, { rootMargin: '0px 0px -8% 0px' });
    targets.forEach((el) => {
      if (el.getBoundingClientRect().top < innerHeight) return;
      el.setAttribute('data-reveal', '');
      reveal.observe(el);
    });
  }
})();

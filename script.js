/* =============================================================================
   Nagaraj B — portfolio interactions
   Vanilla JS, no dependencies. All motion is transform/opacity based, repeatable,
   and gated by prefers-reduced-motion + a manual switch saved in localStorage.
   ========================================================================== */
(() => {
  'use strict';

  // Portfolios should always open on the hero — don't let a reload restore a
  // deep scroll position (which makes the page look like it "loads scrolled").
  if ('scrollRestoration' in history) {
    try { history.scrollRestoration = 'manual'; } catch (err) { /* ignore */ }
  }
  if (!window.location.hash && window.scrollY > 0) {
    window.scrollTo(0, 0);
  }

  const html = document.documentElement;
  const reduceMQ = window.matchMedia('(prefers-reduced-motion: reduce)');
  const fineMQ = window.matchMedia('(hover: hover) and (pointer: fine)');
  const MOTION_KEY = 'nb-reduce-motion';
  const motionToggle = document.querySelector('[data-motion-toggle]');
  const toastEl = document.querySelector('[data-toast]');

  let motionOff = false;
  let toastTimer = 0;

  /* ------------------------------- helpers ------------------------------- */
  function readStoredMotion() {
    try { return window.localStorage.getItem(MOTION_KEY); } catch (err) { return null; }
  }
  function storeMotion(value) {
    try { window.localStorage.setItem(MOTION_KEY, value); } catch (err) { /* private mode */ }
  }
  function toast(message) {
    if (!toastEl) return;
    toastEl.textContent = message;
    toastEl.classList.add('is-on');
    window.clearTimeout(toastTimer);
    toastTimer = window.setTimeout(() => toastEl.classList.remove('is-on'), 3200);
  }

  /* ----------------------------- motion switch ---------------------------- */
  // sync=false is used for the first paint, before the observers exist.
  function setMotionOff(off, { persist = true, sync = true } = {}) {
    motionOff = Boolean(off);
    html.classList.toggle('motion-off', motionOff);
    // .motion-on lets an explicit user choice win over the OS reduce-motion
    // media query (see styles.css reduced-motion block).
    html.classList.toggle('motion-on', !motionOff);
    if (motionToggle) motionToggle.setAttribute('aria-checked', String(motionOff));
    if (persist) storeMotion(motionOff ? '1' : '0');
    if (!sync) return;
    if (motionOff) finishCounters();
    else {
      syncReveals();
      syncCounters();
    }
  }

  if (motionToggle) {
    const stored = readStoredMotion();
    const initialOff = stored === null ? reduceMQ.matches : stored === '1';
    setMotionOff(initialOff, { persist: false, sync: false });
    motionToggle.addEventListener('click', () => setMotionOff(!motionOff));
  } else {
    setMotionOff(reduceMQ.matches, { persist: false, sync: false });
  }
  if (reduceMQ.addEventListener) {
    reduceMQ.addEventListener('change', (event) => {
      if (readStoredMotion() === null) setMotionOff(event.matches, { persist: false });
    });
  }

  /* ------------------------------- intro --------------------------------- */
  function playIntro() {
    html.classList.remove('is-ready');
    // Force a style flush so the masked hero re-arms before replaying.
    void html.offsetWidth;
    requestAnimationFrame(() => {
      requestAnimationFrame(() => html.classList.add('is-ready'));
    });
  }

  requestAnimationFrame(() => {
    requestAnimationFrame(() => html.classList.add('is-ready'));
  });

  const monogram = document.querySelector('.monogram');
  if (monogram) {
    monogram.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: motionOff ? 'auto' : 'smooth' });
      if (motionOff) {
        toast('Motion is reduced. Turn it on in the footer to replay.');
        return;
      }
      playIntro();
    });
  }

  /* ---------------------------- scroll reveals --------------------------- */
  // Elements re-hide after leaving the viewport, so every scroll re-plays them.
  // Note: clip-path("mask") elements are driven by scroll geometry instead of
  // IntersectionObserver — Chromium reports a fully clipped target as
  // non-intersecting, which would leave them hidden forever.
  const allRevealEls = Array.from(document.querySelectorAll('[data-reveal]'));
  const maskEls = allRevealEls.filter((el) => el.getAttribute('data-reveal') === 'mask');
  const revealEls = allRevealEls.filter((el) => el.getAttribute('data-reveal') !== 'mask');
  const supportsIO = typeof window.IntersectionObserver === 'function';

  let revealIO = null;
  if (supportsIO) {
    revealIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.classList.toggle('is-in', entry.isIntersecting);
      });
    }, { rootMargin: '-8% 0px 0px 0px', threshold: 0 });
    revealEls.forEach((el) => revealIO.observe(el));
  } else {
    // Very old browser: show everything rather than leaving the page blank.
    allRevealEls.forEach((el) => el.classList.add('is-in'));
  }

  function inViewport(el, margin = 0) {
    const rect = el.getBoundingClientRect();
    return rect.top < window.innerHeight - margin && rect.bottom > margin;
  }

  function syncMaskReveals() {
    maskEls.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const visible = rect.top < window.innerHeight - 8 && rect.bottom > window.innerHeight * 0.06;
      el.classList.toggle('is-in', visible);
    });
  }

  function syncReveals() {
    syncMaskReveals();
    if (motionOff) return;
    revealEls.forEach((el) => {
      if (!el.classList.contains('is-in') && inViewport(el, 40)) {
        el.classList.add('is-in');
      }
    });
  }

  syncMaskReveals();

  /* ------------------------------ counters ------------------------------- */
  const counterEls = Array.from(document.querySelectorAll('[data-count]'));

  function formatCount(el, value) {
    const decimals = Number(el.dataset.decimals || 0);
    const suffix = el.dataset.suffix || '';
    const number = decimals > 0 ? value.toFixed(decimals) : String(Math.round(value));
    return number + suffix;
  }

  const finalText = new WeakMap();
  counterEls.forEach((el) => {
    finalText.set(el, el.textContent.trim());
    if (!motionOff && supportsIO) el.textContent = formatCount(el, 0);
  });

  function animateCount(el) {
    if (motionOff) return;
    window.cancelAnimationFrame(el._countRaf);
    const target = Number(el.dataset.count);
    if (!Number.isFinite(target)) return;
    const duration = 1500;
    const start = performance.now();

    const tick = (now) => {
      const progress = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      el.textContent = formatCount(el, target * eased);
      if (progress < 1) el._countRaf = requestAnimationFrame(tick);
    };
    el._countRaf = requestAnimationFrame(tick);
  }

  function resetCount(el) {
    window.cancelAnimationFrame(el._countRaf);
    if (!motionOff) el.textContent = formatCount(el, 0);
  }

  function finishCounters() {
    counterEls.forEach((el) => {
      window.cancelAnimationFrame(el._countRaf);
      el.textContent = finalText.get(el) || el.textContent;
    });
  }

  let counterIO = null;
  if (supportsIO) {
    counterIO = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (motionOff) return;
        if (entry.isIntersecting) animateCount(entry.target);
        else resetCount(entry.target);
      });
    }, { threshold: 0.55 });
    counterEls.forEach((el) => counterIO.observe(el));
  }

  function syncCounters() {
    if (motionOff || !supportsIO) {
      finishCounters();
      return;
    }
    counterEls.forEach((el) => {
      if (inViewport(el, 60)) animateCount(el);
      else resetCount(el);
    });
  }

  /* ----------------------- header / progress / nav ----------------------- */
  const header = document.querySelector('.site-header');
  const progressBar = document.querySelector('[data-progress]');
  const nav = document.querySelector('.nav');
  const navIndicator = document.querySelector('[data-nav-indicator]');
  const navLinks = Array.from(document.querySelectorAll('.nav__link'));
  const sections = ['projects', 'achievements', 'skills', 'contact']
    .map((id) => document.getElementById(id))
    .filter(Boolean);

  let currentSection = '';

  function updateNavIndicator() {
    if (!nav || !navIndicator) return;
    const active = navLinks.find((link) => link.hash === '#' + currentSection);
    if (!active) {
      navIndicator.style.opacity = '0';
      return;
    }
    navIndicator.style.width = active.offsetWidth + 'px';
    navIndicator.style.transform = 'translateX(' + active.offsetLeft + 'px)';
    navIndicator.style.opacity = '1';
  }

  function updateNav() {
    const anchorLine = window.innerHeight * 0.4;
    const atBottom = window.scrollY + window.innerHeight >= document.documentElement.scrollHeight - 2;
    let active = '';
    if (atBottom) {
      active = 'contact';
    } else {
      for (const section of sections) {
        if (section.getBoundingClientRect().top <= anchorLine) active = section.id;
      }
    }
    if (active !== currentSection) {
      currentSection = active;
      navLinks.forEach((link) => {
        const isActive = link.hash === '#' + active;
        link.classList.toggle('is-active', isActive);
        if (isActive) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
      updateNavIndicator();
    }
  }

  let scrollQueued = false;
  function onScroll() {
    if (scrollQueued) return;
    scrollQueued = true;
    requestAnimationFrame(() => {
      const y = window.scrollY;
      if (header) header.classList.toggle('is-stuck', y > 6);
      if (progressBar) {
        const max = document.documentElement.scrollHeight - window.innerHeight;
        const ratio = max > 0 ? Math.min(y / max, 1) : 0;
        progressBar.style.transform = 'scaleX(' + ratio + ')';
      }
      updateNav();
      syncMaskReveals();
      scrollQueued = false;
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('resize', () => {
    onScroll();
    syncMaskReveals();
    updateNavIndicator();
    if (window.innerWidth > 900) closeMenu();
  }, { passive: true });
  onScroll();
  updateNavIndicator();
  if (document.fonts && document.fonts.ready) {
    document.fonts.ready.then(() => {
      updateNavIndicator();
      syncMaskReveals();
    }).catch(() => {});
  }

  /* ------------------------------ mobile menu ---------------------------- */
  const menu = document.getElementById('mobile-menu');
  const menuToggle = document.querySelector('.menu-toggle');
  const menuClose = menu ? menu.querySelector('.mobile-menu__close') : null;
  const inertTargets = [
    document.querySelector('.site-header'),
    document.querySelector('main'),
    document.querySelector('.site-footer'),
  ].filter(Boolean);
  let menuTimer = 0;
  let lastFocused = null;

  function openMenu() {
    if (!menu || !menuToggle) return;
    window.clearTimeout(menuTimer);
    lastFocused = document.activeElement;
    menu.hidden = false;
    document.body.classList.add('menu-open');
    menuToggle.setAttribute('aria-expanded', 'true');
    inertTargets.forEach((el) => el.setAttribute('inert', ''));
    requestAnimationFrame(() => menu.classList.add('is-open'));
    if (menuClose) menuClose.focus({ preventScroll: true });
  }

  function closeMenu(restoreFocus = false) {
    if (!menu || !menuToggle) return;
    menu.classList.remove('is-open');
    menuToggle.setAttribute('aria-expanded', 'false');
    document.body.classList.remove('menu-open');
    inertTargets.forEach((el) => el.removeAttribute('inert'));
    menuTimer = window.setTimeout(() => {
      menu.hidden = true;
      // Move focus only after the sheet is hidden; focusing earlier lets the
      // browser hand focus back to <body> when the focused link disappears.
      if (restoreFocus && menuToggle) menuToggle.focus({ preventScroll: true });
    }, 380);
  }

  if (menuToggle) menuToggle.addEventListener('click', openMenu);
  if (menuClose) menuClose.addEventListener('click', () => closeMenu(true));
  if (menu) {
    menu.querySelectorAll('a[href^="#"]').forEach((link) => {
      link.addEventListener('click', () => closeMenu(true));
    });
    menu.addEventListener('keydown', (event) => {
      if (event.key !== 'Tab') return;
      const focusables = Array.from(menu.querySelectorAll('a[href], button:not([disabled])'));
      if (!focusables.length) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    });
  }
  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && menu && menu.classList.contains('is-open')) {
      closeMenu(true);
    }
  });

  /* ------------------------- demo-link placeholders ---------------------- */
  document.querySelectorAll('[data-demo]').forEach((link) => {
    link.addEventListener('click', (event) => {
      const href = link.getAttribute('href') || '';
      if (href !== '#' && href !== '') return; // a real URL was added — let it through
      event.preventDefault();
      toast(link.dataset.demo + ' demo clip is a placeholder — add its URL in index.html.');
    });
  });

  /* ------------------- new-tab announcements for AT ---------------------- */
  document.querySelectorAll('a[target="_blank"]').forEach((link) => {
    if (link.querySelector('.sr-only')) return;
    const hint = document.createElement('span');
    hint.className = 'sr-only';
    hint.textContent = ' (opens in new tab)';
    link.appendChild(hint);
  });

  /* ------------------------------ hero spotlight ------------------------- */
  const hero = document.querySelector('[data-hero]');
  if (hero) {
    let heroFrame = 0;
    hero.addEventListener('pointermove', (event) => {
      if (motionOff || !fineMQ.matches) return;
      if (heroFrame) return;
      heroFrame = requestAnimationFrame(() => {
        const rect = hero.getBoundingClientRect();
        hero.style.setProperty('--hx', (event.clientX - rect.left) + 'px');
        hero.style.setProperty('--hy', (event.clientY - rect.top) + 'px');
        hero.classList.add('is-pointer');
        heroFrame = 0;
      });
    }, { passive: true });
    hero.addEventListener('pointerleave', () => {
      hero.classList.remove('is-pointer');
    });
  }

  /* ------------------------------- card tilt ----------------------------- */
  const tiltCards = Array.from(document.querySelectorAll('[data-tilt]')).slice(0, 6);

  tiltCards.forEach((card) => {
    let frame = 0;

    card.addEventListener('pointerenter', (event) => {
      if (motionOff || !fineMQ.matches || event.pointerType === 'touch') return;
      card.classList.add('is-tilting');
    });

    card.addEventListener('pointermove', (event) => {
      if (motionOff || !fineMQ.matches || event.pointerType === 'touch') return;
      if (frame) return;
      frame = requestAnimationFrame(() => {
        const rect = card.getBoundingClientRect();
        const px = (event.clientX - rect.left) / rect.width;
        const py = (event.clientY - rect.top) / rect.height;
        card.style.setProperty('--rx', ((py - 0.5) * -4).toFixed(2) + 'deg');
        card.style.setProperty('--ry', ((px - 0.5) * 5).toFixed(2) + 'deg');
        card.style.setProperty('--mx', (event.clientX - rect.left) + 'px');
        card.style.setProperty('--my', (event.clientY - rect.top) + 'px');
        card.classList.add('is-tilting');
        frame = 0;
      });
    }, { passive: true });

    card.addEventListener('pointerleave', () => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      card.classList.remove('is-tilting');
      card.style.setProperty('--rx', '0deg');
      card.style.setProperty('--ry', '0deg');
    });
  });

  /* --------------------------- image fallbacks --------------------------- */
  function markMissing(img) {
    const figure = img.closest('.shot');
    if (!figure) return;
    figure.classList.add('is-missing');
    const caption = figure.querySelector('.shot__fallback');
    if (caption) caption.hidden = false;
  }

  document.querySelectorAll('img[data-shot]').forEach((img) => {
    img.addEventListener('error', () => markMissing(img));
    if (img.complete && img.naturalWidth === 0) markMissing(img);
  });

  /* --------------------------------- misc -------------------------------- */
  const yearEl = document.querySelector('[data-year]');
  if (yearEl) yearEl.textContent = String(new Date().getFullYear());

  // Keep the nav indicator honest if the page grows/shrinks (font swap, fonts, etc.).
  window.addEventListener('load', () => {
    updateNavIndicator();
    syncMaskReveals();
    onScroll();
  });

  if ('ResizeObserver' in window && nav) {
    new ResizeObserver(() => updateNavIndicator()).observe(nav);
  }

  // Everything initialised — the inline head fallback is no longer needed.
  if (window.__revealFallback) {
    window.clearTimeout(window.__revealFallback);
    window.__revealFallback = 0;
  }
})();

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

const REDUCED = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const g = window as unknown as { __nor?: { lenis?: Lenis; cursor?: boolean } };
g.__nor = g.__nor || {};

/* ------------------------------------------------------------------ Lenis */
function initLenis() {
  if (g.__nor!.lenis || REDUCED) return;
  const lenis = new Lenis({ duration: 1.1, smoothWheel: true });
  g.__nor!.lenis = lenis;
  lenis.on('scroll', ScrollTrigger.update);
  // Drive Lenis with its own rAF loop (reliable for animated scrollTo).
  const raf = (time: number) => {
    lenis.raf(time);
    requestAnimationFrame(raf);
  };
  requestAnimationFrame(raf);
}

/* ----------------------------------------------------------------- Cursor */
function initCursor() {
  const cursor = document.querySelector<HTMLElement>('[data-cursor]');
  if (!cursor || !window.matchMedia('(hover: hover) and (pointer: fine)').matches || REDUCED) return;
  const label = cursor.querySelector<HTMLElement>('[data-cursor-label]');

  if (!g.__nor!.cursor) {
    g.__nor!.cursor = true;
    let x = window.innerWidth / 2, y = window.innerHeight / 2, cx = x, cy = y;
    window.addEventListener('mousemove', (e) => { x = e.clientX; y = e.clientY; });
    const render = () => {
      cx += (x - cx) * 0.18; cy += (y - cy) * 0.18;
      cursor.style.transform = `translate3d(${cx}px, ${cy}px, 0)`;
      requestAnimationFrame(render);
    };
    render();
  }

  document.querySelectorAll<HTMLElement>('[data-cursor-hint], a, button').forEach((el) => {
    const hint = el.closest('[data-slide-media], [data-lightbox]') ? 'VIEW' : null;
    el.addEventListener('mouseenter', () => {
      if (hint && label) { label.textContent = hint; cursor.setAttribute('data-hint', ''); }
    });
    el.addEventListener('mouseleave', () => cursor.removeAttribute('data-hint'));
  });
}

/* ----------------------------------------------------------------- Header */
function initHeader() {
  const header = document.querySelector<HTMLElement>('[data-header]');
  if (!header) return;
  const update = () => {
    if (window.scrollY > 40) header.setAttribute('data-scrolled', '');
    else header.removeAttribute('data-scrolled');
  };
  update();
  window.addEventListener('scroll', update, { passive: true });
}

/* ------------------------------------------------------------------- Menu */
function initMenu() {
  const menu = document.querySelector<HTMLElement>('[data-menu]');
  const openBtn = document.querySelector<HTMLElement>('[data-menu-open]');
  const closeBtn = document.querySelector<HTMLElement>('[data-menu-close]');
  if (!menu || !openBtn) return;
  const lenis = g.__nor!.lenis;
  const open = () => {
    menu.hidden = false;
    requestAnimationFrame(() => menu.setAttribute('data-open', ''));
    openBtn.setAttribute('aria-expanded', 'true');
    lenis?.stop();
  };
  const close = () => {
    menu.removeAttribute('data-open');
    openBtn.setAttribute('aria-expanded', 'false');
    lenis?.start();
    setTimeout(() => (menu.hidden = true), 450);
  };
  openBtn.addEventListener('click', open);
  closeBtn?.addEventListener('click', close);
  menu.querySelectorAll('[data-menu-link]').forEach((l) => l.addEventListener('click', close));
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape' && menu.hasAttribute('data-open')) close(); });
}

/* -------------------------------------------------------------------- Bag */
function readBag(): number { return parseInt(localStorage.getItem('nor-bag') || '0', 10) || 0; }
function paintBag() {
  const n = readBag();
  document.querySelectorAll('[data-bag-count]').forEach((el) => (el.textContent = String(n)));
}
function initBag() {
  paintBag();
  document.querySelectorAll<HTMLButtonElement>('[data-add-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      localStorage.setItem('nor-bag', String(readBag() + 1));
      paintBag();
      btn.setAttribute('data-added', '');
      const orig = btn.querySelector<HTMLElement>('[data-add-label]');
      if (orig) orig.textContent = getLang() === 'ru' ? 'ДОБАВЛЕНО' : 'ADDED TO BAG';
      setTimeout(() => {
        btn.removeAttribute('data-added');
        if (orig) orig.textContent = getLang() === 'ru'
          ? orig.dataset.ru || 'В КОРЗИНУ'
          : orig.dataset.en || 'ADD TO BAG';
      }, 1600);
    });
  });
}

/* ------------------------------------------------------------------- i18n */
type Lang = 'en' | 'ru';
const RUB_RATE = 94; // EUR -> RUB
function getLang(): Lang {
  try { return (localStorage.getItem('nor-lang') as Lang) || 'en'; } catch { return 'en'; }
}
function fmtPrice(eur: number, lang: Lang): string {
  if (lang === 'ru') return `${Math.round(eur * RUB_RATE).toLocaleString('ru-RU')} ₽`;
  return `€${eur}`;
}
function applyLang(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('data-lang', lang);
  document.querySelectorAll<HTMLElement>('[data-ru]').forEach((el) => {
    if (el.dataset.en === undefined) el.dataset.en = (el.textContent || '').trim();
    el.textContent = lang === 'ru' ? el.dataset.ru || '' : el.dataset.en || '';
  });
  document.querySelectorAll<HTMLElement>('[data-price]').forEach((el) => {
    el.textContent = fmtPrice(parseFloat(el.dataset.price || '0'), lang);
  });
  document.querySelectorAll('[data-lang-toggle]').forEach((b) =>
    b.setAttribute('aria-checked', lang === 'ru' ? 'true' : 'false'));
}
function initI18n() {
  applyLang(getLang());
  document.querySelectorAll<HTMLElement>('[data-lang-toggle]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const next: Lang = getLang() === 'ru' ? 'en' : 'ru';
      try { localStorage.setItem('nor-lang', next); } catch { /* ignore */ }
      applyLang(next);
    });
  });
}

/* ---------------------------------------------------------------- Anchors */
function initAnchors() {
  const lenis = g.__nor!.lenis;
  document.querySelectorAll<HTMLAnchorElement>('a[href*="#"]').forEach((a) => {
    const url = new URL(a.href, location.href);
    if (url.pathname !== location.pathname || !url.hash) return;
    a.addEventListener('click', (e) => {
      const target = document.querySelector(url.hash);
      if (!target) return;
      e.preventDefault();
      if (lenis) lenis.scrollTo(target as HTMLElement, { offset: -70, duration: 1.1 });
      else (target as HTMLElement).scrollIntoView({ behavior: REDUCED ? 'auto' : 'smooth' });
      history.replaceState(null, '', url.hash);
    });
  });
}

/* ------------------------------------------------------------------- Hero */
function initHero() {
  const hero = document.querySelector('[data-hero]');
  if (!hero) return;
  const img = hero.querySelector<HTMLElement>('[data-hero-img]');
  const cover = hero.querySelector<HTMLElement>('[data-hero-cover]');
  const els = hero.querySelectorAll('[data-hero-el]');
  const lines = hero.querySelectorAll('[data-hero-line]');

  if (REDUCED) {
    gsap.set([cover], { autoAlpha: 0 });
    gsap.set(img, { scale: 1 });
    return;
  }

  const tl = gsap.timeline({ defaults: { ease: 'power3.out' } });
  gsap.set(lines, { yPercent: 110 });
  gsap.set(els, { autoAlpha: 0, y: 20 });
  tl.to(cover, { scaleY: 0, duration: 1.1, ease: 'power4.inOut' }, 0.15)
    .to(img, { scale: 1, duration: 1.6, ease: 'power3.out' }, 0.15)
    .to(els[0], { autoAlpha: 1, y: 0, duration: 0.8 }, 0.7)
    .to(lines, { yPercent: 0, duration: 1, stagger: 0.12 }, 0.85)
    .to([els[1], els[2]], { autoAlpha: 1, y: 0, duration: 0.8, stagger: 0.12 }, 1.1);

  // scroll parallax on hero
  gsap.to(img, {
    scale: 1.08, xPercent: -3, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true },
  });
  gsap.to(hero.querySelector('.hero__content'), {
    autoAlpha: 0, y: -40, ease: 'none',
    scrollTrigger: { trigger: hero, start: 'top top', end: '60% top', scrub: true },
  });
}

/* ---------------------------------------------------------------- Reveals */
function initReveals() {
  if (REDUCED) return;
  gsap.utils.toArray<HTMLElement>('[data-reveal]').forEach((el) => {
    gsap.from(el, {
      yPercent: el.closest('.mask') ? 110 : 0,
      y: el.closest('.mask') ? 0 : 30,
      autoAlpha: el.closest('.mask') ? 1 : 0,
      duration: 1,
      ease: 'power3.out',
      scrollTrigger: { trigger: el.closest('.mask') || el, start: 'top 88%' },
    });
  });

  gsap.utils.toArray<HTMLElement>('[data-clip]').forEach((el) => {
    gsap.fromTo(el, { clipPath: 'inset(100% 0 0 0)' }, {
      clipPath: 'inset(0% 0 0 0)',
      duration: 1.3,
      ease: 'power4.inOut',
      scrollTrigger: { trigger: el, start: 'top 82%' },
    });
    const frame = el.querySelector<HTMLElement>('.frame, .frame__gen, img');
    if (frame) {
      gsap.fromTo(el.querySelector('.frame') || el, { yPercent: -8 }, {
        yPercent: 8, ease: 'none',
        scrollTrigger: { trigger: el, start: 'top bottom', end: 'bottom top', scrub: true },
      });
    }
  });
}

/* -------------------------------------------------------- Collection browser */
function initCollection() {
  const browser = document.querySelector<HTMLElement>('[data-browser]');
  if (!browser) return;
  const slides = [...browser.querySelectorAll<HTMLElement>('[data-slide]')];
  const total = slides.length;
  if (!total) return;
  // On mobile the collection becomes a stacked vertical editorial sequence
  // (no stepper) — leave the no-JS fallback layout in place.
  if (window.matchMedia('(max-width: 760px)').matches) return;
  browser.setAttribute('data-ready', '');
  let index = 0;
  let busy = false;

  const current = browser.querySelector<HTMLElement>('[data-count-current]');
  const fill = browser.querySelector<HTMLElement>('[data-count-fill]');
  const prev = browser.querySelector<HTMLElement>('[data-prev]');
  const next = browser.querySelector<HTMLElement>('[data-next]');

  slides.forEach((s, i) => s.toggleAttribute('data-active', i === 0));

  function go(dir: number) {
    if (busy) return;
    const nextIndex = (index + dir + total) % total;
    if (nextIndex === index) return;
    busy = true;
    const currentSlide = slides[index];
    const target = slides[nextIndex];
    const media = target.querySelector<HTMLElement>('.slide__media .frame');
    const info = target.querySelectorAll<HTMLElement>('.slide__info > *');

    currentSlide.removeAttribute('data-active');
    target.setAttribute('data-active', '');
    slides.forEach((s, i) => s.setAttribute('aria-hidden', String(i !== nextIndex)));

    if (!REDUCED) {
      gsap.fromTo(media, { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.8, ease: 'power3.inOut' });
      gsap.fromTo(info, { autoAlpha: 0, y: 24 },
        { autoAlpha: 1, y: 0, duration: 0.7, stagger: 0.06, ease: 'power3.out', delay: 0.15 });
    }
    // Release the lock on a fixed timer — robust regardless of tween callbacks.
    window.setTimeout(() => { busy = false; }, REDUCED ? 0 : 720);

    index = nextIndex;
    if (current) current.textContent = String(index + 1).padStart(2, '0');
    if (fill) fill.style.transform = `scaleX(${(index + 1) / total})`;
  }

  prev?.addEventListener('click', () => go(-1));
  next?.addEventListener('click', () => go(1));
  if (fill) fill.style.transform = `scaleX(${1 / total})`;

  // keyboard when in view
  browser.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft') go(-1);
    if (e.key === 'ArrowRight') go(1);
  });
  browser.tabIndex = 0;
}

/* ----------------------------------------------------------- Lookbook viewer */
function initLightbox() {
  const items = [...document.querySelectorAll<HTMLElement>('[data-lightbox]')];
  const lbx = document.querySelector<HTMLElement>('[data-lbx]');
  if (!items.length || !lbx) return;
  const frame = lbx.querySelector<HTMLElement>('[data-lbx-frame]');
  const nEl = lbx.querySelector<HTMLElement>('[data-lbx-n]');
  const titleEl = lbx.querySelector<HTMLElement>('[data-lbx-title]');
  const lenis = g.__nor!.lenis;
  let i = 0;

  const load = (idx: number, dir = 1) => {
    i = (idx + items.length) % items.length;
    const src = items[i].querySelector('.frame');
    if (frame && src) frame.innerHTML = src.outerHTML;
    if (nEl) nEl.textContent = String(i + 1).padStart(2, '0');
    const cap = items[i].querySelector('.lb__cap .muted');
    if (titleEl) titleEl.textContent = cap?.textContent || '';
    if (!REDUCED && frame) {
      gsap.fromTo(frame, { clipPath: dir > 0 ? 'inset(0 0 0 100%)' : 'inset(0 100% 0 0)' },
        { clipPath: 'inset(0 0 0 0%)', duration: 0.7, ease: 'power3.inOut' });
    }
  };
  const open = (idx: number) => {
    lbx.hidden = false;
    requestAnimationFrame(() => lbx.setAttribute('data-open', ''));
    load(idx);
    lenis?.stop();
  };
  const close = () => {
    lbx.removeAttribute('data-open');
    lenis?.start();
    setTimeout(() => (lbx.hidden = true), 400);
  };

  items.forEach((item, idx) => item.addEventListener('click', () => open(idx)));
  lbx.querySelector('[data-lbx-close]')?.addEventListener('click', close);
  lbx.querySelector('[data-lbx-prev]')?.addEventListener('click', () => load(i - 1, -1));
  lbx.querySelector('[data-lbx-next]')?.addEventListener('click', () => load(i + 1, 1));
  document.addEventListener('keydown', (e) => {
    if (!lbx.hasAttribute('data-open')) return;
    if (e.key === 'Escape') close();
    if (e.key === 'ArrowLeft') load(i - 1, -1);
    if (e.key === 'ArrowRight') load(i + 1, 1);
  });
}

/* ------------------------------------------------------- Product page gallery */
function initGallery() {
  const gallery = document.querySelector<HTMLElement>('[data-gallery]');
  if (!gallery) return;
  const main = gallery.querySelector<HTMLElement>('[data-gallery-main]');
  const thumbs = [...gallery.querySelectorAll<HTMLElement>('[data-thumb]')];
  const setActive = (idx: number) => {
    thumbs.forEach((t, i) => t.toggleAttribute('data-active', i === idx));
    const src = thumbs[idx].querySelector('.frame');
    if (main && src) {
      main.innerHTML = src.outerHTML;
      if (!REDUCED) gsap.fromTo(main, { clipPath: 'inset(0 0 100% 0)' },
        { clipPath: 'inset(0 0 0% 0)', duration: 0.7, ease: 'power3.inOut' });
    }
  };
  thumbs.forEach((t, i) => t.addEventListener('click', () => setActive(i)));
}

/* ------------------------------------------------------------------- Setup */
function setup() {
  // Guard against double-init (astro:page-load + readyState both firing on
  // first load). The <body> is replaced on view-transition navigation, so the
  // flag resets naturally for each new page.
  if (document.body.dataset.norReady) return;
  document.body.dataset.norReady = '1';

  ScrollTrigger.getAll().forEach((t) => t.kill());
  initI18n();
  initLenis();
  initHeader();
  initMenu();
  initCursor();
  initBag();
  initAnchors();
  initHero();
  initReveals();
  initCollection();
  initLightbox();
  initGallery();
  ScrollTrigger.refresh();
}

document.addEventListener('astro:page-load', setup);
if (document.readyState !== 'loading') setup();
else document.addEventListener('DOMContentLoaded', setup);

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

/* ------------------------------------------------------------- Size picker */
function initSizes() {
  document.querySelectorAll<HTMLElement>('[role="radiogroup"] [data-size]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const group = btn.closest('[role="radiogroup"]');
      group?.querySelectorAll('[data-size]').forEach((b) => {
        b.removeAttribute('data-active');
        b.setAttribute('aria-checked', 'false');
      });
      btn.setAttribute('data-active', '');
      btn.setAttribute('aria-checked', 'true');
    });
  });
}

/* ------------------------------------------------------------------- Cart */
interface CatalogItem {
  id: string; object: string; slug: string; name: string; nameRu: string;
  price: number; sizes: string[]; img: string | null; rec: string[];
}
interface CartLine { id: string; size: string; qty: number; }

let CATALOG: Record<string, CatalogItem> = {};
function loadCatalog() {
  if (Object.keys(CATALOG).length) return;
  const el = document.querySelector('[data-cart-catalog]');
  if (!el) return;
  try {
    const arr = JSON.parse(el.textContent || '[]') as CatalogItem[];
    CATALOG = Object.fromEntries(arr.map((c) => [c.id, c]));
  } catch { /* ignore */ }
}
function readCart(): CartLine[] {
  try { return JSON.parse(localStorage.getItem('nor-cart') || '[]') as CartLine[]; } catch { return []; }
}
function writeCart(lines: CartLine[]) {
  try { localStorage.setItem('nor-cart', JSON.stringify(lines)); } catch { /* ignore */ }
}
function cartCount(lines = readCart()): number { return lines.reduce((n, l) => n + l.qty, 0); }
function cartTotalEUR(lines = readCart()): number {
  return lines.reduce((s, l) => s + (CATALOG[l.id]?.price || 0) * l.qty, 0);
}
function defaultSize(id: string): string {
  const s = CATALOG[id]?.sizes || [];
  return s[Math.floor(s.length / 2)] || s[0] || '';
}
function mergeLines(lines: CartLine[]): CartLine[] {
  const out: CartLine[] = [];
  for (const l of lines) {
    const m = out.find((x) => x.id === l.id && x.size === l.size);
    if (m) m.qty += l.qty; else out.push({ ...l });
  }
  return out;
}
function addToCart(id: string, size?: string, qty = 1) {
  const lines = readCart();
  lines.push({ id, size: size || defaultSize(id), qty });
  writeCart(mergeLines(lines));
  renderCart();
}
function changeQty(idx: number, delta: number) {
  const lines = readCart();
  if (!lines[idx]) return;
  lines[idx].qty += delta;
  if (lines[idx].qty < 1) lines.splice(idx, 1);
  writeCart(lines);
  renderCart();
}
function changeSize(idx: number, size: string) {
  const lines = readCart();
  if (!lines[idx]) return;
  lines[idx].size = size;
  writeCart(mergeLines(lines));
  renderCart();
}
function removeLine(idx: number) {
  const lines = readCart();
  lines.splice(idx, 1);
  writeCart(lines);
  renderCart();
}
function pName(c: CatalogItem, lang: Lang) { return lang === 'ru' ? c.nameRu : c.name; }

function renderCart() {
  loadCatalog();
  const lang = getLang();
  const lines = readCart();

  const n = cartCount(lines);
  document.querySelectorAll('[data-bag-count]').forEach((el) => (el.textContent = String(n)));
  const totalTxt = fmtPrice(cartTotalEUR(lines), lang);
  document.querySelectorAll('[data-cart-total]').forEach((el) => (el.textContent = totalTxt));

  const empty = document.querySelector<HTMLElement>('[data-cart-empty]');
  if (empty) empty.hidden = lines.length > 0;
  const checkoutBtn = document.querySelector<HTMLButtonElement>('[data-cart-to-checkout]');
  if (checkoutBtn) checkoutBtn.disabled = lines.length === 0;

  const list = document.querySelector<HTMLElement>('[data-cart-items]');
  if (list) {
    list.innerHTML = lines.map((l, i) => {
      const c = CATALOG[l.id];
      if (!c) return '';
      const thumb = c.img
        ? `<span class="cart__thumb"><img src="${c.img}" alt=""></span>`
        : '<span class="cart__thumb"><span class="cart__thumb-ph"></span></span>';
      const opts = c.sizes.map((s) =>
        `<option value="${s}"${s === l.size ? ' selected' : ''}>${s}</option>`).join('');
      return `<li class="cart__item">
        ${thumb}
        <div class="cart__it-main">
          <span class="cart__it-name">${pName(c, lang)}</span>
          <div class="cart__it-row">
            <select class="cart__size" data-cart-size="${i}" aria-label="Size">${opts}</select>
            <span class="cart__qty">
              <button type="button" data-cart-dec="${i}" aria-label="minus">−</button>
              <span>${l.qty}</span>
              <button type="button" data-cart-inc="${i}" aria-label="plus">+</button>
            </span>
          </div>
        </div>
        <div class="cart__it-end">
          <span class="cart__it-price">${fmtPrice(c.price * l.qty, lang)}</span>
          <button type="button" class="cart__rm" data-cart-rm="${i}" data-ru="УДАЛИТЬ">REMOVE</button>
        </div>
      </li>`;
    }).join('');
  }

  const recWrap = document.querySelector<HTMLElement>('[data-cart-recs]');
  const recList = document.querySelector<HTMLElement>('[data-cart-recs-list]');
  if (recWrap && recList) {
    const inCart = new Set(lines.map((l) => l.id));
    const recIds: string[] = [];
    for (const l of lines) {
      for (const r of CATALOG[l.id]?.rec || []) {
        if (!inCart.has(r) && !recIds.includes(r)) recIds.push(r);
      }
    }
    const top = recIds.slice(0, 3);
    recWrap.hidden = top.length === 0;
    recList.innerHTML = top.map((id) => {
      const c = CATALOG[id];
      if (!c) return '';
      const thumb = c.img
        ? `<span class="cart__rec-thumb"><img src="${c.img}" alt=""></span>`
        : '<span class="cart__rec-thumb"><span class="cart__rec-thumb-ph"></span></span>';
      return `<li class="cart__rec">
        ${thumb}
        <div class="cart__rec-main">
          <span class="cart__rec-name">${pName(c, lang)}</span>
          <span class="cart__rec-price">${fmtPrice(c.price, lang)}</span>
        </div>
        <button type="button" class="cart__rec-add" data-cart-recadd="${id}" data-ru="ДОБАВИТЬ">ADD</button>
      </li>`;
    }).join('');
  }

  // localize freshly built rows (no event dispatch — avoids render loop)
  const cartEl = document.querySelector<HTMLElement>('[data-cart]');
  if (cartEl) localize(cartEl, lang);
}

function initCart() {
  loadCatalog();
  const cart = document.querySelector<HTMLElement>('[data-cart]');
  if (!cart) return;
  const lenis = g.__nor!.lenis;
  const views = [...cart.querySelectorAll<HTMLElement>('[data-cart-view]')];
  const showView = (name: string) =>
    views.forEach((v) => (v.hidden = v.getAttribute('data-cart-view') !== name));

  const open = () => {
    renderCart();
    showView('bag');
    cart.hidden = false;
    requestAnimationFrame(() => cart.setAttribute('data-open', ''));
    lenis?.stop();
  };
  const close = () => {
    cart.removeAttribute('data-open');
    lenis?.start();
    setTimeout(() => { cart.hidden = true; showView('bag'); }, 500);
  };

  document.querySelectorAll('[data-cart-open]').forEach((b) => b.addEventListener('click', open));
  cart.querySelectorAll('[data-cart-close]').forEach((b) => b.addEventListener('click', close));
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && cart.hasAttribute('data-open')) close();
  });

  cart.addEventListener('click', (e) => {
    const t = e.target as HTMLElement;
    const inc = t.closest<HTMLElement>('[data-cart-inc]');
    const dec = t.closest<HTMLElement>('[data-cart-dec]');
    const rm = t.closest<HTMLElement>('[data-cart-rm]');
    const recadd = t.closest<HTMLElement>('[data-cart-recadd]');
    if (inc) changeQty(Number(inc.dataset.cartInc), 1);
    else if (dec) changeQty(Number(dec.dataset.cartDec), -1);
    else if (rm) removeLine(Number(rm.dataset.cartRm));
    else if (recadd) addToCart(recadd.dataset.cartRecadd!);
  });
  cart.addEventListener('change', (e) => {
    const sel = (e.target as HTMLElement).closest<HTMLSelectElement>('[data-cart-size]');
    if (sel) changeSize(Number(sel.dataset.cartSize), sel.value);
  });

  cart.querySelector('[data-cart-to-checkout]')?.addEventListener('click', () => {
    if (readCart().length) showView('checkout');
  });
  cart.querySelector('[data-cart-to-bag]')?.addEventListener('click', () => showView('bag'));

  const form = cart.querySelector<HTMLFormElement>('form[data-cart-view="checkout"]');
  form?.addEventListener('submit', (e) => {
    e.preventDefault();
    let ok = true;
    form.querySelectorAll<HTMLElement>('.cart__field').forEach((f) => {
      const inp = f.querySelector<HTMLInputElement>('[data-cart-field]');
      const bad = !inp || !inp.value.trim();
      f.toggleAttribute('data-invalid', bad);
      if (bad) ok = false;
    });
    const consent = form.querySelector<HTMLInputElement>('[data-cart-consent]');
    const consentBad = !consent?.checked;
    consent?.closest<HTMLElement>('.cart__consent')?.toggleAttribute('data-invalid', consentBad);
    if (consentBad) ok = false;
    if (!ok) return;
    writeCart([]);
    renderCart();
    showView('done');
    form.reset();
    form.querySelectorAll('[data-invalid]').forEach((el) => el.removeAttribute('data-invalid'));
  });

  // add-to-bag from product pages
  document.querySelectorAll<HTMLButtonElement>('[data-add-bag]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.productId;
      if (!id) return;
      const sizeBtn = document.querySelector<HTMLElement>('[data-size][data-active]');
      addToCart(id, sizeBtn?.textContent?.trim() || undefined);
      const orig = btn.querySelector<HTMLElement>('[data-add-label]');
      btn.setAttribute('data-added', '');
      if (orig) orig.textContent = getLang() === 'ru' ? 'ДОБАВЛЕНО' : 'ADDED';
      setTimeout(() => {
        btn.removeAttribute('data-added');
        if (orig) orig.textContent = getLang() === 'ru'
          ? orig.dataset.ru || 'В КОРЗИНУ'
          : orig.dataset.en || 'ADD TO BAG';
      }, 1400);
      open();
    });
  });

  document.addEventListener('nor:lang', () => renderCart());
  renderCart();
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
function localize(root: ParentNode, lang: Lang) {
  root.querySelectorAll<HTMLElement>('[data-ru]').forEach((el) => {
    if (el.dataset.en === undefined) el.dataset.en = (el.textContent || '').trim();
    el.textContent = lang === 'ru' ? el.dataset.ru || '' : el.dataset.en || '';
  });
  root.querySelectorAll<HTMLElement>('[data-price]').forEach((el) => {
    el.textContent = fmtPrice(parseFloat(el.dataset.price || '0'), lang);
  });
}
function applyLang(lang: Lang) {
  const root = document.documentElement;
  root.setAttribute('lang', lang);
  root.setAttribute('data-lang', lang);
  localize(document, lang);
  document.querySelectorAll('[data-lang-toggle]').forEach((b) =>
    b.setAttribute('aria-checked', lang === 'ru' ? 'true' : 'false'));
  document.dispatchEvent(new CustomEvent('nor:lang', { detail: lang }));
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
  initSizes();
  initCart();
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

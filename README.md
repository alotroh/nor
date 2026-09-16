# NØR — Autumn / Winter 2026

A digital fashion campaign for a fictional contemporary menswear brand, **NØR**.
Built as a portfolio piece to demonstrate editorial art direction, motion, and
front-end engineering — not a template.

> Brand and products are fictional. Photography placeholders are procedurally
> art-directed until real imagery is supplied.

## Stack

- **Astro 4** + **TypeScript** (static, island-free, fast)
- **GSAP** + **ScrollTrigger** — reveals, hero sequence, collection transitions
- **Lenis** — smooth scrolling
- Hand-authored CSS design system (tokens in `src/styles/global.css`)
- View Transitions for client-side page navigation

## Run

```bash
npm install
npm run dev      # http://localhost:4321
npm run build    # static output → dist/
npm run preview
```

## Structure

```
src/
  data/products.ts        # centralized product + lookbook data (single source of truth)
  layouts/BaseLayout.astro # <head>, SEO/OG, fonts, view transitions
  components/
    Header, Hero, Introduction, SectionLabel, CollectionBrowser,
    Editorial, Materials, Lookbook, BrandStory, FinalCTA, Footer,
    Frame, ProductGallery, ProductInfo, Cursor
  pages/
    index.astro
    objects/[slug].astro  # product detail pages generated from data
  scripts/main.ts         # all interaction logic (re-inits on astro:page-load)
public/
  img/hero.png            # campaign photograph (hero + editorial)
  favicon.svg
```

## Adding real photography

Every image flows through `src/components/Frame.astro`. Supply a `src` (local
path under `public/`) on any image in `src/data/products.ts` and it replaces the
procedural placeholder automatically — no layout changes needed.

```ts
images: [
  { src: '/img/object-001-1.jpg', alt: '…', crop: 'full', tone: 1 },
]
```

## Notes

- Fully responsive with dedicated mobile compositions (hero vertical crop,
  stacked collection sequence, fullscreen menu).
- Respects `prefers-reduced-motion` (complex motion disabled, content always
  visible).
- Bag state is front-end only (localStorage); no backend/payment.
- Accessible: semantic HTML, alt text, keyboard nav, visible focus, skip link.

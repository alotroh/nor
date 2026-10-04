// -----------------------------------------------------------------------------
// NØR — AUTUMN / WINTER 2026
// Centralized product data. Real photography drops into `images` (local asset
// paths under /public). Until then each image renders as an art-directed
// procedural frame keyed by `tone` + `crop` (see components/Frame.astro).
// -----------------------------------------------------------------------------

export type ImageCrop = 'full' | 'portrait' | 'detail' | 'macro' | 'profile' | 'environment';

export interface ProductImage {
  /** Local asset path once real photography exists, e.g. '/img/object-001-1.jpg' */
  src?: string;
  /** Descriptive alt text — always required for accessibility. */
  alt: string;
  /** Composition used to art-direct the procedural placeholder. */
  crop: ImageCrop;
  /** Concrete/charcoal tone 0–5 for grading consistency. */
  tone: number;
}

export interface Product {
  id: string;              // '001'
  slug: string;            // 'structured-wool-coat'
  object: string;          // 'OBJECT 001'
  name: string;            // 'STRUCTURED WOOL COAT'
  price: number;           // 420
  category: string;        // 'OUTERWEAR'
  color: string;           // 'BLACK'
  sizes: string[];
  description: string;
  details: string[];
  images: ProductImage[];
}

export const collectionMeta = {
  brand: 'NØR',
  season: 'AUTUMN / WINTER 2026',
  seasonShort: 'AW26',
  collection: 'COLLECTION 01',
} as const;

export const products: Product[] = [
  {
    id: '001',
    slug: 'structured-wool-coat',
    object: 'OBJECT 001',
    name: 'STRUCTURED WOOL COAT',
    price: 420,
    category: 'OUTERWEAR',
    color: 'BLACK',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Heavyweight wool construction with an oversized architectural silhouette. Dropped shoulder, extended length, weighted drape.',
    details: ['100% WOOL', '480 GSM', 'OVERSIZED FIT', 'CONCEALED PLACKET'],
    images: [
      { src: '/img/object-001-1.jpg', alt: 'Structured wool coat, full-length front view against concrete', crop: 'full', tone: 1 },
      { alt: 'Structured wool coat collar and shoulder construction detail', crop: 'detail', tone: 2 },
      { alt: 'Wool surface texture, macro study', crop: 'macro', tone: 0 },
      { alt: 'Structured wool coat, side profile silhouette', crop: 'profile', tone: 1 },
    ],
  },
  {
    id: '002',
    slug: 'heavyweight-hoodie',
    object: 'OBJECT 002',
    name: 'HEAVYWEIGHT HOODIE',
    price: 180,
    category: 'KNITWEAR',
    color: 'CHARCOAL',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Dense loopback cotton with a boxed volume through the body. Structured hood, ribbed hem, matte hardware.',
    details: ['100% COTTON', '520 GSM', 'BOXED FIT', 'LOOPBACK INTERIOR'],
    images: [
      { src: '/img/object-002-1.jpg', alt: 'Heavyweight hoodie worn, three-quarter studio view', crop: 'full', tone: 2 },
      { alt: 'Hood construction and drawcord detail', crop: 'detail', tone: 3 },
      { alt: 'Loopback cotton texture, macro study', crop: 'macro', tone: 1 },
      { alt: 'Heavyweight hoodie, back silhouette', crop: 'profile', tone: 2 },
    ],
  },
  {
    id: '003',
    slug: 'wide-cargo-trouser',
    object: 'OBJECT 003',
    name: 'WIDE CARGO TROUSER',
    price: 220,
    category: 'TROUSERS',
    color: 'BLACK',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Wide, weighted leg with an elongated line. Tonal utility pocket, pleated front, clean interior finish.',
    details: ['COTTON / NYLON', 'WIDE LEG', 'UTILITY POCKET', 'PLEATED FRONT'],
    images: [
      { src: '/img/object-003-1.jpg', alt: 'Wide cargo trouser, full-length front view', crop: 'full', tone: 1 },
      { alt: 'Cargo pocket and seam construction detail', crop: 'detail', tone: 2 },
      { alt: 'Technical cotton weave, macro study', crop: 'macro', tone: 0 },
      { alt: 'Wide cargo trouser, environmental shot against architecture', crop: 'environment', tone: 3 },
    ],
  },
  {
    id: '004',
    slug: 'technical-shell-jacket',
    object: 'OBJECT 004',
    name: 'TECHNICAL SHELL JACKET',
    price: 340,
    category: 'OUTERWEAR',
    color: 'BLACK',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Weather-resistant shell with a sealed construction. Articulated sleeve, storm placket, matte membrane surface.',
    details: ['TECHNICAL SHELL', 'SEALED SEAMS', 'ARTICULATED SLEEVE', 'STORM PLACKET'],
    images: [
      { alt: 'Technical shell jacket, full front view', crop: 'full', tone: 2 },
      { alt: 'Storm placket and zipper detail', crop: 'detail', tone: 1 },
      { alt: 'Technical membrane surface, macro study', crop: 'macro', tone: 1 },
      { alt: 'Technical shell jacket, side profile in motion', crop: 'profile', tone: 2 },
    ],
  },
  {
    id: '005',
    slug: 'structured-knit',
    object: 'OBJECT 005',
    name: 'STRUCTURED KNIT',
    price: 260,
    category: 'KNITWEAR',
    color: 'BONE',
    sizes: ['XS', 'S', 'M', 'L', 'XL'],
    description:
      'Heavy-gauge knit with a sculptural stand collar. Rounded volume, tonal ribbing, dense hand-feel.',
    details: ['WOOL / ALPACA', 'HEAVY GAUGE', 'STAND COLLAR', 'STRUCTURED FORM'],
    images: [
      { alt: 'Structured knit, three-quarter studio view', crop: 'full', tone: 4 },
      { alt: 'Stand collar and rib construction detail', crop: 'detail', tone: 3 },
      { alt: 'Heavy-gauge knit texture, macro study', crop: 'macro', tone: 4 },
      { alt: 'Structured knit, profile silhouette', crop: 'profile', tone: 4 },
    ],
  },
  {
    id: '006',
    slug: 'leather-boot',
    object: 'OBJECT 006',
    name: 'LEATHER BOOT',
    price: 390,
    category: 'FOOTWEAR',
    color: 'BLACK',
    sizes: ['40', '41', '42', '43', '44', '45'],
    description:
      'Full-grain leather boot on a weighted sole. Structured toe, tonal welt, minimal hardware.',
    details: ['FULL-GRAIN LEATHER', 'WEIGHTED SOLE', 'STRUCTURED TOE', 'TONAL WELT'],
    images: [
      { alt: 'Leather boot, side profile studio view', crop: 'profile', tone: 0 },
      { alt: 'Boot welt and sole construction detail', crop: 'detail', tone: 1 },
      { alt: 'Full-grain leather surface, macro study', crop: 'macro', tone: 0 },
      { alt: 'Leather boot pair, environmental shot', crop: 'environment', tone: 2 },
    ],
  },
];

export function getProduct(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

// Lookbook — 12 looks referencing the collection, with editorial crop rhythm.
export interface Look {
  n: string;            // '01'
  title: string;
  crop: ImageCrop;
  tone: number;
  src?: string;
  alt: string;
}

export const lookbook: Look[] = [
  { n: '01', title: 'COAT / TROUSER', crop: 'full', tone: 1, alt: 'Look 01 — wool coat over wide trouser' },
  { n: '02', title: 'SHELL / KNIT', crop: 'portrait', tone: 2, alt: 'Look 02 — technical shell over structured knit' },
  { n: '03', title: 'FULL BLACK', crop: 'environment', tone: 0, alt: 'Look 03 — full black outfit against architecture' },
  { n: '04', title: 'KNIT / BOOT', crop: 'detail', tone: 4, alt: 'Look 04 — structured knit and leather boot' },
  { n: '05', title: 'HOODIE / CARGO', crop: 'full', tone: 2, alt: 'Look 05 — heavyweight hoodie with wide cargo' },
  { n: '06', title: 'OUTER STUDY', crop: 'profile', tone: 1, alt: 'Look 06 — outerwear profile study' },
  { n: '07', title: 'MATERIAL', crop: 'macro', tone: 3, alt: 'Look 07 — material macro study' },
  { n: '08', title: 'SHELL / MOTION', crop: 'environment', tone: 2, alt: 'Look 08 — technical shell in motion' },
  { n: '09', title: 'BONE KNIT', crop: 'portrait', tone: 4, alt: 'Look 09 — bone structured knit portrait' },
  { n: '10', title: 'COAT / DETAIL', crop: 'detail', tone: 1, alt: 'Look 10 — wool coat construction detail' },
  { n: '11', title: 'BOOT / GROUND', crop: 'macro', tone: 0, alt: 'Look 11 — leather boot on concrete' },
  { n: '12', title: 'THE UNIFORM', crop: 'full', tone: 1, alt: 'Look 12 — complete AW26 uniform' },
];

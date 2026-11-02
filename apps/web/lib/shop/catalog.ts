/**
 * The demo store's seeded catalogue, served by /api/shop/products. Brands are fictional and prices are
 * in rupees; a retailer would serve its own catalogue in this shape. Every sellable variant has a SKU.
 */

export const CURRENCY = "INR";

export type Shade = { name: string; hex: string; sku: string };

type Listing = {
  id: string;
  brand: string;
  name: string;
  blurb: string;
  /** Rupees, whole numbers. */
  price: number;
  size: string;
  rating: number;
  reviews: number;
};

export type MakeupProduct = Listing & {
  kind: "makeup";
  category: "foundation" | "concealer" | "lip_color" | "blush";
  shades: Shade[];
  /** Which colour from the profile the "closest match" is measured against, if any. */
  matchAgainst: "skin" | "lip" | null;
};

export type SkincareProduct = Listing & {
  kind: "skincare";
  sku: string;
  active: string;
  concern: "pore" | "acne" | "redness" | "texture";
  claim: string;
};

export type CatalogProduct = MakeupProduct | SkincareProduct;

export const MAKEUP: MakeupProduct[] = [
  {
    id: "foundation",
    kind: "makeup",
    category: "foundation",
    brand: "Atelier Dew",
    name: "Skin-tint foundation",
    blurb: "Light coverage, natural finish.",
    price: 899,
    size: "30 ml",
    rating: 4.4,
    reviews: 1286,
    matchAgainst: "skin",
    shades: [
      { name: "Porcelain", hex: "#f4dcc8", sku: "AD-FND-01" },
      { name: "Ivory", hex: "#edcbab", sku: "AD-FND-02" },
      { name: "Beige", hex: "#e0b992", sku: "AD-FND-03" },
      { name: "Sand", hex: "#d3a57c", sku: "AD-FND-04" },
      { name: "Golden", hex: "#c49067", sku: "AD-FND-05" },
      { name: "Honey", hex: "#b27d52", sku: "AD-FND-06" },
      { name: "Caramel", hex: "#95623d", sku: "AD-FND-07" },
      { name: "Espresso", hex: "#64402a", sku: "AD-FND-08" },
    ],
  },
  {
    id: "concealer",
    kind: "makeup",
    category: "concealer",
    brand: "Atelier Dew",
    name: "Brightening concealer",
    blurb: "For under-eyes and the odd spot.",
    price: 649,
    size: "6 ml",
    rating: 4.5,
    reviews: 842,
    matchAgainst: "skin",
    shades: [
      { name: "Fair", hex: "#f6e0cc", sku: "AD-CNC-01" },
      { name: "Light", hex: "#efcfaf", sku: "AD-CNC-02" },
      { name: "Light medium", hex: "#e4bc95", sku: "AD-CNC-03" },
      { name: "Medium", hex: "#d4a57b", sku: "AD-CNC-04" },
      { name: "Tan", hex: "#be8b60", sku: "AD-CNC-05" },
      { name: "Deep", hex: "#8e5e3c", sku: "AD-CNC-06" },
    ],
  },
  {
    id: "lip",
    kind: "makeup",
    category: "lip_color",
    brand: "Petal Theory",
    name: "Soft-matte lip tint",
    blurb: "Sheer colour that wears like a stain.",
    price: 499,
    size: "4 g",
    rating: 4.3,
    reviews: 2310,
    matchAgainst: "lip",
    shades: [
      { name: "Nude rose", hex: "#b76e6e", sku: "PT-LIP-01" },
      { name: "Mauve", hex: "#9c5a6a", sku: "PT-LIP-02" },
      { name: "Coral", hex: "#d9594c", sku: "PT-LIP-03" },
      { name: "Berry", hex: "#8a2e4a", sku: "PT-LIP-04" },
      { name: "Classic red", hex: "#b3202e", sku: "PT-LIP-05" },
    ],
  },
  {
    id: "blush",
    kind: "makeup",
    category: "blush",
    brand: "Petal Theory",
    name: "Cream blush",
    blurb: "A soft flush on the cheeks.",
    price: 549,
    size: "5 g",
    rating: 4.2,
    reviews: 615,
    matchAgainst: null,
    shades: [
      { name: "Peach", hex: "#f2a07b", sku: "PT-BLS-01" },
      { name: "Soft rose", hex: "#e38c9a", sku: "PT-BLS-02" },
      { name: "Coral", hex: "#e9725f", sku: "PT-BLS-03" },
      { name: "Berry", hex: "#b2506b", sku: "PT-BLS-04" },
    ],
  },
];

export const SKINCARE: SkincareProduct[] = [
  {
    id: "niacinamide",
    kind: "skincare",
    sku: "LL-NIA-30",
    brand: "Lumen Lab",
    name: "Niacinamide serum",
    active: "niacinamide",
    concern: "pore",
    claim: "Visibly minimises the look of pores.",
    blurb: "Leave-on serum, morning or night.",
    price: 599,
    size: "30 ml",
    rating: 4.3,
    reviews: 3420,
  },
  {
    id: "salicylic",
    kind: "skincare",
    sku: "LL-SAL-50",
    brand: "Lumen Lab",
    name: "Salicylic acid gel",
    active: "salicylic acid",
    concern: "acne",
    claim: "Visibly reduces blemishes.",
    blurb: "Leave-on gel for breakout-prone areas.",
    price: 549,
    size: "50 ml",
    rating: 4.1,
    reviews: 1975,
  },
  {
    id: "centella",
    kind: "skincare",
    sku: "CR-CEN-50",
    brand: "Clayroom",
    name: "Centella calming cream",
    active: "centella asiatica",
    concern: "redness",
    claim: "Visibly reduces redness.",
    blurb: "Rich cream for reactive skin.",
    price: 799,
    size: "50 ml",
    rating: 4.6,
    reviews: 904,
  },
  {
    id: "lactic",
    kind: "skincare",
    sku: "CR-LAC-100",
    brand: "Clayroom",
    name: "Lactic acid toner",
    active: "lactic acid",
    concern: "texture",
    claim: "Smoother-looking skin texture.",
    blurb: "Gentle exfoliating toner, a few nights a week.",
    price: 699,
    size: "100 ml",
    rating: 4.2,
    reviews: 731,
  },
  {
    id: "retinal",
    kind: "skincare",
    sku: "LL-RET-30",
    brand: "Lumen Lab",
    name: "Retinal night serum",
    active: "retinal",
    concern: "texture",
    claim: "Visibly refines skin texture.",
    blurb: "Night only. Start twice a week.",
    price: 1099,
    size: "30 ml",
    rating: 4.4,
    reviews: 1530,
  },
  {
    id: "azelaic",
    kind: "skincare",
    sku: "CR-AZE-30",
    brand: "Clayroom",
    name: "Azelaic acid cream",
    active: "azelaic acid",
    concern: "redness",
    claim: "Calms the look of redness and bumps.",
    blurb: "Lightweight cream, morning or night.",
    price: 749,
    size: "30 ml",
    rating: 4.3,
    reviews: 688,
  },
];

export const CATALOG: CatalogProduct[] = [...MAKEUP, ...SKINCARE];

/* ---------------------------------------------------------- colour matching (CIELAB ΔE76) */

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(clean.slice(i, i + 2), 16)) as [number, number, number];
}

function toLab(hex: string): [number, number, number] {
  const lin = hexToRgb(hex).map((v) => {
    const c = v / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  });
  const [r, g, b] = lin;
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}

export function colorDistance(a: string, b: string): number {
  const [l1, a1, b1] = toLab(a);
  const [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
}

/** Index of the shade closest to a reference colour, or -1 without one. */
export function closestShade(shades: Shade[], reference: string | null | undefined): number {
  if (!reference) return -1;
  let best = -1;
  let gap = Infinity;
  shades.forEach((shade, index) => {
    const d = colorDistance(shade.hex, reference);
    if (d < gap) {
      gap = d;
      best = index;
    }
  });
  return best;
}

/**
 * A demo shelf of generic, unbranded products. There are no prices and no brand names on purpose:
 * in a real store this list comes from the retailer's catalogue.
 */

export type Shade = { name: string; hex: string };

export type MakeupProduct = {
  id: string;
  kind: "makeup";
  category: "foundation" | "concealer" | "lip_color" | "blush";
  name: string;
  blurb: string;
  shades: Shade[];
  /** Which colour from the profile the "closest match" is measured against, if any. */
  matchAgainst: "skin" | "lip" | null;
};

export type SkincareProduct = {
  id: string;
  kind: "skincare";
  name: string;
  active: string;
  concern: "pore" | "acne" | "redness" | "texture";
  claim: string;
  blurb: string;
};

export const MAKEUP: MakeupProduct[] = [
  {
    id: "foundation",
    kind: "makeup",
    category: "foundation",
    name: "Skin-tint foundation",
    blurb: "Light coverage, natural finish.",
    matchAgainst: "skin",
    shades: [
      { name: "Porcelain", hex: "#f4dcc8" },
      { name: "Ivory", hex: "#edcbab" },
      { name: "Beige", hex: "#e0b992" },
      { name: "Sand", hex: "#d3a57c" },
      { name: "Golden", hex: "#c49067" },
      { name: "Honey", hex: "#b27d52" },
      { name: "Caramel", hex: "#95623d" },
      { name: "Espresso", hex: "#64402a" },
    ],
  },
  {
    id: "concealer",
    kind: "makeup",
    category: "concealer",
    name: "Brightening concealer",
    blurb: "For under-eyes and the odd spot.",
    matchAgainst: "skin",
    shades: [
      { name: "Fair", hex: "#f6e0cc" },
      { name: "Light", hex: "#efcfaf" },
      { name: "Light medium", hex: "#e4bc95" },
      { name: "Medium", hex: "#d4a57b" },
      { name: "Tan", hex: "#be8b60" },
      { name: "Deep", hex: "#8e5e3c" },
    ],
  },
  {
    id: "lip",
    kind: "makeup",
    category: "lip_color",
    name: "Soft-matte lip tint",
    blurb: "Sheer colour that wears like a stain.",
    matchAgainst: "lip",
    shades: [
      { name: "Nude rose", hex: "#b76e6e" },
      { name: "Mauve", hex: "#9c5a6a" },
      { name: "Coral", hex: "#d9594c" },
      { name: "Berry", hex: "#8a2e4a" },
      { name: "Classic red", hex: "#b3202e" },
    ],
  },
  {
    id: "blush",
    kind: "makeup",
    category: "blush",
    name: "Cream blush",
    blurb: "A soft flush on the cheeks.",
    matchAgainst: null,
    shades: [
      { name: "Peach", hex: "#f2a07b" },
      { name: "Soft rose", hex: "#e38c9a" },
      { name: "Coral", hex: "#e9725f" },
      { name: "Berry", hex: "#b2506b" },
    ],
  },
];

export const SKINCARE: SkincareProduct[] = [
  {
    id: "niacinamide",
    kind: "skincare",
    name: "Niacinamide serum",
    active: "niacinamide",
    concern: "pore",
    claim: "Visibly minimises the look of pores.",
    blurb: "Leave-on serum, morning or night.",
  },
  {
    id: "salicylic",
    kind: "skincare",
    name: "Salicylic acid gel",
    active: "salicylic acid",
    concern: "acne",
    claim: "Visibly reduces blemishes.",
    blurb: "Leave-on gel for breakout-prone areas.",
  },
  {
    id: "centella",
    kind: "skincare",
    name: "Centella calming cream",
    active: "centella asiatica",
    concern: "redness",
    claim: "Visibly reduces redness.",
    blurb: "Rich cream for reactive skin.",
  },
  {
    id: "lactic",
    kind: "skincare",
    name: "Lactic acid toner",
    active: "lactic acid",
    concern: "texture",
    claim: "Smoother-looking skin texture.",
    blurb: "Gentle exfoliating toner, a few nights a week.",
  },
];

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

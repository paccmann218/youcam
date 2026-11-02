/** Turns what was said into a product, an active ingredient and a start day. */

export const LAST_PRODUCT = "Minimalist moisturizer";

/** Products the demo says by a short name, saved under their full shelf name. */
export const KNOWN_PRODUCTS = [
  {
    heard: (t: string) => (/minimal/.test(t) && /acne|face ?wash|cleanser|salicylic/.test(t)) || (/anti ?acne/.test(t) && /face ?wash|cleanser/.test(t)),
    name: "Minimalist Anti-Acne 02% Salicylic Acid + LHA Face Cleanser Face Wash",
    spoken: "Minimalist Anti-Acne Salicylic Acid face wash",
    ingredient: "2% salicylic acid",
    spokenIngredient: "2 percent salicylic acid",
  },
];

export function knownProduct(name: string) {
  const t = words(name).replace(/-/g, " ").replace(/\s+/g, " ");
  return KNOWN_PRODUCTS.find((product) => product.name === name || product.heard(t)) ?? null;
}

const NUMBERS: Record<string, number> = { a: 1, an: 1, one: 1, two: 2, three: 3, four: 4, five: 5, six: 6, seven: 7, eight: 8, nine: 9, ten: 10 };
const WEEKDAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];

/** From the first word that starts a "when" phrase to the end: "and I'm starting from today". */
const DATE_TAIL =
  /\s*\b(?:and\s+)?(?:i\s+(?:am\s+|m\s+|have\s+been\s+|was\s+|will\s+be\s+|will\s+|ll\s+)?)?(?:start(?:ed|ing)?\b|began\b|begin\b|since\b|from\s+(?:today|tonight|yesterday|last|\d|one|two|three|four|five|six|seven|eight|nine|ten|a\s|an\s|sunday|monday|tuesday|wednesday|thursday|friday|saturday)|today\b|tonight\b|yesterday\b|last\s+(?:night|week|sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b|(?:\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+(?:days?|weeks?)\s+ago\b|(?:on\s+)?(?:sunday|monday|tuesday|wednesday|thursday|friday|saturday)\b).*$/;

function words(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9%\s-]/g, " ").replace(/\s+/g, " ").trim();
}

/** Days before today the product was started, or null when nothing in the sentence is a date. */
export function startOffset(text: string, todayWeekday: number): number | null {
  const t = words(text);
  if (/\b(today|tonight|now)\b/.test(t)) return 0;
  if (/\b(yesterday|last night)\b/.test(t)) return 1;
  if (/\blast week\b/.test(t)) return 7;
  const ago = t.match(/\b(\d+|a|an|one|two|three|four|five|six|seven|eight|nine|ten)\s+(day|days|week|weeks)\s+ago\b/);
  if (ago) {
    const n = /^\d+$/.test(ago[1]) ? Number(ago[1]) : NUMBERS[ago[1]] ?? 1;
    return ago[2].startsWith("week") ? n * 7 : n;
  }
  const day = WEEKDAYS.findIndex((name) => new RegExp(`\\b${name}\\b`).test(t));
  if (day >= 0) return (todayWeekday - day + 7) % 7 || 7;
  return null;
}

function titleCase(text: string): string {
  return text.replace(/\b([a-z])/g, (m) => m.toUpperCase()).replace(/\b(Spf|Aha|Bha|Pha)\b/g, (m) => m.toUpperCase());
}

/** "I used the Minimalist niacinamide serum." -> "Minimalist Niacinamide Serum" */
export function productFrom(text: string): string | null {
  const t = words(text);
  if (!t) return null;
  const known = knownProduct(text);
  if (known) return known.name;
  if (/^(yes|yeah|yep|same|same one|same as last time|the same|that one|it|that)( one| again| as last time)?$/.test(t) || /\bsame (one|as last time|product)\b/.test(t)) {
    return LAST_PRODUCT;
  }
  const cleaned = t
    .replace(DATE_TAIL, "")
    .replace(/^(yes|yeah|ok|okay|so|well|um|uh)\s+/, "")
    .replace(/^(i\s+)?(have\s+|had\s+)?(just\s+)?(used|applied|put on|tried|am using|was using|use)\s+/, "")
    .replace(/^(it was|it is|it's|its|this is|that was)\s+/, "")
    .replace(/^(the|a|an|my|some)\s+/, "")
    .replace(/\s+(tonight|today|again|this evening|this morning)$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned ? titleCase(cleaned) : null;
}

/** "The main ingredient is niacinamide, starting from today." -> "niacinamide" */
export function ingredientFrom(text: string): string | null {
  const cleaned = words(text)
    .replace(DATE_TAIL, "")
    .replace(/^(yes|yeah|ok|okay|so|well|um|uh)\s+/, "")
    .replace(/^(the\s+)?(main\s+|key\s+|active\s+)?(ingredient|active)(\s+is|\s+was|s\s+are)?\s+/, "")
    .replace(/^(it\s+)?(has|have|contains|is|it's|its)\s+/, "")
    .replace(/^(the|a|an|some)\s+/, "")
    .replace(/\s+(in it|inside)$/, "")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned || null;
}

/** The concern a product is most likely tested for, from its active. */
export function concernFor(ingredient: string, product = ""): "acne" | "pore" | "redness" | "texture" {
  const t = `${ingredient} ${product}`.toLowerCase();
  if (/niacinamide|zinc|pore/.test(t)) return "pore";
  if (/salicylic|bha|benzoyl|adapalene|tea tree|sulphur|sulfur|acne|blemish/.test(t)) return "acne";
  if (/centella|cica|azelaic|allantoin|panthenol|green tea|calm|redness/.test(t)) return "redness";
  if (/retin|aha|glycolic|lactic|mandelic|vitamin c|ascorbic|ceramide|hyaluronic|squalane|peptide|moistur|texture/.test(t)) return "texture";
  return "acne";
}

export function sameProduct(a: string, b: string): boolean {
  const x = words(a);
  const y = words(b);
  return Boolean(x && y && (x === y || x.includes(y) || y.includes(x)));
}

export function spokenStart(offset: number): string {
  if (offset === 0) return "starting today";
  if (offset === 1) return "starting yesterday";
  return `starting ${offset} days ago`;
}

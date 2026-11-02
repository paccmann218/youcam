export async function geocode(name: string): Promise<{ name: string; latitude: number; longitude: number } | null> {
  const url = `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(name)}&count=1`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { results?: { name: string; latitude: number; longitude: number; country?: string }[] };
  const hit = json.results?.[0];
  if (!hit) return null;
  return { name: [hit.name, hit.country].filter(Boolean).join(", "), latitude: hit.latitude, longitude: hit.longitude };
}

export async function humidityAt(latitude: number, longitude: number): Promise<number | null> {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${latitude}&longitude=${longitude}&current=relative_humidity_2m`;
  const res = await fetch(url);
  if (!res.ok) return null;
  const json = (await res.json()) as { current?: { relative_humidity_2m?: number } };
  const value = json.current?.relative_humidity_2m;
  return typeof value === "number" ? value : null;
}

export type OffProduct = {
  name: string;
  brands: string;
  ingredients: string;
};

export async function lookupBarcode(barcode: string): Promise<OffProduct | null> {
  const cleaned = barcode.replace(/\D/g, "");
  if (cleaned.length < 8) return null;
  const res = await fetch(`https://world.openbeautyfacts.org/api/v2/product/${cleaned}.json`);
  if (!res.ok) return null;
  const json = (await res.json()) as {
    status?: number;
    product?: { product_name?: string; brands?: string; ingredients_text?: string };
  };
  if (json.status !== 1 || !json.product) return null;
  return {
    name: json.product.product_name || "Listed product",
    brands: json.product.brands || "",
    ingredients: json.product.ingredients_text || "",
  };
}

export function intensityForClaim(claim: string): number {
  const percent = claim.match(/(\d+)\s*%/);
  const value = percent ? Number(percent[1]) : null;
  if (/dramatic|maximum|instantly|erase/i.test(claim) || (value != null && value >= 50)) return 0.8;
  if (/subtle|slight|mild/i.test(claim) || (value != null && value < 20)) return 0.25;
  return 0.5;
}

export function concernFromClaim(claim: string): string {
  const text = claim.toLowerCase();
  if (/acne|blemish|breakout|pimple/.test(text)) return "acne";
  if (/pore/.test(text)) return "pore";
  if (/red/.test(text)) return "redness";
  if (/wrinkle|fine line/.test(text)) return "wrinkle";
  if (/glow|radiance|bright/.test(text)) return "radiance";
  if (/spot|pigment|dark mark/.test(text)) return "spots";
  if (/oil|shine/.test(text)) return "oiliness";
  if (/texture|smooth/.test(text)) return "texture";
  return "texture";
}

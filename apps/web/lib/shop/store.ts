import type { BagLine, OrderLine } from "../store/db";
import { CATALOG, CURRENCY, type CatalogProduct } from "./catalog";

export const FREE_SHIPPING_FROM = 999;
export const SHIPPING_FEE = 79;
export const MAX_QTY = 10;

export type PricedBag = {
  lines: OrderLine[];
  count: number;
  subtotal: number;
  shipping: number;
  total: number;
  currency: string;
  freeShippingFrom: number;
};

export function findProduct(id: string): CatalogProduct | null {
  return CATALOG.find((product) => product.id === id) ?? null;
}

/** The sellable variant behind a SKU: a shade for makeup, the single pack for skincare. */
export function variantOf(product: CatalogProduct, sku: string): { variant: string; color: string | null } | null {
  if (product.kind === "makeup") {
    const shade = product.shades.find((item) => item.sku === sku);
    return shade ? { variant: shade.name, color: shade.hex } : null;
  }
  return product.sku === sku ? { variant: product.size, color: null } : null;
}

/** Prices a bag from the catalogue. Lines whose product or SKU no longer exists are dropped. */
export function priceBag(lines: BagLine[]): PricedBag {
  const priced: OrderLine[] = [];
  for (const line of lines) {
    const product = findProduct(line.productId);
    const variant = product ? variantOf(product, line.sku) : null;
    if (!product || !variant || line.qty < 1) continue;
    priced.push({
      productId: product.id,
      sku: line.sku,
      kind: product.kind,
      brand: product.brand,
      name: product.name,
      variant: variant.variant,
      color: variant.color,
      unitPrice: product.price,
      qty: line.qty,
      lineTotal: product.price * line.qty,
    });
  }
  const subtotal = priced.reduce((sum, line) => sum + line.lineTotal, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE;
  return {
    lines: priced,
    count: priced.reduce((sum, line) => sum + line.qty, 0),
    subtotal,
    shipping,
    total: subtotal + shipping,
    currency: CURRENCY,
    freeShippingFrom: FREE_SHIPPING_FROM,
  };
}

export type BagChange = { productId: string; sku: string; qty: number };

/** Applies quantity changes (positive adds, negative removes), keeping each line between 0 and MAX_QTY. */
export function changeBag(lines: BagLine[], changes: BagChange[]): BagLine[] {
  const next = lines.map((line) => ({ ...line }));
  for (const change of changes) {
    const line = next.find((item) => item.productId === change.productId && item.sku === change.sku);
    if (line) line.qty = Math.min(MAX_QTY, Math.max(0, line.qty + change.qty));
    else if (change.qty > 0) next.push({ productId: change.productId, sku: change.sku, qty: Math.min(MAX_QTY, change.qty) });
  }
  return next.filter((line) => line.qty > 0);
}

/** Checks a requested change against the catalogue; returns an error sentence or null. */
export function invalidChange(change: Partial<BagChange>): string | null {
  const product = change.productId ? findProduct(change.productId) : null;
  if (!product) return "That product isn't in the store.";
  if (!change.sku || !variantOf(product, change.sku)) return `That shade or size of ${product.name} isn't in the store.`;
  if (!Number.isInteger(change.qty) || change.qty === 0 || Math.abs(change.qty!) > MAX_QTY) return "Quantity must be a whole number from 1 to 10.";
  return null;
}

export function orderNumber(existingOrders: number): string {
  return `WI-${1001 + existingOrders}`;
}

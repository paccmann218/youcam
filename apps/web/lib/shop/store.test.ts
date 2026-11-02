import { describe, expect, it } from "vitest";
import { CATALOG } from "./catalog";
import { changeBag, invalidChange, priceBag, SHIPPING_FEE } from "./store";

describe("catalogue", () => {
  it("gives every sellable variant a unique SKU and a price", () => {
    const skus = CATALOG.flatMap((product) => (product.kind === "makeup" ? product.shades.map((shade) => shade.sku) : [product.sku]));
    expect(new Set(skus).size).toBe(skus.length);
    expect(CATALOG.every((product) => Number.isInteger(product.price) && product.price > 0)).toBe(true);
  });
});

describe("bag", () => {
  it("adds, merges and removes lines", () => {
    let lines = changeBag([], [{ productId: "lip", sku: "PT-LIP-03", qty: 1 }]);
    lines = changeBag(lines, [{ productId: "lip", sku: "PT-LIP-03", qty: 2 }]);
    expect(lines).toEqual([{ productId: "lip", sku: "PT-LIP-03", qty: 3 }]);
    expect(changeBag(lines, [{ productId: "lip", sku: "PT-LIP-03", qty: -3 }])).toEqual([]);
  });

  it("prices from the catalogue and charges shipping only under the free threshold", () => {
    const small = priceBag([{ productId: "lip", sku: "PT-LIP-01", qty: 1 }]);
    expect(small).toMatchObject({ count: 1, subtotal: 499, shipping: SHIPPING_FEE, total: 499 + SHIPPING_FEE });
    expect(small.lines[0]).toMatchObject({ brand: "Petal Theory", variant: "Nude rose", lineTotal: 499 });
    const big = priceBag([
      { productId: "foundation", sku: "AD-FND-05", qty: 1 },
      { productId: "niacinamide", sku: "LL-NIA-30", qty: 1 },
    ]);
    expect(big).toMatchObject({ subtotal: 1498, shipping: 0, total: 1498 });
  });

  it("drops lines that are no longer sold", () => {
    expect(priceBag([{ productId: "gone", sku: "X", qty: 1 }]).lines).toEqual([]);
  });

  it("rejects unknown products, wrong SKUs and odd quantities", () => {
    expect(invalidChange({ productId: "nope", sku: "X", qty: 1 })).toMatch(/isn't in the store/);
    expect(invalidChange({ productId: "lip", sku: "AD-FND-01", qty: 1 })).toMatch(/shade or size/);
    expect(invalidChange({ productId: "lip", sku: "PT-LIP-01", qty: 1.5 })).toMatch(/whole number/);
    expect(invalidChange({ productId: "lip", sku: "PT-LIP-01", qty: 1 })).toBeNull();
  });
});

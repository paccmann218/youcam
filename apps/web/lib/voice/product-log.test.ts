import { describe, expect, it } from "vitest";
import { LAST_PRODUCT, concernFor, ingredientFrom, knownProduct, productFrom, sameProduct, startOffset } from "./product-log";

describe("spoken product log", () => {
  it("reads the product out of a sentence", () => {
    expect(productFrom("I used the Minimalist niacinamide serum.")).toBe("Minimalist Niacinamide Serum");
    expect(productFrom("Minimalist moisturizer")).toBe("Minimalist Moisturizer");
    expect(productFrom("Yes, the same one.")).toBe(LAST_PRODUCT);
    expect(productFrom("Same as last time")).toBe(LAST_PRODUCT);
    expect(productFrom("")).toBeNull();
  });

  it("reads the ingredient and drops the when", () => {
    expect(ingredientFrom("Niacinamide, starting from today.")).toBe("niacinamide");
    expect(ingredientFrom("The main ingredient is niacinamide and I'm starting from today")).toBe("niacinamide");
    expect(ingredientFrom("It has salicylic acid. I started yesterday.")).toBe("salicylic acid");
    expect(ingredientFrom("Ceramides")).toBe("ceramides");
  });

  it("reads when it started", () => {
    expect(startOffset("niacinamide starting from today", 1)).toBe(0);
    expect(startOffset("I started yesterday", 1)).toBe(1);
    expect(startOffset("three days ago", 1)).toBe(3);
    expect(startOffset("2 weeks ago", 1)).toBe(14);
    expect(startOffset("since Saturday", 1)).toBe(2);
    expect(startOffset("niacinamide", 1)).toBeNull();
  });

  it("maps actives to the concern they are tested on", () => {
    expect(concernFor("niacinamide")).toBe("pore");
    expect(concernFor("salicylic acid")).toBe("acne");
    expect(concernFor("centella")).toBe("redness");
    expect(concernFor("ceramides", "Minimalist Moisturizer")).toBe("texture");
  });

  it("saves the demo face wash under its full shelf name", () => {
    const full = "Minimalist Anti-Acne 02% Salicylic Acid + LHA Face Cleanser Face Wash";
    for (const said of ["Minimalist anti acne face wash.", "I am using Minimalist anti-acne facewash", "minimalist anti acne cleanser"]) {
      expect(productFrom(said)).toBe(full);
    }
    expect(knownProduct(full)?.ingredient).toBe("2% salicylic acid");
    expect(concernFor("2% salicylic acid", full)).toBe("acne");
    expect(knownProduct("Minimalist moisturizer")).toBeNull();
  });

  it("matches the same product loosely", () => {
    expect(sameProduct("Minimalist Moisturizer", "minimalist moisturizer")).toBe(true);
    expect(sameProduct("Lumen Lab Niacinamide serum", "Minimalist Niacinamide Serum")).toBe(false);
  });
});

import { describe, expect, it } from "vitest";
import { makeupEffects, parseColorTones } from "../youcam/profile";
import { closestShade, colorDistance, MAKEUP } from "./catalog";

const foundation = MAKEUP.find((item) => item.category === "foundation")!;

describe("shade matching", () => {
  it("a colour is zero distance from itself", () => {
    expect(colorDistance("#c49067", "#c49067")).toBeCloseTo(0, 6);
  });

  it("picks the foundation shade nearest the skin tone", () => {
    expect(foundation.shades[closestShade(foundation.shades, "#c69268")].name).toBe("Golden");
    expect(foundation.shades[closestShade(foundation.shades, "#f2d9c5")].name).toBe("Porcelain");
    expect(foundation.shades[closestShade(foundation.shades, "#5f3d28")].name).toBe("Espresso");
  });

  it("returns -1 without a reference colour", () => {
    expect(closestShade(foundation.shades, null)).toBe(-1);
  });
});

describe("makeup VTO effects", () => {
  it("builds every category with the fields YouCam requires", () => {
    const effects = makeupEffects([
      { category: "foundation", color: "#c49067" },
      { category: "concealer", color: "d4a57b" },
      { category: "lip_color", color: "#b76e6e" },
      { category: "blush", color: "#f2a07b" },
    ]);
    expect(effects.map((effect) => effect.category)).toEqual(["foundation", "concealer", "lip_color", "blush"]);
    const [base, conceal, lip, blush] = effects as Record<string, any>[];
    expect(base.palettes[0]).toMatchObject({ color: "#c49067", colorIntensity: expect.any(Number), glowIntensity: expect.any(Number), coverageIntensity: expect.any(Number) });
    expect(conceal.palettes[0]).toMatchObject({ color: "#d4a57b", colorUnderEyeIntensity: expect.any(Number), coverageLevel: expect.any(Number) });
    expect(lip).toMatchObject({ shape: { name: expect.any(String) }, style: { type: "full" } });
    expect(lip.palettes[0]).toMatchObject({ texture: "matte", colorIntensity: expect.any(Number) });
    expect(blush).toMatchObject({ pattern: { name: expect.any(String) } });
    expect(blush.palettes[0]).toMatchObject({ texture: "matte", colorIntensity: expect.any(Number) });
  });
});

describe("colour tones parsing", () => {
  it("finds colours by the key they sit under, whatever the nesting", () => {
    const parsed = parseColorTones({
      data: {
        results: {
          skin_color: { hex: "#C49067" },
          features: { lip_color: "#a85a5a", eye_color: [70, 45, 30], eyebrow_color: "#3a2a20", hair_color: "#1e1612" },
          undertone: "warm",
        },
      },
    });
    expect(parsed).toEqual({ skin: "#c49067", lip: "#a85a5a", eye: "#462d1e", brow: "#3a2a20", hair: "#1e1612", undertone: "warm" });
  });

  it("falls back to the first colour as skin when no key says skin", () => {
    expect(parseColorTones({ data: { results: [{ color: "#d3a57c" }] } }).skin).toBe("#d3a57c");
  });
});

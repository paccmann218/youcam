import { readFile } from "fs/promises";
import path from "path";
import type { Db, Scan } from "../store/db";
import { hashBytes, runTask, uploadImage } from "./client";

type Json = Record<string, unknown>;

export const HEX = /^#?[0-9a-fA-F]{6}$/;

/** The latest face photo for a user (claim renders excluded). */
export function latestFace(db: Db, userId: string): Scan | null {
  return [...db.scans].reverse().find((scan) => scan.userId === userId && scan.imageFile && scan.purpose !== "claim") ?? null;
}

export async function faceBytes(scan: Scan): Promise<Buffer> {
  return readFile(path.join(process.cwd(), ".data", "images", scan.imageFile as string));
}

/**
 * YouCam AI Facial Color Tones Analyzer (task "skin-tone-analysis").
 * Same request and cache key the concealer route has always used, so the two share one paid call.
 */
export async function runColorTones(bytes: Buffer, fileName: string) {
  const uploaded = await uploadImage(bytes, "image/jpeg", fileName);
  return runTask({
    endpoint: "/s2s/v2.0/task/skin-tone-analysis",
    imageHash: hashBytes(bytes) + "tone",
    body: { src_file_id: uploaded.fileId, format: "json" },
  });
}

function toHex(value: unknown): string | null {
  if (typeof value === "string" && HEX.test(value.trim())) {
    const v = value.trim();
    return (v.startsWith("#") ? v : `#${v}`).toLowerCase();
  }
  if (Array.isArray(value) && value.length >= 3 && value.slice(0, 3).every((n) => typeof n === "number" && n >= 0 && n <= 255)) {
    return `#${value
      .slice(0, 3)
      .map((n) => Math.round(n as number).toString(16).padStart(2, "0"))
      .join("")}`;
  }
  return null;
}

/**
 * The response field names are not pinned down in the public spec, so this walks the
 * result and keeps every colour together with the key path it was found under.
 */
export function parseColorTones(raw: Json) {
  const found: { path: string; hex: string }[] = [];
  const words: { path: string; text: string }[] = [];
  const walk = (value: unknown, trail: string[]) => {
    const hex = toHex(value);
    if (hex) {
      found.push({ path: trail.join(".").toLowerCase(), hex });
      return;
    }
    if (typeof value === "string") {
      words.push({ path: trail.join(".").toLowerCase(), text: value });
      return;
    }
    if (Array.isArray(value)) value.forEach((item, index) => walk(item, [...trail, String(index)]));
    else if (value && typeof value === "object") for (const [key, item] of Object.entries(value)) walk(item, [...trail, key]);
  };
  walk((raw.data as Json)?.results ?? raw.data ?? raw, []);

  const pick = (test: (p: string) => boolean) => found.find((item) => test(item.path))?.hex ?? null;
  const skin = pick((p) => p.includes("skin")) ?? found[0]?.hex ?? null;
  const undertone = words.find((item) => /undertone|tone_type|skin_tone_type/.test(item.path))?.text ?? null;
  return {
    skin,
    lip: pick((p) => p.includes("lip")),
    eye: pick((p) => p.includes("eye") && !p.includes("brow")),
    brow: pick((p) => p.includes("brow")),
    hair: pick((p) => p.includes("hair")),
    undertone,
  };
}

/* ---------------------------------------------------------- makeup VTO */

export type TryOnItem = { category: "foundation" | "concealer" | "lip_color" | "blush"; color: string };

/** Builds YouCam Makeup VTO effects, following the per-category schema in YouCam's spec. */
export function makeupEffects(items: TryOnItem[]): Json[] {
  return items.map((item) => {
    const color = item.color.startsWith("#") ? item.color : `#${item.color}`;
    switch (item.category) {
      case "foundation":
        return { category: "foundation", palettes: [{ color, colorIntensity: 50, glowIntensity: 15, coverageIntensity: 50 }] };
      case "concealer":
        return { category: "concealer", palettes: [{ color, colorIntensity: 42, colorUnderEyeIntensity: 58, coverageLevel: 48 }] };
      case "lip_color":
        return {
          category: "lip_color",
          shape: { name: "original" },
          style: { type: "full" },
          palettes: [{ color, texture: "matte", colorIntensity: 70 }],
        };
      case "blush":
        return { category: "blush", pattern: { name: "1color1" }, palettes: [{ color, texture: "matte", colorIntensity: 55 }] };
    }
  });
}

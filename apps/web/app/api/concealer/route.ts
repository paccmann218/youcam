import { readFile } from "fs/promises";
import path from "path";
import { randomUUID } from "crypto";
import { json, options, resolveUser } from "@/lib/http";
import { readDb } from "@/lib/store/db";
import { findImageUrl, hashBytes, runTask, uploadImage, YouCamError } from "@/lib/youcam/client";
import { saveImage } from "@/lib/youcam/analyze";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

function hexFrom(value: unknown): string | null {
  const text = JSON.stringify(value);
  const match = text.match(/#[0-9a-fA-F]{6}/);
  return match ? match[0] : null;
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user?.consentAt) return json({ error: "Consent comes before a try-on." }, 403);
  const body = (await request.json().catch(() => ({}))) as { cheekHex?: string };
  const db = await readDb();
  const face = [...db.scans].reverse().find((scan) => scan.userId === user.id && scan.imageFile && scan.purpose !== "claim");
  if (!face?.imageFile) return json({ error: "Add a face photo on Shop & try on first." }, 400);
  const bytes = await readFile(path.join(process.cwd(), ".data", "images", face.imageFile));
  try {
    const uploaded = await uploadImage(bytes, "image/jpeg", face.imageFile);
    let toneHex: string | null = null;
    let toneRaw: unknown = null;
    try {
      const tone = await runTask({
        endpoint: "/s2s/v2.0/task/skin-tone-analysis",
        imageHash: hashBytes(bytes) + "tone",
        body: { src_file_id: uploaded.fileId, format: "json" },
      });
      toneRaw = tone.raw;
      toneHex = hexFrom(tone.raw);
    } catch {
      toneHex = null;
    }
    const color = toneHex ?? (body.cheekHex && /^#[0-9a-fA-F]{6}$/.test(body.cheekHex) ? body.cheekHex : null);
    if (!color) return json({ error: "No skin-tone color came back, and the cheek sample was missing." }, 502);
    const makeup = await runTask({
      endpoint: "/s2s/v2.0/task/makeup-vto",
      imageHash: hashBytes(bytes) + color,
      body: {
        src_file_id: uploaded.fileId,
        effects: [
          {
            category: "concealer",
            palettes: [
              {
                color,
                colorIntensity: 42,
                colorUnderEyeIntensity: 58,
                coverageLevel: 48,
              },
            ],
          },
        ],
      },
    });
    const previewUrl = findImageUrl(makeup.raw);
    if (!previewUrl) return json({ error: "Makeup try-on finished without an image.", toneSource: toneHex ? "youcam" : "cheek" }, 502);
    const preview = await downloadSafe(previewUrl);
    const file = preview ? await saveImage(`concealer-${randomUUID()}`, preview) : null;
    return json({
      color,
      toneSource: toneHex ? "youcam" : "cheek",
      previewUrl: file ? `/api/images/${file}` : previewUrl,
      note: "A breakout-day concealer, picked from the tone of this photo. It does not treat anything.",
    });
  } catch (error) {
    const message = error instanceof YouCamError ? error.message : error instanceof Error ? error.message : "Try-on failed.";
    return json({ error: message }, 502);
  }
}

async function downloadSafe(url: string): Promise<Buffer | null> {
  try {
    const res = await fetch(url);
    if (!res.ok) return null;
    return Buffer.from(await res.arrayBuffer());
  } catch {
    return null;
  }
}

import { randomUUID } from "crypto";
import { json, options, resolveUser } from "@/lib/http";
import { readDb } from "@/lib/store/db";
import { saveImage } from "@/lib/youcam/analyze";
import { download, findImageUrl, hashBytes, runTask, uploadImage, YouCamError } from "@/lib/youcam/client";
import { faceBytes, HEX, latestFace, makeupEffects, type TryOnItem } from "@/lib/youcam/profile";

export const dynamic = "force-dynamic";

const CATEGORIES = new Set(["foundation", "concealer", "lip_color", "blush"]);

export function OPTIONS() {
  return options();
}

/**
 * YouCam AI Makeup Virtual Try-On on the latest face photo.
 * One item tries a single shade; several items try a whole basket in one call.
 */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user?.consentAt) return json({ error: "Consent comes before a try-on." }, 403);
  const body = (await request.json().catch(() => ({}))) as { items?: TryOnItem[] };
  const items = (body.items ?? []).filter((item) => CATEGORIES.has(item?.category) && HEX.test(String(item?.color ?? "")));
  if (items.length === 0) return json({ error: "Pick at least one shade to try on." }, 400);
  // One shade per category: the last one picked wins.
  const byCategory = new Map(items.map((item) => [item.category, item]));
  const chosen = [...byCategory.values()];

  const db = await readDb();
  const face = latestFace(db, user.id);
  if (!face?.imageFile) return json({ error: "Take a face scan first. Try-ons use your latest scan photo." }, 400);

  try {
    const bytes = await faceBytes(face);
    const uploaded = await uploadImage(bytes, "image/jpeg", face.imageFile);
    const effects = makeupEffects(chosen);
    const task = await runTask({
      endpoint: "/s2s/v2.0/task/makeup-vto",
      imageHash: hashBytes(bytes) + JSON.stringify(effects),
      body: { src_file_id: uploaded.fileId, version: "1.0", effects },
    });
    const url = findImageUrl(task.raw);
    if (!url) return json({ error: "Makeup try-on finished without an image." }, 502);
    let previewUrl = url;
    try {
      const file = await saveImage(`tryon-${randomUUID()}`, await download(url));
      previewUrl = `/api/images/${file}`;
    } catch {
      /* keep the YouCam URL; it expires, but it still shows the result now */
    }
    return json({ previewUrl, beforeUrl: `/api/images/${face.imageFile}`, items: chosen, cached: task.cached });
  } catch (error) {
    const message = error instanceof YouCamError ? error.message : error instanceof Error ? error.message : "Try-on failed.";
    return json({ error: message }, 502);
  }
}

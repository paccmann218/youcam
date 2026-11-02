import { YouCamError } from "@/lib/youcam/client";
import { analyzeFace } from "@/lib/youcam/analyze";
import { json, options, resolveUser } from "@/lib/http";
import type { ScanPurpose } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

const purposes = new Set<ScanPurpose>(["noise", "daily", "lighting", "claim"]);

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Pair this browser first." }, 401);
  if (!user.consentAt) return json({ error: "Consent comes before a photograph." }, 403);
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return json({ error: "Missing image." }, 400);
  const purpose = String(form.get("purpose") ?? "daily");
  if (!purposes.has(purpose as ScanPurpose)) return json({ error: "Unknown purpose." }, 400);
  const mode = form.get("mode") === "hd" || process.env.YOUCAM_MODE === "hd" ? "hd" : "sd";
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length < 1000) return json({ error: "That image is too small to score." }, 400);
  if (bytes.length > 9_000_000) return json({ error: "That image is over 9MB. WorthIt resizes before upload; this one was not." }, 400);
  try {
    const result = await analyzeFace({
      userId: user.id,
      bytes,
      contentType: file.type || "image/jpeg",
      purpose: purpose as ScanPurpose,
      gated: form.get("gated") === "1",
      mode,
      lightLabel: String(form.get("lightLabel") ?? "") || null,
      groupId: String(form.get("groupId") ?? "") || null,
    });
    return json(result);
  } catch (error) {
    const message = error instanceof YouCamError ? error.message : error instanceof Error ? error.message : "Scan failed.";
    return json({ error: message }, 502);
  }
}

import { YouCamError } from "@/lib/youcam/client";
import { savePortrait } from "@/lib/youcam/analyze";
import { json, options, resolveUser } from "@/lib/http";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

/** Saves a face photo for shop try-on, colour matching, concealer, and claim renders. */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Open WorthIt and agree on the consent screen first." }, 401);
  if (!user.consentAt) return json({ error: "Consent comes before a photograph." }, 403);
  const form = await request.formData();
  const file = form.get("image");
  if (!(file instanceof File)) return json({ error: "Choose a face photo." }, 400);
  const bytes = Buffer.from(await file.arrayBuffer());
  if (bytes.length < 1000) return json({ error: "That image is too small to use." }, 400);
  if (bytes.length > 9_000_000) return json({ error: "That image is over 9MB." }, 400);
  const mode = form.get("mode") === "hd" || process.env.YOUCAM_MODE === "hd" ? "hd" : "sd";
  try {
    const saved = await savePortrait({
      userId: user.id,
      bytes,
      contentType: file.type || "image/jpeg",
      mode,
    });
    return json(saved);
  } catch (error) {
    const message = error instanceof YouCamError ? error.message : error instanceof Error ? error.message : "Could not save that photo.";
    return json({ error: message }, 502);
  }
}

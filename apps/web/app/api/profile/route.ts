import { json, options, resolveUser } from "@/lib/http";
import { readDb, updateDb, type ColorProfile } from "@/lib/store/db";
import { YouCamError } from "@/lib/youcam/client";
import { faceBytes, latestFace, parseColorTones, runColorTones } from "@/lib/youcam/profile";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

/** The colour profile, the latest face photo, and past claim checks, for the shop. */
export async function GET(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "No session." }, 401);
  const db = await readDb();
  const face = latestFace(db, user.id);
  const profile = [...(db.profiles ?? [])].reverse().find((item) => item.userId === user.id) ?? null;
  const products = db.products
    .filter((item) => item.userId === user.id)
    .slice(-30)
    .map(({ name, decision, measuredDelta, mdc, concern, createdAt }) => ({ name, decision, measuredDelta, mdc, concern, createdAt }));
  return json({ profile, faceImage: face?.imageFile ?? null, products });
}

/** Runs YouCam AI Facial Color Tones Analyzer on the latest face photo and stores the result. */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user?.consentAt) return json({ error: "Consent comes before reading your colours." }, 403);
  const db = await readDb();
  const face = latestFace(db, user.id);
  if (!face?.imageFile) return json({ error: "Add a face photo first, then WorthIt can read your colours." }, 400);
  try {
    const bytes = await faceBytes(face);
    const tones = await runColorTones(bytes, face.imageFile);
    const parsed = parseColorTones(tones.raw);
    if (!parsed.skin) return json({ error: "YouCam finished, but no skin colour came back for this photo." }, 502);
    const profile: ColorProfile = {
      userId: user.id,
      createdAt: new Date().toISOString(),
      scanId: face.id,
      ...parsed,
    };
    await updateDb((draft) => {
      draft.profiles = [...(draft.profiles ?? []).filter((item) => item.userId !== user.id), profile];
    });
    return json({ profile, cached: tones.cached });
  } catch (error) {
    const message = error instanceof YouCamError ? error.message : error instanceof Error ? error.message : "Colour reading failed.";
    return json({ error: message }, 502);
  }
}

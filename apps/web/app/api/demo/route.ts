import { randomUUID } from "crypto";
import { clearDemo, seedDemo } from "@/lib/demo/seed";
import { json, options, resolveUser } from "@/lib/http";
import { emitEvent, updateDb } from "@/lib/store/db";

export const dynamic = "force-dynamic";

export function OPTIONS() {
  return options();
}

/** Loads four weeks of sample data into this account, ending this morning. Running it again replaces the sample. */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "No session." }, 401);
  if (!user.consentAt) return json({ error: "Consent comes before any data." }, 403);
  const summary = await updateDb((db) => seedDemo(db, user));
  nudge(user.id);
  return json({ ok: true, ...summary });
}

/** Removes the sample rows. Real scans, nights and watch events stay. */
export async function DELETE(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "No session." }, 401);
  const removed = await updateDb((db) => clearDemo(db, user.id));
  nudge(user.id);
  return json({ ok: true, removed });
}

/** Open pages for this account reload their view. Nothing is stored. */
function nudge(userId: string) {
  emitEvent({ id: randomUUID(), userId, createdAt: new Date().toISOString(), type: "wake", payload: { source: "demo" } });
}

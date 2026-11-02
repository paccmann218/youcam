import { randomUUID } from "crypto";
import { json, options, resolveDevice } from "@/lib/http";
import { emitEvent, updateDb, type ProofEvent } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveDevice(request);
  if (!user) return json({ error: "No WorthIt account yet. Open the web app and agree to the consent screen first." }, 401);
  const body = (await request.json()) as { type?: ProofEvent["type"]; payload?: Record<string, unknown> };
  const type = body.type;
  if (!type || !["face_touch", "checkoff", "hr_ibi", "gesture_test", "wake"].includes(type)) {
    return json({ error: "Unknown event." }, 400);
  }
  const event: ProofEvent = {
    id: randomUUID(),
    userId: user.id,
    createdAt: new Date().toISOString(),
    type,
    payload: body.payload ?? {},
  };
  await updateDb((db) => {
    db.events.push(event);
    if (type === "gesture_test" && (body.payload?.label === "face" || body.payload?.label === "other")) {
      const predicted = body.payload.predicted === "face" ? "face" : "other";
      db.gestures.push({
        id: randomUUID(),
        userId: user.id,
        createdAt: event.createdAt,
        label: body.payload.label,
        predicted,
      });
    }
  });
  emitEvent(event);
  return json({ event });
}

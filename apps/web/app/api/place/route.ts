import { json, options, resolveUser } from "@/lib/http";
import { geocode, humidityAt } from "@/lib/integrations/outside";
import { updateDb } from "@/lib/store/db";
import { dayOf } from "@/lib/derive";
import { randomUUID } from "crypto";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Pair this browser first." }, 401);
  const body = (await request.json()) as { place?: string };
  if (!body.place?.trim()) return json({ error: "Name a place." }, 400);
  const found = await geocode(body.place.trim());
  if (!found) return json({ error: "That place did not resolve." }, 404);
  const humidity = await humidityAt(found.latitude, found.longitude);
  const day = dayOf(new Date().toISOString(), user.tzOffsetMinutes);
  await updateDb((db) => {
    const row = db.users.find((item) => item.id === user.id);
    if (row) {
      row.place = found.name;
      row.latitude = found.latitude;
      row.longitude = found.longitude;
    }
    if (humidity != null) {
      const existing = db.nights.find((night) => night.userId === user.id && night.day === day);
      if (existing) existing.humidity = humidity;
      else {
        db.nights.push({
          id: randomUUID(),
          userId: user.id,
          day,
          sleepHours: null,
          sleepScore: null,
          rmssd: null,
          restingHr: null,
          humidity,
          cyclePhase: null,
        });
      }
    }
  });
  return json({ place: found, humidity });
}

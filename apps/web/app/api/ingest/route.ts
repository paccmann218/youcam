import { randomUUID } from "crypto";
import { buildView, dayOf } from "@/lib/derive";
import { json, options, resolveDevice } from "@/lib/http";
import { humidityAt } from "@/lib/integrations/outside";
import { readDb, updateDb, type Night } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

export async function POST(request: Request) {
  const user = await resolveDevice(request);
  if (!user) return json({ error: "No WorthIt account yet. Open the web app and agree to the consent screen first." }, 401);
  const body = (await request.json()) as Partial<Night> & { day?: string };
  const day = body.day || dayOf(new Date().toISOString(), user.tzOffsetMinutes);
  let humidity = body.humidity ?? null;
  if (humidity == null && user.latitude != null && user.longitude != null) {
    humidity = await humidityAt(user.latitude, user.longitude);
  }
  const night: Night = {
    id: randomUUID(),
    userId: user.id,
    day,
    sleepHours: num(body.sleepHours),
    sleepScore: num(body.sleepScore),
    rmssd: num(body.rmssd),
    restingHr: num(body.restingHr),
    humidity,
    cyclePhase: body.cyclePhase ?? null,
  };
  await updateDb((db) => {
    db.nights = db.nights.filter((item) => !(item.userId === user.id && item.day === day));
    db.nights.push(night);
  });
  const db = await readDb();
  return json({ night, view: buildView(db, user) });
}

function num(value: unknown): number | null {
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

import { randomUUID } from "crypto";
import { buildView, dayOf } from "@/lib/derive";
import { json, options, resolveDevice } from "@/lib/http";
import { humidityAt } from "@/lib/integrations/outside";
import { readDb, updateDb, type Night } from "@/lib/store/db";

type NightNumber = "sleepHours" | "sleepScore" | "rmssd" | "restingHr";

export function OPTIONS() {
  return options();
}

/** The watch and the phone each send part of a night, so fields left out keep what the other device sent. */
export async function POST(request: Request) {
  const user = await resolveDevice(request);
  if (!user) return json({ error: "No WorthIt account yet. Open the web app and agree to the consent screen first." }, 401);
  const body = (await request.json()) as Partial<Night> & { day?: string };
  const day = body.day || dayOf(new Date().toISOString(), user.tzOffsetMinutes);
  const sameNight = (item: Night) => item.userId === user.id && item.day === day;
  const before = (await readDb()).nights.find(sameNight);
  let humidity = num(body.humidity) ?? before?.humidity ?? null;
  if (humidity == null && user.latitude != null && user.longitude != null) {
    humidity = await humidityAt(user.latitude, user.longitude);
  }
  await updateDb((db) => {
    const previous = db.nights.find(sameNight);
    const pick = (key: NightNumber) => (body[key] !== undefined ? num(body[key]) : previous?.[key] ?? null);
    const night: Night = {
      id: previous?.id ?? randomUUID(),
      userId: user.id,
      day,
      sleepHours: pick("sleepHours"),
      sleepScore: pick("sleepScore"),
      rmssd: pick("rmssd"),
      restingHr: pick("restingHr"),
      humidity,
      cyclePhase: body.cyclePhase !== undefined ? body.cyclePhase : previous?.cyclePhase ?? null,
    };
    db.nights = db.nights.filter((item) => !sameNight(item));
    db.nights.push(night);
  });
  const db = await readDb();
  return json({ night: db.nights.find(sameNight), view: buildView(db, user) });
}

function num(value: unknown): number | null {
  if (value == null || value === "") return null;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : null;
}

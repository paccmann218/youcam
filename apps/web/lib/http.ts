import { cookies } from "next/headers";
import { readDb, updateDb, type Db, type User } from "./store/db";

export async function userFromCookie(): Promise<User | null> {
  const jar = await cookies();
  const id = jar.get("proof_uid")?.value;
  if (!id) return null;
  const db = await readDb();
  return db.users.find((user) => user.id === id) ?? null;
}

export async function userFromPair(code: string | null): Promise<User | null> {
  if (!code) return null;
  const db = await readDb();
  return db.users.find((user) => user.pairCode === code) ?? null;
}

export async function resolveUser(request: Request): Promise<User | null> {
  const url = new URL(request.url);
  const code = request.headers.get("x-proof-pair") ?? url.searchParams.get("pair");
  return (await userFromPair(code)) ?? (await userFromCookie());
}

/**
 * For the watch and the phone-sync app only. There is no pairing step: a pair code or cookie is used
 * if one is sent, otherwise the event goes to the person currently using the web app, meaning the most
 * recently active account that gave consent. One person, one laptop. Browser routes keep resolveUser,
 * so a fresh browser can never read or delete another account through this fallback.
 */
export async function resolveDevice(request: Request): Promise<User | null> {
  const known = await resolveUser(request);
  if (known) return known;
  return activeUser(await readDb());
}

export function activeUser(db: Db): User | null {
  let best: User | null = null;
  let bestAt = "";
  for (const user of db.users) {
    if (!user.consentAt) continue;
    let at = user.consentAt > user.createdAt ? user.consentAt : user.createdAt;
    for (const scan of db.scans) if (scan.userId === user.id && scan.createdAt > at) at = scan.createdAt;
    for (const event of db.events) if (event.userId === user.id && event.createdAt > at) at = event.createdAt;
    for (const trial of db.trials) if (trial.userId === user.id && trial.createdAt > at) at = trial.createdAt;
    if (at > bestAt) {
      best = user;
      bestAt = at;
    }
  }
  return best;
}

export function pairCode(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

export async function ensureUser(id: string): Promise<User> {
  return updateDb((db) => {
    const existing = db.users.find((user) => user.id === id);
    if (existing) return existing;
    const user: User = {
      id,
      pairCode: pairCode(),
      consentAt: null,
      place: null,
      latitude: null,
      longitude: null,
      tzOffsetMinutes: 0,
      createdAt: new Date().toISOString(),
    };
    db.users.push(user);
    return user;
  });
}

export function localDay(iso: string, offsetMinutes: number): string {
  return new Date(new Date(iso).getTime() + offsetMinutes * 60_000).toISOString().slice(0, 10);
}

export function corsHeaders(): HeadersInit {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Headers": "Content-Type, X-Proof-Pair",
    "Access-Control-Allow-Methods": "GET,POST,DELETE,OPTIONS",
  };
}

export function json(body: unknown, status = 200): Response {
  return Response.json(body, { status, headers: corsHeaders() });
}

export function options(): Response {
  return new Response(null, { status: 204, headers: corsHeaders() });
}

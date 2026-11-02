// Loads sample data into every consented account in the local ledger, through the running server.
//   npm run demo:seed     load (or refresh, so it ends this morning)
//   npm run demo:clear    remove it again
// WORTHIT_URL points at another server; the default is http://localhost:3000.
import { readFile } from "fs/promises";

const clear = process.argv.includes("--clear");
const base = process.env.WORTHIT_URL ?? "http://localhost:3000";

const db = JSON.parse(await readFile(new URL("../.data/db.json", import.meta.url), "utf8"));
const users = (db.users ?? []).filter((user) => user.consentAt);
if (users.length === 0) {
  console.log("No account has agreed to the consent screen yet. Open WorthIt in the browser or phone app first.");
  process.exit(1);
}

let failed = 0;
for (const user of users) {
  try {
    const res = await fetch(`${base}/api/demo`, { method: clear ? "DELETE" : "POST", headers: { cookie: `proof_uid=${user.id}` } });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) failed++;
    const detail = !res.ok ? body.error ?? res.status : clear ? `removed ${body.removed} rows` : `${body.mornings} mornings, ${body.faceTouches} touches, trial day ${body.trialDay}`;
    console.log(`${user.id.slice(0, 8)}  ${res.ok ? "ok " : "err"}  ${detail}`);
  } catch (error) {
    failed++;
    console.log(`${user.id.slice(0, 8)}  err  ${error instanceof Error ? error.message : error}. Is the server running at ${base}?`);
  }
}
process.exit(failed ? 1 : 0);

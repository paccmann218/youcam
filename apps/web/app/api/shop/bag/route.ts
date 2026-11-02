import { json, options, resolveUser } from "@/lib/http";
import { changeBag, invalidChange, priceBag, type BagChange } from "@/lib/shop/store";
import { readDb, updateDb } from "@/lib/store/db";

const NO_ACCOUNT = "Open WorthIt and agree to the consent screen first.";

export function OPTIONS() {
  return options();
}

/** The bag, priced from the catalogue, plus the last few orders. */
export async function GET(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: NO_ACCOUNT }, 401);
  const db = await readDb();
  const bag = (db.bags ?? []).find((item) => item.userId === user.id);
  const orders = (db.orders ?? []).filter((order) => order.userId === user.id).slice(-5).reverse();
  return json({ bag: priceBag(bag?.lines ?? []), orders });
}

/** Body: `{ productId, sku, qty? }` or `{ items: [...] }`. `qty` is a change: 1 adds one, -1 takes one out. */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: NO_ACCOUNT }, 401);
  const body = (await request.json().catch(() => null)) as (Partial<BagChange> & { items?: Partial<BagChange>[] }) | null;
  if (!body) return json({ error: "Send the product and SKU as JSON." }, 400);
  const changes = (body.items ?? [body]).map((item) => ({ productId: item.productId, sku: item.sku, qty: item.qty ?? 1 }));
  if (changes.length === 0) return json({ error: "Nothing to add." }, 400);
  for (const change of changes) {
    const problem = invalidChange(change);
    if (problem) return json({ error: problem }, 400);
  }
  const lines = await updateDb((db) => {
    db.bags ??= [];
    let bag = db.bags.find((item) => item.userId === user.id);
    if (!bag) {
      bag = { userId: user.id, lines: [], updatedAt: "" };
      db.bags.push(bag);
    }
    bag.lines = changeBag(bag.lines, changes as BagChange[]);
    bag.updatedAt = new Date().toISOString();
    return bag.lines;
  });
  return json({ bag: priceBag(lines) });
}

/** Empties the bag. */
export async function DELETE(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: NO_ACCOUNT }, 401);
  await updateDb((db) => {
    db.bags = (db.bags ?? []).filter((item) => item.userId !== user.id);
  });
  return json({ bag: priceBag([]) });
}

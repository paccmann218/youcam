import { randomUUID } from "crypto";
import { json, options, resolveUser } from "@/lib/http";
import { orderNumber, priceBag } from "@/lib/shop/store";
import { updateDb, type Order } from "@/lib/store/db";

export function OPTIONS() {
  return options();
}

/** Turns the bag into an order. Demo store: the order is recorded and no payment is taken. */
export async function POST(request: Request) {
  const user = await resolveUser(request);
  if (!user) return json({ error: "Open WorthIt and agree to the consent screen first." }, 401);
  const order = await updateDb((db): Order | null => {
    db.bags ??= [];
    db.orders ??= [];
    const bag = db.bags.find((item) => item.userId === user.id);
    const priced = priceBag(bag?.lines ?? []);
    if (!bag || priced.lines.length === 0) return null;
    const placed: Order = {
      id: randomUUID(),
      number: orderNumber(db.orders.length),
      userId: user.id,
      createdAt: new Date().toISOString(),
      lines: priced.lines,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
      currency: priced.currency,
      status: "placed",
    };
    db.orders.push(placed);
    bag.lines = [];
    bag.updatedAt = placed.createdAt;
    return placed;
  });
  if (!order) return json({ error: "Your bag is empty." }, 400);
  return json({ order, bag: priceBag([]) });
}

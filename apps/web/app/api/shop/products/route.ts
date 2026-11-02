import { json, options } from "@/lib/http";
import { CATALOG, CURRENCY } from "@/lib/shop/catalog";
import { FREE_SHIPPING_FROM } from "@/lib/shop/store";

export function OPTIONS() {
  return options();
}

/** The store catalogue. `?kind=makeup` or `?kind=skincare` narrows it. */
export function GET(request: Request) {
  const kind = new URL(request.url).searchParams.get("kind");
  const products = kind === "makeup" || kind === "skincare" ? CATALOG.filter((product) => product.kind === kind) : CATALOG;
  return json({ store: "WorthIt demo store", currency: CURRENCY, freeShippingFrom: FREE_SHIPPING_FROM, products });
}

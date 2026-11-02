"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { FaceUpload } from "@/components/face-upload";
import { Icon } from "@/components/icons";
import { Face } from "@/components/illustrations/Face";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button, buttonClass } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card, CardLabel } from "@/components/ui/card";
import { Compare } from "@/components/ui/compare";
import { cx } from "@/components/ui/cx";
import { StatusPill, verdictLabel, verdictTone } from "@/components/ui/status";
import { closestShade, type CatalogProduct, type MakeupProduct, type SkincareProduct } from "@/lib/shop/catalog";
import type { PricedBag } from "@/lib/shop/store";
import type { Order } from "@/lib/store/db";

type Profile = { skin: string | null; lip: string | null; eye: string | null; brow: string | null; hair: string | null; undertone: string | null };
type PastCheck = { name: string; decision: string | null; measuredDelta: number | null; mdc: number | null };
type LookItem = { category: MakeupProduct["category"]; color: string; shade: string; product: string; productId: string; sku: string };
type TryOn = { previewUrl: string; beforeUrl: string; label: string };
type BagItem = { productId: string; sku: string; qty: number };

const rupees = new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 });
const inr = (value: number) => rupees.format(value);
const compact = new Intl.NumberFormat("en", { notation: "compact" });

function testHref(product: SkincareProduct) {
  return `/protocol?product=${encodeURIComponent(product.name)}&active=${encodeURIComponent(product.active)}&concern=${product.concern}`;
}

export default function ShopPage() {
  const { view, refresh } = useProof();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [faceImage, setFaceImage] = useState<string | null>(null);
  const [past, setPast] = useState<PastCheck[]>([]);
  const [reading, setReading] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [look, setLook] = useState<Record<string, LookItem>>({});
  const [tryOn, setTryOn] = useState<TryOn | null>(null);
  const [trying, setTrying] = useState<string | null>(null);
  const [tryError, setTryError] = useState<string | null>(null);
  const [catalog, setCatalog] = useState<CatalogProduct[] | null>(null);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [bag, setBag] = useState<PricedBag | null>(null);
  const [placed, setPlaced] = useState<Order | null>(null);
  const [checkingOut, setCheckingOut] = useState(false);
  const [bagError, setBagError] = useState<string | null>(null);

  const loadStore = useCallback(async () => {
    try {
      const [products, current] = await Promise.all([fetch("/api/shop/products"), fetch("/api/shop/bag", { cache: "no-store" })]);
      if (!products.ok) throw new Error();
      setCatalog(((await products.json()) as { products: CatalogProduct[] }).products);
      if (current.ok) setBag(((await current.json()) as { bag: PricedBag }).bag);
    } catch {
      setCatalogError("The store didn't load. Check the laptop is still running WorthIt, then reload.");
    }
  }, []);

  useEffect(() => {
    void loadStore();
  }, [loadStore]);

  async function updateBag(items: BagItem[]): Promise<boolean> {
    setBagError(null);
    try {
      const res = await fetch("/api/shop/bag", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
      });
      const json = await res.json();
      if (!res.ok) {
        setBagError(json.error || "Couldn't update your bag.");
        return false;
      }
      setBag(json.bag);
      setPlaced(null);
      return true;
    } catch {
      setBagError("Couldn't reach the store. Try again.");
      return false;
    }
  }

  async function checkout() {
    setCheckingOut(true);
    setBagError(null);
    try {
      const res = await fetch("/api/shop/checkout", { method: "POST" });
      const json = await res.json();
      if (!res.ok) setBagError(json.error || "Couldn't place the order.");
      else {
        setPlaced(json.order);
        setBag(json.bag);
      }
    } catch {
      setBagError("Couldn't reach the store. Try again.");
    }
    setCheckingOut(false);
  }

  const load = useCallback(async () => {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { profile: Profile | null; faceImage: string | null; products: PastCheck[] };
    setProfile(json.profile);
    setFaceImage(json.faceImage);
    setPast(json.products ?? []);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function readColours() {
    setReading(true);
    setProfileError(null);
    const res = await fetch("/api/profile", { method: "POST" });
    const json = await res.json();
    if (!res.ok) setProfileError(json.error || "Could not read your colours.");
    else setProfile(json.profile);
    setReading(false);
  }

  async function runTryOn(items: LookItem[], label: string, key: string) {
    setTrying(key);
    setTryError(null);
    const res = await fetch("/api/tryon", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items: items.map(({ category, color }) => ({ category, color })) }),
    });
    const json = await res.json();
    if (!res.ok) setTryError(json.error || "Try-on failed.");
    else {
      setTryOn({ previewUrl: json.previewUrl, beforeUrl: json.beforeUrl, label });
      document.getElementById("your-look")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
    setTrying(null);
  }

  const lookItems = Object.values(look);
  const makeup = (catalog ?? []).filter((product): product is MakeupProduct => product.kind === "makeup");
  const skincare = (catalog ?? []).filter((product): product is SkincareProduct => product.kind === "skincare");

  return (
    <main className="space-y-8">
      <PageTitle
        kicker="Shop & try on"
        icon="retail"
        title="Try it on your face before you buy."
        aside={
          bag && bag.count > 0 ? (
            <a href="#bag" className={buttonClass("secondary", "md")}>
              <Icon name="retail" size={17} />
              Bag · {bag.count} · {inr(bag.total)}
            </a>
          ) : null
        }
      >
        Makeup shades are matched to your skin tone and tried on your own photo with YouCam Makeup VTO. Skincare claims are rendered on your face and measured. Then
        decide.
      </PageTitle>

      <Callout kind="info">
        Demo store with fictional brands. Products and prices come from the store API, and orders are recorded without taking payment. A retailer plugs its own
        catalogue into the same API.
      </Callout>
      {catalogError ? <Callout kind="danger">{catalogError}</Callout> : null}

      <FaceUpload image={faceImage} onDone={load} />

      {/* colour profile */}
      <Card className="grid items-center gap-6 p-6 md:grid-cols-[auto_1fr_auto] md:p-8">
        <div className="hidden md:block">
          <Face className="h-28 w-auto" />
        </div>
        <div>
          <CardLabel icon={<Icon name="sparkle" size={14} />}>Your colour profile</CardLabel>
          {profile ? (
            <div className="mt-4 flex flex-wrap gap-4">
              {(
                [
                  ["Skin", profile.skin],
                  ["Lips", profile.lip],
                  ["Eyes", profile.eye],
                  ["Brows", profile.brow],
                  ["Hair", profile.hair],
                ] as const
              )
                .filter(([, hex]) => hex)
                .map(([label, hex]) => (
                  <div key={label} className="flex items-center gap-2.5">
                    <span className="h-10 w-10 rounded-full border-4 border-card shadow-soft ring-1 ring-line" style={{ background: hex ?? undefined }} aria-hidden="true" />
                    <span className="leading-tight">
                      <span className="block text-sm font-medium">{label}</span>
                      <span className="num block font-mono text-xs text-quiet">{hex}</span>
                    </span>
                  </div>
                ))}
              {profile.undertone ? <StatusPill tone="clay">Undertone: {profile.undertone}</StatusPill> : null}
            </div>
          ) : (
            <p className="mt-2 max-w-xl leading-relaxed text-quiet">
              YouCam&apos;s Facial Color Tones Analyzer reads your skin, lip, eye and hair colours from your latest scan, so WorthIt can point at the shades closest to you.
            </p>
          )}
          {profileError ? <Callout kind="danger" className="mt-4">{profileError}</Callout> : null}
        </div>
        <Button variant={profile ? "secondary" : "accent"} onClick={readColours} disabled={reading || !faceImage} className="shrink-0">
          <Icon name="sparkle" size={17} />
          {reading ? "Reading…" : profile ? "Read again" : "Read my colours"}
        </Button>
      </Card>

      <section className="grid gap-6 xl:grid-cols-[1fr_360px]">
        <div className="space-y-8">
          {/* makeup */}
          <div>
            <p className="kicker text-clay">Makeup · Makeup VTO</p>
            <h2 className="mt-2 font-serif text-3xl">See the shade on your face</h2>
            {catalog == null && !catalogError ? <p className="mt-5 text-sm text-quiet">Loading the store…</p> : null}
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {makeup.map((product) => (
                <MakeupCard
                  key={product.id}
                  product={product}
                  profile={profile}
                  inLook={look[product.category]?.product === product.name ? look[product.category] : null}
                  busy={trying === product.id}
                  disabled={!faceImage || trying != null}
                  onAdd={(item) => updateBag([{ productId: item.productId, sku: item.sku, qty: 1 }])}
                  onTry={(item) => runTryOn([item], `${product.name} · ${item.shade}`, product.id)}
                  onToggleLook={(item) =>
                    setLook((current) => {
                      const next = { ...current };
                      if (next[item.category]?.color === item.color) delete next[item.category];
                      else next[item.category] = item;
                      return next;
                    })
                  }
                />
              ))}
            </div>
          </div>

          {/* skincare */}
          <div>
            <p className="kicker text-clay">Skincare · Skin Simulation + Skin Analysis</p>
            <h2 className="mt-2 font-serif text-3xl">Check the claim on your skin</h2>
            <p className="mt-2 max-w-2xl text-quiet">
              WorthIt renders what the label promises on your face, then measures it. If the change is inside your normal wobble, you would never see it.
            </p>
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {skincare.map((product) => (
                <SkincareCard
                  key={product.id}
                  product={product}
                  hasFace={Boolean(faceImage)}
                  onAdd={() => updateBag([{ productId: product.id, sku: product.sku, qty: 1 }])}
                  past={[...past].reverse().find((item) => item.name === product.name) ?? null}
                  verdict={sameActive(product.active, view?.trial?.active) ? view?.verdict?.kind ?? null : null}
                  onChecked={async () => {
                    await load();
                    await refresh();
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        {/* your look */}
        <aside id="your-look" className="scroll-mt-24 xl:sticky xl:top-5 xl:self-start">
          <Card className="p-6">
            <CardLabel icon={<Icon name="retail" size={14} />}>Your look</CardLabel>
            <h2 className="mt-2 font-serif text-2xl">{lookItems.length ? "Try everything together" : "Build a look"}</h2>
            {lookItems.length === 0 ? (
              <p className="mt-2 text-sm leading-relaxed text-quiet">Add shades from any makeup product. WorthIt tries the whole basket on your face in one go.</p>
            ) : (
              <ul className="mt-4 space-y-2">
                {lookItems.map((item) => (
                  <li key={item.category} className="flex items-center gap-3 rounded-2xl border border-line bg-paper/60 px-3 py-2">
                    <span className="h-7 w-7 shrink-0 rounded-full ring-1 ring-line" style={{ background: item.color }} aria-hidden="true" />
                    <span className="min-w-0 flex-1 text-sm leading-tight">
                      <span className="block font-medium">{item.product}</span>
                      <span className="text-quiet">{item.shade}</span>
                    </span>
                    <button
                      type="button"
                      aria-label={`Remove ${item.product}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-quiet hover:bg-ink/5 hover:text-ink"
                      onClick={() =>
                        setLook((current) => {
                          const next = { ...current };
                          delete next[item.category];
                          return next;
                        })
                      }
                    >
                      <Icon name="close" size={14} />
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <Button
              variant="accent"
              className="mt-4 w-full"
              disabled={lookItems.length === 0 || !faceImage || trying != null}
              onClick={() => runTryOn(lookItems, `Full look · ${lookItems.length} item${lookItems.length === 1 ? "" : "s"}`, "look")}
            >
              <Icon name="sparkle" size={17} />
              {trying === "look" ? "Trying it all on…" : `Try the whole look${lookItems.length ? ` (${lookItems.length})` : ""}`}
            </Button>
            {lookItems.length > 0 ? (
              <AddToBag
                className="mt-2"
                label={`Add the look to bag · ${inr(lookItems.reduce((sum, item) => sum + (makeup.find((product) => product.id === item.productId)?.price ?? 0), 0))}`}
                onAdd={() => updateBag(lookItems.map((item) => ({ productId: item.productId, sku: item.sku, qty: 1 })))}
              />
            ) : null}

            {trying ? (
              <p className="mt-4 flex items-center gap-2 text-sm text-quiet" aria-live="polite">
                <span className="h-2 w-2 animate-pulse-dot rounded-full bg-clay" />
                YouCam is applying it to your photo…
              </p>
            ) : null}
            {tryError ? <Callout kind="danger" className="mt-4">{tryError}</Callout> : null}
            {tryOn ? (
              <div className="mt-5">
                <Compare before={tryOn.beforeUrl} after={tryOn.previewUrl} beforeLabel="You" afterLabel="With it" />
                <p className="mt-2 text-xs text-quiet">{tryOn.label}. Drag to compare. A visual preview, not a promise of how it wears.</p>
              </div>
            ) : faceImage ? (
              <div className="mt-5 overflow-hidden rounded-3xl border border-line">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={`/api/images/${faceImage}`} alt="Your latest scan photo" className="block w-full opacity-90" />
              </div>
            ) : null}
          </Card>
        </aside>
      </section>

      <BagSection bag={bag} placed={placed} catalog={catalog ?? []} busy={checkingOut} error={bagError} onChange={updateBag} onCheckout={checkout} />
    </main>
  );
}

function AddToBag({ label, onAdd, disabled, className }: { label: string; onAdd: () => Promise<boolean>; disabled?: boolean; className?: string }) {
  const [state, setState] = useState<"idle" | "adding" | "added">("idle");
  useEffect(() => {
    if (state !== "added") return;
    const timer = setTimeout(() => setState("idle"), 1800);
    return () => clearTimeout(timer);
  }, [state]);
  return (
    <Button
      variant="primary"
      size="sm"
      className={cx("w-full", className)}
      disabled={disabled || state === "adding"}
      onClick={async () => {
        setState("adding");
        setState((await onAdd()) ? "added" : "idle");
      }}
    >
      <Icon name={state === "added" ? "check" : "retail"} size={15} />
      {state === "added" ? "Added to bag" : state === "adding" ? "Adding…" : label}
    </Button>
  );
}

function Listing({ product }: { product: CatalogProduct }) {
  return (
    <p className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1 text-sm text-quiet">
      <span className="num font-mono text-lg font-medium text-ink">{inr(product.price)}</span>
      <span>{product.size}</span>
      <span>
        ★ {product.rating.toFixed(1)} · {compact.format(product.reviews)} reviews
      </span>
    </p>
  );
}

function BagSection({
  bag,
  placed,
  catalog,
  busy,
  error,
  onChange,
  onCheckout,
}: {
  bag: PricedBag | null;
  placed: Order | null;
  catalog: CatalogProduct[];
  busy: boolean;
  error: string | null;
  onChange: (items: BagItem[]) => Promise<boolean>;
  onCheckout: () => void;
}) {
  const lines = bag?.lines ?? [];
  const toFree = bag && bag.shipping > 0 ? bag.freeShippingFrom - bag.subtotal : 0;
  const placedCount = (placed?.lines ?? []).reduce((sum, line) => sum + line.qty, 0);
  const testable = (placed?.lines ?? [])
    .map((line) => catalog.find((product) => product.id === line.productId))
    .filter((product): product is SkincareProduct => product?.kind === "skincare");

  return (
    <section id="bag" className="scroll-mt-24">
      <Card className="p-6 md:p-8">
        <CardLabel icon={<Icon name="retail" size={14} />}>Your bag</CardLabel>
        <h2 className="mt-2 font-serif text-3xl">{lines.length ? `${bag!.count} item${bag!.count === 1 ? "" : "s"}` : placed ? "Order placed" : "Nothing in your bag yet"}</h2>

        {placed ? (
          <div className="mt-5 rounded-2xl border border-sage/30 bg-sage/[0.06] px-4 py-4">
            <p className="font-mono text-xs font-semibold tracking-wider text-sage">ORDER {placed.number} PLACED</p>
            <p className="mt-1 text-sm leading-relaxed text-ink/85">
              {placedCount} item{placedCount === 1 ? "" : "s"} · {inr(placed.total)}. Demo store, so nothing was charged.
              {testable.length ? " When it arrives, find out if it actually works on your skin:" : null}
            </p>
            {testable.length ? (
              <div className="mt-3 flex flex-wrap gap-2">
                {testable.map((product) => (
                  <Link key={product.id} href={testHref(product)} className={buttonClass("secondary", "sm")}>
                    <Icon name="protocol" size={15} />
                    Test {product.name}
                  </Link>
                ))}
              </div>
            ) : null}
          </div>
        ) : null}

        {lines.length === 0 ? (
          placed ? null : <p className="mt-2 max-w-xl text-quiet">Try shades on your face and check claims on your skin, then add what passes.</p>
        ) : (
          <>
            <ul className="mt-5 divide-y divide-line rounded-2xl border border-line bg-paper/50">
              {lines.map((line) => (
                <li key={line.sku} className="flex flex-wrap items-center gap-3 px-4 py-3">
                  {line.color ? (
                    <span className="h-9 w-9 shrink-0 rounded-full ring-1 ring-line" style={{ background: line.color }} aria-hidden="true" />
                  ) : (
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-clay/10 text-clay" aria-hidden="true">
                      <Icon name="sparkle" size={16} />
                    </span>
                  )}
                  <span className="min-w-0 flex-1 leading-tight">
                    <span className="block text-xs uppercase tracking-wider text-quiet">{line.brand}</span>
                    <span className="block font-medium">{line.name}</span>
                    <span className="text-sm text-quiet">
                      {line.variant} · {inr(line.unitPrice)}
                    </span>
                  </span>
                  <span className="flex items-center gap-1 rounded-full border border-line bg-card">
                    <button
                      type="button"
                      aria-label={`One less ${line.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-quiet hover:bg-ink/5 hover:text-ink"
                      onClick={() => void onChange([{ productId: line.productId, sku: line.sku, qty: -1 }])}
                    >
                      −
                    </button>
                    <span className="num w-6 text-center font-mono text-sm">{line.qty}</span>
                    <button
                      type="button"
                      aria-label={`One more ${line.name}`}
                      className="flex h-8 w-8 items-center justify-center rounded-full text-lg text-quiet hover:bg-ink/5 hover:text-ink disabled:opacity-40"
                      disabled={line.qty >= 10}
                      onClick={() => void onChange([{ productId: line.productId, sku: line.sku, qty: 1 }])}
                    >
                      +
                    </button>
                  </span>
                  <span className="num w-20 text-right font-mono font-medium">{inr(line.lineTotal)}</span>
                </li>
              ))}
            </ul>

            <dl className="mt-5 space-y-1.5 text-sm">
              <div className="flex justify-between">
                <dt className="text-quiet">Subtotal</dt>
                <dd className="num font-mono">{inr(bag!.subtotal)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-quiet">Shipping</dt>
                <dd className="num font-mono">{bag!.shipping ? inr(bag!.shipping) : "Free"}</dd>
              </div>
              {toFree > 0 ? <p className="text-xs text-quiet">Add {inr(toFree)} more for free shipping.</p> : null}
              <div className="flex justify-between border-t border-line pt-2 text-base font-medium">
                <dt>Total</dt>
                <dd className="num font-mono">{inr(bag!.total)}</dd>
              </div>
            </dl>

            <Button variant="accent" size="lg" className="mt-5 w-full" disabled={busy} onClick={onCheckout}>
              <Icon name="check" size={18} />
              {busy ? "Placing your order…" : `Place order · ${inr(bag!.total)}`}
            </Button>
            <p className="mt-2 text-center text-xs text-quiet">Demo store: the order is recorded, no payment is taken.</p>
          </>
        )}
        {error ? <Callout kind="danger" className="mt-4">{error}</Callout> : null}
      </Card>
    </section>
  );
}

/** True when the product shares the active ingredient the user is already testing. */
function sameActive(productActive: string, trialActive: string | null | undefined): boolean {
  const mine = (trialActive ?? "").toLowerCase().trim();
  return mine.length >= 3 && (productActive.toLowerCase().includes(mine) || mine.includes(productActive.toLowerCase()));
}

function MakeupCard({
  product,
  profile,
  inLook,
  busy,
  disabled,
  onAdd,
  onTry,
  onToggleLook,
}: {
  product: MakeupProduct;
  profile: Profile | null;
  inLook: LookItem | null;
  busy: boolean;
  disabled: boolean;
  onAdd: (item: LookItem) => Promise<boolean>;
  onTry: (item: LookItem) => void;
  onToggleLook: (item: LookItem) => void;
}) {
  const reference = product.matchAgainst === "skin" ? profile?.skin : product.matchAgainst === "lip" ? profile?.lip : null;
  const best = useMemo(() => closestShade(product.shades, reference), [product.shades, reference]);
  const [picked, setPicked] = useState<number>(-1);
  const index = picked >= 0 ? picked : best >= 0 ? best : 0;
  const shade = product.shades[index];
  const item: LookItem = { category: product.category, color: shade.hex, shade: shade.name, product: product.name, productId: product.id, sku: shade.sku };
  const added = inLook?.color === shade.hex;

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs uppercase tracking-wider text-quiet">{product.brand}</p>
          <h3 className="font-serif text-xl">{product.name}</h3>
          <p className="text-sm text-quiet">{product.blurb}</p>
          <Listing product={product} />
        </div>
        <span className="h-12 w-12 shrink-0 rounded-2xl ring-1 ring-line" style={{ background: shade.hex }} aria-hidden="true" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label={`${product.name} shades`}>
        {product.shades.map((option, i) => (
          <button
            key={option.hex}
            type="button"
            role="radio"
            aria-checked={i === index}
            aria-label={`${option.name}${i === best ? ", closest to you" : ""}`}
            title={option.name}
            onClick={() => setPicked(i)}
            className={cx(
              "relative h-9 w-9 rounded-full border-2 transition",
              i === index ? "border-ink scale-110" : "border-card hover:scale-105",
              "ring-1 ring-line",
            )}
            style={{ background: option.hex }}
          >
            {i === best ? <span className="absolute -right-1 -top-1 h-3.5 w-3.5 rounded-full border-2 border-card bg-sage" aria-hidden="true" /> : null}
          </button>
        ))}
      </div>
      <p className="mt-3 text-sm">
        <span className="font-medium">{shade.name}</span>{" "}
        {index === best ? (
          <span className="text-sage">· closest to your {product.matchAgainst === "lip" ? "natural lip colour" : "skin tone"}</span>
        ) : best < 0 && product.matchAgainst ? (
          <span className="text-quiet">· read your colours for a match</span>
        ) : null}
      </p>

      <div className="mt-auto grid gap-2 pt-5">
        <Button variant="secondary" size="sm" className="w-full" disabled={disabled} onClick={() => onTry(item)}>
          <Icon name="camera" size={15} />
          {busy ? "Trying…" : "Try on"}
        </Button>
        <Button variant="ghost" size="sm" className={cx("w-full border", added ? "border-sage/40 text-sage" : "border-line")} onClick={() => onToggleLook(item)}>
          <Icon name={added ? "check" : "sparkle"} size={15} />
          {added ? "In your look" : "Add to look"}
        </Button>
        <AddToBag label={`Add ${shade.name} to bag`} onAdd={() => onAdd(item)} />
      </div>
    </article>
  );
}

function SkincareCard({
  product,
  hasFace,
  past,
  verdict,
  onAdd,
  onChecked,
}: {
  product: SkincareProduct;
  hasFace: boolean;
  past: PastCheck | null;
  verdict: string | null;
  onAdd: () => Promise<boolean>;
  onChecked: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ line?: string; decision?: string | null; renderFile?: string | null; error?: string | null } | null>(null);
  const decision = result?.decision ?? past?.decision ?? null;

  async function check() {
    setBusy(true);
    const form = new FormData();
    form.set("claim", product.claim);
    form.set("name", product.name);
    form.set("concern", product.concern);
    const res = await fetch("/api/claim", { method: "POST", body: form });
    const json = (await res.json()) as { line?: string; note?: { decision: string | null; renderFile: string | null }; error?: string | null };
    setResult({
      line: json.line,
      decision: json.note?.decision ?? null,
      renderFile: json.note?.renderFile ?? null,
      error: !res.ok || json.error ? json.error ?? "The claim could not be checked." : null,
    });
    setBusy(false);
    if (res.ok) await onChecked();
  }

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-card p-5 shadow-soft">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill tone="ink" dot={false} className="capitalize">
          {product.active}
        </StatusPill>
        <StatusPill tone="ink" dot={false}>
          for {product.concern === "pore" ? "pores" : product.concern}
        </StatusPill>
      </div>
      <p className="mt-3 text-xs uppercase tracking-wider text-quiet">{product.brand}</p>
      <h3 className="font-serif text-xl">{product.name}</h3>
      <p className="text-sm text-quiet">{product.blurb}</p>
      <Listing product={product} />
      <blockquote className="mt-3 rounded-2xl border border-line bg-paper/60 px-4 py-3 text-[15px] italic text-ink/85">“{product.claim}”</blockquote>

      {verdict ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <StatusPill tone={verdictTone(verdict)}>Your test: {verdictLabel(verdict)}</StatusPill>
        </p>
      ) : null}

      {result?.renderFile ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={`/api/images/${result.renderFile}`} alt="Claim rendered on your photo" className="mt-3 w-full rounded-2xl border border-line" />
      ) : null}
      {decision === "skip" || decision === "test" || decision === "unmeasured" ? (
        <div
          className={cx(
            "mt-3 rounded-2xl border px-4 py-3",
            decision === "skip" ? "border-rose/30 bg-rose/[0.06]" : decision === "test" ? "border-sage/30 bg-sage/[0.06]" : "border-line bg-paper/60",
          )}
        >
          <p className={cx("font-mono text-xs font-semibold tracking-wider", decision === "skip" ? "text-rose" : decision === "test" ? "text-sage" : "text-quiet")}>
            {decision === "skip" ? "SKIP" : decision === "test" ? "TEST IT" : "NOT MEASURED YET"}
          </p>
          <p className="mt-1 text-sm leading-relaxed text-ink/85">
            {result?.line ??
              (past?.measuredDelta != null && past.mdc != null
                ? `Last check: the render moved it by ${past.measuredDelta >= 0 ? "+" : ""}${past.measuredDelta.toFixed(1)}, your normal wobble is ±${past.mdc.toFixed(1)}.`
                : "From your last check.")}
          </p>
        </div>
      ) : null}
      {result?.error ? <Callout kind="warn" className="mt-3">{result.error}</Callout> : null}

      <div className="mt-auto grid gap-2 pt-5">
        <Button variant="secondary" size="sm" className="w-full" disabled={busy || !hasFace} onClick={check}>
          <Icon name="sparkle" size={15} />
          {busy ? "Rendering and measuring…" : decision ? "Check again" : "Check on my face"}
        </Button>
        <AddToBag label={`Add to bag · ${inr(product.price)}`} onAdd={onAdd} />
        <Link href={testHref(product)} className={buttonClass("ghost", "sm", "w-full border border-line")}>
          <Icon name="protocol" size={15} />
          Bought it? Test it
        </Link>
      </div>
    </article>
  );
}

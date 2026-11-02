"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
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
import { closestShade, MAKEUP, SKINCARE, type MakeupProduct, type SkincareProduct } from "@/lib/shop/catalog";

type Profile = { skin: string | null; lip: string | null; eye: string | null; brow: string | null; hair: string | null; undertone: string | null };
type PastCheck = { name: string; decision: string | null; measuredDelta: number | null; mdc: number | null };
type LookItem = { category: MakeupProduct["category"]; color: string; shade: string; product: string };
type TryOn = { previewUrl: string; beforeUrl: string; label: string };

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

  return (
    <main className="space-y-8">
      <PageTitle kicker="Shop & try on" icon="retail" title="Try it on your face before you buy.">
        Makeup shades are matched to your skin tone and tried on your own photo with YouCam Makeup VTO. Skincare claims are rendered on your face and measured. Then
        decide.
      </PageTitle>

      <Callout kind="info">Demo shelf: generic products with no brands or prices. In a real store, this list comes from the retailer&apos;s catalogue.</Callout>

      {!faceImage ? (
        <Callout kind="warn">
          Try-ons and claim checks use your latest scan photo.{" "}
          <Link href="/scan" className="font-medium text-clay underline">
            Take a scan first
          </Link>
          .
        </Callout>
      ) : null}

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
            <div className="mt-5 grid gap-5 md:grid-cols-2">
              {MAKEUP.map((product) => (
                <MakeupCard
                  key={product.id}
                  product={product}
                  profile={profile}
                  inLook={look[product.category]?.product === product.name ? look[product.category] : null}
                  busy={trying === product.id}
                  disabled={!faceImage || trying != null}
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
              {SKINCARE.map((product) => (
                <SkincareCard
                  key={product.id}
                  product={product}
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
    </main>
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
  onTry,
  onToggleLook,
}: {
  product: MakeupProduct;
  profile: Profile | null;
  inLook: LookItem | null;
  busy: boolean;
  disabled: boolean;
  onTry: (item: LookItem) => void;
  onToggleLook: (item: LookItem) => void;
}) {
  const reference = product.matchAgainst === "skin" ? profile?.skin : product.matchAgainst === "lip" ? profile?.lip : null;
  const best = useMemo(() => closestShade(product.shades, reference), [product.shades, reference]);
  const [picked, setPicked] = useState<number>(-1);
  const index = picked >= 0 ? picked : best >= 0 ? best : 0;
  const shade = product.shades[index];
  const item: LookItem = { category: product.category, color: shade.hex, shade: shade.name, product: product.name };
  const added = inLook?.color === shade.hex;

  return (
    <article className="flex flex-col rounded-3xl border border-line bg-card p-5 shadow-soft">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h3 className="font-serif text-xl">{product.name}</h3>
          <p className="text-sm text-quiet">{product.blurb}</p>
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
        <Button variant={added ? "primary" : "ghost"} size="sm" className={cx("w-full", !added && "border border-line")} onClick={() => onToggleLook(item)}>
          <Icon name={added ? "check" : "retail"} size={15} />
          {added ? "In your look" : "Add to look"}
        </Button>
      </div>
    </article>
  );
}

function SkincareCard({
  product,
  past,
  verdict,
  onChecked,
}: {
  product: SkincareProduct;
  past: PastCheck | null;
  verdict: string | null;
  onChecked: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<{ line?: string; decision?: string | null; error?: string | null } | null>(null);
  const decision = result?.decision ?? past?.decision ?? null;
  const protocolHref = `/protocol?product=${encodeURIComponent(product.name)}&active=${encodeURIComponent(product.active)}&concern=${product.concern}`;

  async function check() {
    setBusy(true);
    const form = new FormData();
    form.set("claim", product.claim);
    form.set("name", product.name);
    form.set("concern", product.concern);
    const res = await fetch("/api/claim", { method: "POST", body: form });
    const json = (await res.json()) as { line?: string; note?: { decision: string | null }; error?: string | null };
    setResult({ line: json.line, decision: json.note?.decision ?? null, error: !res.ok || json.error ? json.error ?? "The claim could not be checked." : null });
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
      <h3 className="mt-3 font-serif text-xl">{product.name}</h3>
      <p className="text-sm text-quiet">{product.blurb}</p>
      <blockquote className="mt-3 rounded-2xl border border-line bg-paper/60 px-4 py-3 text-[15px] italic text-ink/85">“{product.claim}”</blockquote>

      {verdict ? (
        <p className="mt-3 flex items-center gap-2 text-sm">
          <StatusPill tone={verdictTone(verdict)}>Your test: {verdictLabel(verdict)}</StatusPill>
        </p>
      ) : null}

      {decision === "skip" || decision === "test" ? (
        <div className={cx("mt-3 rounded-2xl border px-4 py-3", decision === "skip" ? "border-rose/30 bg-rose/[0.06]" : "border-sage/30 bg-sage/[0.06]")}>
          <p className={cx("font-mono text-xs font-semibold tracking-wider", decision === "skip" ? "text-rose" : "text-sage")}>{decision === "skip" ? "SKIP" : "TEST IT"}</p>
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
        <Button variant="secondary" size="sm" className="w-full" disabled={busy} onClick={check}>
          <Icon name="sparkle" size={15} />
          {busy ? "Rendering and measuring…" : decision ? "Check again" : "Check on my face"}
        </Button>
        <Link href={protocolHref} className={buttonClass("ghost", "sm", "w-full border border-line")}>
          <Icon name="protocol" size={15} />
          Bought it? Test it
        </Link>
      </div>
    </article>
  );
}

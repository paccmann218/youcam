"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { ConfoundersMini } from "@/components/illustrations/Mini";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";

function iconFor(name: string): IconName {
  if (name.includes("sleep")) return "bed";
  if (name.includes("stress") || name.includes("RMSSD")) return "heart";
  if (name.includes("touch")) return "hands";
  if (name.includes("humid")) return "droplet";
  if (name.includes("cycle")) return "calendar";
  if (name.includes("product")) return "claim";
  return "breakout";
}

export default function BreakoutPage() {
  const { view, refresh } = useProof();
  const [line, setLine] = useState<string | null>(null);
  const [ranked, setRanked] = useState<{ name: string; pull: number; unusual: number }[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!view) return null;
  const maxPull = ranked && ranked.length ? Math.max(...ranked.map((item) => Math.abs(item.pull)), 0.001) : 1;
  return (
    <main className="space-y-8">
      <PageTitle
        kicker="Why did I break out?"
        icon="breakout"
        title="Was it your product, or something else?"
        aside={
          <Button
            variant="accent"
            size="lg"
            disabled={busy}
            onClick={async () => {
              setError(null);
              setBusy(true);
              const res = await fetch("/api/breakout", { method: "POST" });
              const json = await res.json();
              if (!res.ok) setError(json.error || "No ranking.");
              else {
                setLine(json.line);
                setRanked(json.attribution?.ranked ?? []);
                await refresh();
              }
              setBusy(false);
            }}
          >
            <Icon name="breakout" size={18} />
            {busy ? "Checking…" : "Check this morning"}
          </Button>
        }
      >
        When your acne score drops past your normal wobble, WorthIt ranks what else changed: sleep, stress, face touching, humidity, and whether you used the product. It never diagnoses a spot.
      </PageTitle>

      {error ? <Callout kind="warn">{error}</Callout> : null}

      {line ? (
        <Card tone="clay" className="p-6 md:p-8">
          <p className="kicker text-clay">This morning</p>
          <p className="text-balance mt-3 max-w-3xl font-serif text-3xl leading-snug md:text-4xl">{line}</p>
        </Card>
      ) : null}

      {ranked && ranked.length > 0 ? (
        <Card className="p-6 md:p-8">
          <div className="flex items-end justify-between gap-4">
            <h2 className="font-serif text-2xl">Most likely causes</h2>
            <p className="text-xs text-quiet">longer bar = bigger influence · z = how unusual that day was</p>
          </div>
          <ul className="mt-6 space-y-4">
            {ranked.map((item, index) => (
              <li key={item.name} className="grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2 sm:grid-cols-[auto_10rem_1fr_auto]">
                <span className={`flex h-10 w-10 items-center justify-center rounded-2xl ${index === 0 ? "bg-clay/15 text-clay" : "bg-ink/5 text-quiet"}`}>
                  <Icon name={iconFor(item.name)} size={18} />
                </span>
                <span className="font-medium capitalize">{item.name}</span>
                <span className="col-span-2 h-3 rounded-full bg-line/60 sm:col-span-1">
                  <span
                    className={`block h-full rounded-full ${index === 0 ? "bg-clay" : "bg-ink/35"}`}
                    style={{ width: `${Math.max(4, (Math.abs(item.pull) / maxPull) * 100)}%` }}
                  />
                </span>
                <span className="num col-span-2 font-mono text-sm text-quiet sm:col-span-1 sm:text-right">
                  {item.pull.toFixed(1)} · z {item.unusual.toFixed(1)}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      ) : !line && !error ? (
        <Empty art={<ConfoundersMini className="h-24" />} title="Nothing checked yet.">
          After a morning scan, check it here. Sleep and stress come from the watch and Health Connect, touches from Hands Off, humidity from your place in Lab.
        </Empty>
      ) : null}
    </main>
  );
}

"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { cx } from "@/components/ui/cx";
import { Input } from "@/components/ui/field";
import { Stat } from "@/components/ui/stat";

export default function LabPage() {
  const { view, refresh } = useProof();
  const [place, setPlace] = useState("");
  const [note, setNote] = useState<string | null>(null);
  if (!view) return null;
  const g = view.gestures;
  const labeled = g.faceFace + g.faceOther + g.otherFace + g.otherOther;
  const precision = g.faceFace + g.otherFace === 0 ? null : g.faceFace / (g.faceFace + g.otherFace);
  const recall = g.faceFace + g.faceOther === 0 ? null : g.faceFace / (g.faceFace + g.faceOther);
  return (
    <main className="space-y-8">
      <PageTitle kicker="Lab numbers" icon="lab" title="Accuracy, measured.">
        Scan speed, Hands Off accuracy and the light test. Each number appears only after its test has actually run, so it is safe to quote.
      </PageTitle>

      <section className="grid gap-5 sm:grid-cols-2 xl:grid-cols-4">
        <Stat
          label="Scan latency"
          icon={<Icon name="scan" size={14} />}
          value={view.latency.mean == null ? null : view.latency.mean.toFixed(0)}
          unit="ms mean"
          hint={view.latency.mean == null ? null : `p95 ${view.latency.p95?.toFixed(0)} ms · n ${view.latency.n}`}
        />
        <Stat
          label="Hands off precision"
          icon={<Icon name="hands" size={14} />}
          value={labeled === 0 || precision == null ? null : precision.toFixed(2)}
          hint={labeled === 0 ? null : `n ${labeled}`}
        />
        <Stat label="Hands off recall" icon={<Icon name="hands" size={14} />} value={labeled === 0 || recall == null ? null : recall.toFixed(2)} hint={labeled === 0 ? null : `n ${labeled}`} />
        <Stat
          label="Lighting"
          icon={<Icon name="light" size={14} />}
          value={view.lighting.length === 0 ? null : String(view.lighting.length)}
          unit="concerns"
          hint={view.lighting.length === 0 ? null : "see Light"}
        />
      </section>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6 md:p-8">
          <p className="kicker text-quiet">Gesture matrix</p>
          {labeled === 0 ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full border border-dashed border-line px-3 py-1 text-sm text-quiet">not measured</p>
          ) : (
            <div className="mt-5">
              <div className="grid grid-cols-[5.5rem_1fr_1fr] gap-2 text-center text-sm">
                <span />
                <span className="text-xs uppercase tracking-wider text-quiet">predicted face</span>
                <span className="text-xs uppercase tracking-wider text-quiet">predicted other</span>
                <span className="self-center text-left text-xs uppercase tracking-wider text-quiet">was face</span>
                <Cell value={g.faceFace} good />
                <Cell value={g.faceOther} />
                <span className="self-center text-left text-xs uppercase tracking-wider text-quiet">was other</span>
                <Cell value={g.otherFace} />
                <Cell value={g.otherOther} good />
              </div>
            </div>
          )}
        </Card>

        <Card className="p-6 md:p-8">
          <p className="kicker flex items-center gap-2 text-quiet">
            <Icon name="pin" size={14} />
            Place, for humidity
          </p>
          <form
            className="mt-4 flex gap-2"
            onSubmit={async (event) => {
              event.preventDefault();
              const res = await fetch("/api/place", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ place }),
              });
              const json = await res.json();
              setNote(res.ok ? `${json.place.name} · humidity ${json.humidity ?? "unavailable"}` : json.error);
              await refresh();
            }}
          >
            <Input value={place} onChange={(e) => setPlace(e.target.value)} placeholder="City" className="mt-0" aria-label="City, for humidity" />
            <Button type="submit" variant="secondary" className="shrink-0">
              Set
            </Button>
          </form>
          {note ? <p className="mt-3 text-sm text-quiet">{note}</p> : null}
          {view.user.place ? (
            <p className="mt-3 inline-flex items-center gap-2 rounded-full bg-paper/70 px-3 py-1 text-sm">
              <Icon name="pin" size={14} className="text-clay" />
              Place on file: {view.user.place}
            </p>
          ) : null}
        </Card>
      </section>
    </main>
  );
}

function Cell({ value, good = false }: { value: number; good?: boolean }) {
  return (
    <span className={cx("num rounded-2xl border px-3 py-5 font-mono text-3xl font-medium", good ? "border-sage/30 bg-sage/10 text-ink" : "border-line bg-paper/60 text-ink")}>
      {value}
    </span>
  );
}

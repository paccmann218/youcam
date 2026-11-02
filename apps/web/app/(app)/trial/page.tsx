"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Watch } from "@/components/illustrations/Watch";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { ButtonLink } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { LineChart } from "@/components/ui/line-chart";
import { Stat } from "@/components/ui/stat";
import { StatusPill, verdictLabel, verdictMeaning, verdictTone } from "@/components/ui/status";

type Power = {
  prior: { earliestDay: number | null };
  current: { earliestDay: number | null };
  designs: {
    beforeAfter: { earliestDay: number | null };
    splitFace: { earliestDay: number | null };
    note: string;
  };
  simulated: { day: number; raw: number; on: boolean }[];
  assumption: string;
  falseWorking: number;
  trials: number;
};

export default function TrialPage() {
  const { view } = useProof();
  const [power, setPower] = useState<Power | null>(null);
  const [wait, setWait] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!view?.powerInput) return;
    let cancel = false;
    setWait(true);
    fetch("/api/power")
      .then(async (res) => {
        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Could not compute the day.");
        if (!cancel) setPower(json);
      })
      .catch((err: Error) => {
        if (!cancel) setError(err.message);
      })
      .finally(() => {
        if (!cancel) setWait(false);
      });
    return () => {
      cancel = true;
    };
  }, [view?.powerInput]);

  if (!view) return null;
  const points = view.daily[view.trial?.concern ?? "acne"] ?? [];
  const tone = verdictTone(view.verdict?.kind);
  const earliest = power?.current.earliestDay ?? null;
  const trialDay = (() => {
    if (!view.trial) return null;
    const start = Date.parse(view.trial.startedOn);
    if (!Number.isFinite(start)) return null;
    return Math.max(1, Math.floor((Date.now() - start) / 86_400_000) + 1);
  })();
  return (
    <main className="space-y-8">
      <PageTitle
        kicker="Is it worth it?"
        icon="trial"
        title={view.trial ? view.trial.productName : "No product set up yet."}
        aside={
          !view.trial ? (
            <ButtonLink href="/protocol" variant="accent">
              <Icon name="protocol" size={18} />
              Set up product
            </ButtonLink>
          ) : null
        }
      >
        {view.trial
          ? `${view.trial.design === "split_face" ? "Tested on one side" : "Before vs after"} · ${view.trial.concern}. Left: your real mornings. Right: a simulation from your own wobble, showing when an honest answer becomes possible.`
          : "Tell WorthIt which product you are testing first. Until then there is nothing to judge."}
      </PageTitle>

      <Card tone={tone} className="grid items-center gap-6 p-6 md:grid-cols-[1fr_auto] md:p-8">
        <div>
          <div className="flex flex-wrap gap-2">
            <StatusPill tone={tone}>Verdict so far</StatusPill>
            {earliest ? <StatusPill tone="ink">earliest day {earliest}</StatusPill> : null}
            {power && power.prior.earliestDay && earliest && power.prior.earliestDay !== earliest ? (
              <StatusPill tone="clay">
                was day {power.prior.earliestDay}, now day {earliest}
              </StatusPill>
            ) : null}
          </div>
          <p className="text-balance mt-4 font-serif text-4xl font-medium leading-tight md:text-5xl">{verdictLabel(view.verdict?.kind)}</p>
          <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink/80">{verdictMeaning(view.verdict?.kind)}</p>
          {view.verdict?.line ? <p className="mt-3 max-w-2xl text-sm leading-relaxed text-quiet">Details: {view.verdict.line}</p> : null}
          {wait ? (
            <p className="mt-4 flex items-center gap-2 text-sm text-quiet" aria-live="polite">
              <span className="h-2 w-2 animate-pulse-dot rounded-full bg-clay" />
              Computing the earliest honest day from your noise.
            </p>
          ) : null}
          {error ? <Callout kind="danger" className="mt-4">{error}</Callout> : null}
        </div>
        {trialDay ? (
          <Watch screen="tile" day={trialDay} of={Math.max(earliest ?? 28, trialDay)} verdictDay={earliest} className="mx-auto h-44 w-auto" />
        ) : null}
      </Card>

      <section className="grid gap-5 xl:grid-cols-2">
        <LineChart
          title="Your mornings"
          series="a"
          points={points.map((point, index) => ({ x: index + 1, y: point.raw, on: point.on, label: point.day }))}
          baseline={view.powerInput?.baseline}
          mdc={view.powerInput?.mdc}
          emptyText="No mornings yet. Scan once a day after the noise floor."
        />
        <LineChart
          title="Simulated from your noise"
          series="b"
          dashed
          points={(power?.simulated ?? []).map((point) => ({ x: point.day, y: point.raw, on: point.on }))}
          baseline={view.powerInput?.baseline}
          mdc={view.powerInput?.mdc}
          emptyText={view.powerInput ? "Simulating…" : "Measure a noise floor first. A simulation without one would be made up."}
        />
      </section>

      {power ? (
        <section className="grid gap-5 md:grid-cols-3">
          <Stat label="Days needed · before vs after" value={power.designs.beforeAfter.earliestDay ?? "beyond search"} unit={power.designs.beforeAfter.earliestDay ? "days" : undefined} />
          <Stat label="Days needed · one side" value={power.designs.splitFace.earliestDay ?? "beyond search"} unit={power.designs.splitFace.earliestDay ? "days" : undefined} tone="sage" />
          <Card>
            <p className="kicker text-quiet">Halves</p>
            <p className="mt-3 leading-relaxed text-ink/85">
              {view.splitLive ? "Live halves are in the ledger." : "Live halves are not in the ledger yet, so one-side stays simulated."}
            </p>
            {view.splitVerdict ? <p className="mt-3 text-sm text-quiet">One-side verdict: {view.splitVerdict.line}</p> : null}
          </Card>
        </section>
      ) : null}

      {power ? (
        <Callout kind="info">
          <p>{power.assumption}</p>
          <p className="mt-2 text-quiet">{power.designs.note}</p>
        </Callout>
      ) : null}
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import { NoiseMini } from "@/components/illustrations/Mini";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Callout } from "@/components/ui/callout";
import { Empty } from "@/components/ui/empty";
import { Stat } from "@/components/ui/stat";

type Power = {
  current: { earliestDay: number | null; trials: number };
  designs: { beforeAfter: { earliestDay: number | null }; splitFace: { earliestDay: number | null } };
  falseWorking: number;
  trials: number;
  assumption: string;
};

export default function RetailPage() {
  const { view } = useProof();
  const [power, setPower] = useState<Power | null>(null);
  useEffect(() => {
    if (!view?.powerInput) return;
    fetch("/api/power")
      .then((res) => res.json())
      .then(setPower)
      .catch(() => setPower(null));
  }, [view?.powerInput]);
  if (!view) return null;
  const day = power?.current.earliestDay;
  return (
    <main className="space-y-8">
      <PageTitle kicker="For brands" icon="briefcase" title="What it would take to back a claim.">
        Based on the real scan noise on this face: how many days a personal test would need to clear the same bar WorthIt uses for &ldquo;worth it&rdquo;. A sizing tool for brands, not an exposé.
      </PageTitle>
      {!view.powerInput ? (
        <Empty art={<NoiseMini className="h-24" />} title="Take your 5 baseline scans first.">
          A brand number without one would be made up.
        </Empty>
      ) : null}
      {power ? (
        <>
          <div className="grid gap-5 md:grid-cols-3">
            <Stat size="lg" tone="clay" label="Days, one face" value={day == null ? "beyond search" : String(day)} unit={day == null ? undefined : "days"} />
            <Stat size="lg" label="Before / after" value={power.designs.beforeAfter.earliestDay == null ? "—" : String(power.designs.beforeAfter.earliestDay)} unit={power.designs.beforeAfter.earliestDay == null ? undefined : "days"} />
            <Stat size="lg" tone="sage" label="One side" value={power.designs.splitFace.earliestDay == null ? "—" : String(power.designs.splitFace.earliestDay)} unit={power.designs.splitFace.earliestDay == null ? undefined : "days"} />
          </div>
          <Callout kind="info">
            {power.assumption} False &ldquo;working&rdquo; rate on pure noise, {power.trials} trials:{" "}
            <span className="num font-mono font-medium">{(power.falseWorking * 100).toFixed(1)}%</span>.
          </Callout>
        </>
      ) : null}
    </main>
  );
}

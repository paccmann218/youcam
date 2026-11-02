"use client";

import { CaptureForm } from "@/components/capture";
import { LightsMini } from "@/components/illustrations/Mini";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";

export default function LightingPage() {
  const { view, refresh } = useProof();
  if (!view) return null;
  const maxSpread = Math.max(
    1,
    ...view.lighting.flatMap((item) => [item.ungated.spread ?? 0, item.gated.spread ?? 0]),
  );
  return (
    <main className="space-y-8">
      <PageTitle kicker="Light test" icon="light" title="See how lighting fools your mirror.">
        Under each of three lights, take one plain photo and one Camera Kit scan. If the Camera Kit scans spread less, that is why WorthIt insists on it.
      </PageTitle>

      <section className="grid gap-5 lg:grid-cols-[.9fr_1.1fr]">
        <Card className="p-6 md:p-8">
          <div className="mb-6 flex items-center gap-4 rounded-2xl bg-paper/60 p-4">
            <LightsMini className="h-16 w-auto shrink-0" />
            <p className="text-sm leading-relaxed text-quiet">Name each light (bathroom, window, lamp), then take one plain photo and one Camera Kit scan under it.</p>
          </div>
          <CaptureForm purpose="lighting" onDone={refresh} />
        </Card>

        <div className="space-y-4">
          {view.lighting.length === 0 ? (
            <Empty art={<LightsMini className="h-20" />} title="No lighting set yet.">
              Spreads appear here per concern once two photos exist for a group.
            </Empty>
          ) : (
            view.lighting.map((item) => (
              <Card key={item.concern}>
                <p className="font-medium capitalize">{item.concern}</p>
                <div className="mt-4 space-y-3">
                  <SpreadBar label="Ungated" spread={item.ungated.spread} n={item.ungated.n} max={maxSpread} tone="bg-ink/40" />
                  <SpreadBar label="Camera Kit" spread={item.gated.spread} n={item.gated.n} max={maxSpread} tone="bg-clay" />
                </div>
              </Card>
            ))
          )}
        </div>
      </section>
    </main>
  );
}

function SpreadBar({ label, spread, n, max, tone }: { label: string; spread: number | null; n: number; max: number; tone: string }) {
  return (
    <div className="grid grid-cols-[6.5rem_1fr_auto] items-center gap-3 text-sm">
      <span className="text-quiet">{label}</span>
      <span className="h-3 rounded-full bg-line/60">
        {spread != null ? <span className={`block h-full rounded-full ${tone}`} style={{ width: `${Math.max(3, (spread / max) * 100)}%` }} /> : null}
      </span>
      <span className="num w-24 text-right font-mono">
        {spread == null ? "—" : spread.toFixed(1)} <span className="text-quiet">({n})</span>
      </span>
    </div>
  );
}

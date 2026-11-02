"use client";

import Link from "next/link";
import { BRAND } from "@/components/brand";
import { Icon } from "@/components/icons";
import { ScanMini } from "@/components/illustrations/Mini";
import { Watch } from "@/components/illustrations/Watch";
import { PhoneSleepSync } from "@/components/phone-sleep";
import { useProof } from "@/components/provider";
import { SetupSteps, type SetupStep } from "@/components/setup-steps";
import { PageTitle } from "@/components/shell";
import { ButtonLink } from "@/components/ui/button";
import { Card, CardLabel } from "@/components/ui/card";
import { cx } from "@/components/ui/cx";
import { Empty } from "@/components/ui/empty";
import { NoiseGauge } from "@/components/ui/noise-gauge";
import { StatusPill, verdictLabel, verdictMeaning, verdictTone } from "@/components/ui/status";

const BASELINE_SCANS = 5;

export default function TodayPage() {
  const { view } = useProof();
  if (!view) return null;
  const verdict = view.verdict;
  const tone = verdictTone(verdict?.kind);
  const mdcFor = (concern: string) => view.noise.find((item) => item.concern === concern)?.mdc95 ?? null;

  const baselineCount = view.noise.reduce((most, item) => Math.max(most, item.n), 0);
  const focus = view.trial?.concern ?? "acne";
  const mornings = (view.daily[focus] ?? []).length;
  const watchSeen = view.watchSeenAt != null || view.lastNight != null || view.faceTouchesToday > 0;
  const decided = verdict?.kind === "working" || verdict?.kind === "no_effect" || verdict?.kind === "wrong_way";

  const steps: SetupStep[] = [
    {
      key: "product",
      icon: "protocol",
      title: "Pick the product you're testing",
      detail: view.trial ? `${view.trial.productName}, for ${view.trial.concern}.` : "Tell us the serum or cream and what it should improve.",
      done: Boolean(view.trial),
      href: "/protocol",
      cta: "Set up product",
    },
    {
      key: "baseline",
      icon: "scan",
      title: "Take 5 baseline scans",
      detail:
        baselineCount >= BASELINE_SCANS
          ? "Your normal day-to-day wobble is measured."
          : `Five quick scans in a row teach ${BRAND} your normal wobble.${baselineCount > 0 ? ` ${baselineCount} of 5 so far.` : ""}`,
      done: baselineCount >= BASELINE_SCANS,
      href: "/scan",
      cta: "Start baseline",
    },
    {
      key: "watch",
      icon: "watch",
      title: "Connect your watch",
      detail: watchSeen ? "Your watch is talking to this laptop." : "Open WorthIt on your Galaxy Watch. No pairing: it connects on its own.",
      done: watchSeen,
      href: "/hands",
      cta: "Connect watch",
      optional: true,
    },
    {
      key: "mornings",
      icon: "sun",
      title: "Scan every morning",
      detail: mornings > 0 ? `${mornings} morning${mornings === 1 ? "" : "s"} logged. Same light, same time.` : "One quick scan a day, same spot, same time.",
      done: mornings > 0,
      href: "/scan",
      cta: "Scan this morning",
    },
    {
      key: "verdict",
      icon: "trial",
      title: "Get your verdict",
      detail: decided ? verdictLabel(verdict?.kind) + "." : "Appears once a change clears your normal wobble.",
      done: decided,
      href: "/trial",
      cta: "See progress",
    },
  ];
  const setupDone = steps.every((step) => step.done || step.optional);

  return (
    <main className="space-y-8">
      <PageTitle
        kicker="Home"
        icon="home"
        title={view.trial ? `Is ${view.trial.productName} worth it?` : "Let's find out if your skincare is worth it."}
        aside={
          baselineCount >= BASELINE_SCANS && view.trial ? (
            <ButtonLink href="/scan" variant="accent">
              <Icon name="camera" size={18} />
              Scan this morning
            </ButtonLink>
          ) : null
        }
      >
        Scan once a morning in the same spot. Small changes inside your normal wobble don&apos;t count, and one morning is never a verdict.
      </PageTitle>

      {!setupDone ? <SetupSteps steps={steps} /> : null}

      <section className="grid gap-5 lg:grid-cols-[1.35fr_.65fr]">
        <div className="space-y-5">
          {verdict && verdict.kind !== "unidentified" ? (
          <Card tone={tone} className="overflow-hidden p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2">
              <StatusPill tone={tone} live={verdict?.kind === "too_early"}>
                Verdict so far
              </StatusPill>
              {view.trial ? (
                <StatusPill tone="ink" dot={false}>
                  {view.trial.design === "split_face" ? "Tested on one side" : "Before vs after"} · {view.trial.concern}
                </StatusPill>
              ) : null}
            </div>
            <p className="text-balance mt-5 font-serif text-4xl font-medium leading-tight md:text-5xl">{verdictLabel(verdict?.kind)}</p>
            <p className="mt-3 max-w-xl text-lg leading-relaxed text-ink/80">{verdictMeaning(verdict?.kind)}</p>
            {verdict?.line ? (
              <p className="mt-4 rounded-2xl border border-line bg-card/70 px-4 py-3 text-sm leading-relaxed text-quiet">
                <span className="font-medium text-ink">Details: </span>
                {verdict.line}
              </p>
            ) : null}
            <Link href="/trial" className="mt-5 inline-flex items-center gap-1.5 text-sm font-medium text-clay hover:underline">
              See the full progress chart <Icon name="arrow" size={14} />
            </Link>
          </Card>
          ) : null}

          <Card className="p-6 md:p-8">
            <div className="flex flex-wrap items-end justify-between gap-3">
              <div>
                <CardLabel icon={<Icon name="scan" size={14} />}>Latest scan</CardLabel>
                <h2 className="mt-2 font-serif text-2xl">How your skin scored</h2>
              </div>
              <p className="flex items-center gap-2 text-xs text-quiet">
                <span className="h-2.5 w-6 rounded-full bg-amber/20" aria-hidden="true" />
                shaded zone = normal wobble · higher score = healthier-looking
              </p>
            </div>
            {view.latest.length > 0 ? (
              <ul className="mt-6 grid gap-3 sm:grid-cols-2">
                {view.latest.map((item) => {
                  const mdc = mdcFor(item.concern);
                  const inside = item.delta != null && mdc != null && Math.abs(item.delta) <= mdc;
                  return (
                    <li key={item.concern} className="rounded-2xl border border-line bg-paper/50 p-4">
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="font-medium capitalize">{item.concern}</span>
                        <span className="num font-mono text-3xl font-medium">{item.raw.toFixed(1)}</span>
                      </div>
                      <div className="mt-3 flex items-center gap-3">
                        {item.delta != null ? (
                          <span
                            className={cx(
                              "num shrink-0 rounded-full px-2 py-0.5 font-mono text-xs",
                              inside ? "bg-amber/10 text-amber" : item.delta > 0 ? "bg-sage/10 text-sage" : "bg-rose/10 text-rose",
                            )}
                          >
                            {item.delta >= 0 ? "+" : ""}
                            {item.delta.toFixed(1)}
                          </span>
                        ) : null}
                        <NoiseGauge delta={item.delta} mdc={mdc} className="flex-1" />
                      </div>
                      <p className="mt-2.5 text-sm leading-snug text-quiet">{item.line}</p>
                    </li>
                  );
                })}
              </ul>
            ) : (
              <Empty className="mt-6" art={<ScanMini className="h-20" />} title="No scans yet.">
                Start with five quick scans in a row. They measure your normal wobble, so later changes mean something.
              </Empty>
            )}
          </Card>
        </div>

        <aside className="grid content-start gap-5 sm:grid-cols-2 lg:grid-cols-1">
          <Card className="flex items-center gap-4">
            <Watch screen="hands" count={view.faceTouchesToday} className="h-28 w-auto shrink-0" />
            <div className="min-w-0">
              <CardLabel icon={<Icon name="hands" size={14} />}>Face touches today</CardLabel>
              <p className="num mt-1 font-mono text-5xl font-medium">{view.faceTouchesToday}</p>
              <Link href="/hands" className="mt-1 inline-flex items-center gap-1 text-sm text-clay hover:underline">
                Live counter <Icon name="arrow" size={14} />
              </Link>
            </div>
          </Card>

          <Card>
            <CardLabel icon={<Icon name="bed" size={14} />}>Last night, from your watch</CardLabel>
            <div className="mt-3 grid grid-cols-3 gap-2">
              <Metric icon="bed" label="Sleep" value={view.lastNight?.sleepHours != null ? `${view.lastNight.sleepHours.toFixed(1)}h` : null} />
              <Metric icon="heart" label="Stress" value={view.lastNight?.rmssd != null ? view.lastNight.rmssd.toFixed(0) : null} />
              <Metric icon="droplet" label="Humidity" value={view.humidity != null ? `${view.humidity.toFixed(0)}%` : null} />
            </div>
            {view.lastNight?.sleepHours == null ? <p className="mt-3 text-sm text-quiet">No sleep synced yet. The phone app sends it from Health Connect.</p> : null}
            <PhoneSleepSync />
            <div className="mt-4 flex flex-wrap gap-2">
              <Check done={view.checkoffs.morning} label="Morning" />
              <Check done={view.checkoffs.evening} label="Used product" />
            </div>
          </Card>

          <Card tone={view.watchSeenAt ? "sage" : "ink"}>
            <CardLabel icon={<Icon name="watch" size={14} />}>Galaxy Watch</CardLabel>
            <div className="mt-3">
              <StatusPill tone={view.watchSeenAt ? "sage" : "ink"} live={Boolean(view.watchSeenAt)}>
                {view.watchSeenAt ? `Connected · last heard ${sinceText(view.watchSeenAt)}` : "Not heard from yet"}
              </StatusPill>
            </div>
            <p className="mt-3 text-sm leading-relaxed text-quiet">
              No pairing needed. Open WorthIt on the watch and it talks to this laptop directly. No watch? Everything else here still works.
            </p>
          </Card>

          <Card tone="sage">
            <CardLabel icon={<Icon name="retail" size={14} />}>Thinking of buying something?</CardLabel>
            <p className="mt-2 leading-relaxed text-ink/85">Try makeup shades on your face and check skincare claims against your own skin first.</p>
            <Link href="/shop" className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-clay hover:underline">
              Open the shop <Icon name="arrow" size={14} />
            </Link>
          </Card>
        </aside>
      </section>

      {view.noise.length > 0 ? (
        <section>
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="kicker text-clay">Your normal wobble</p>
              <h2 className="mt-2 font-serif text-3xl">What counts as a real change</h2>
              <p className="mt-2 max-w-xl text-quiet">A change smaller than this is the same as just retaking the photo.</p>
            </div>
            <p className="max-w-xs text-sm text-quiet md:text-right">Technically: MDC95 = 1.96 · √2 · SEM, from your back-to-back scans.</p>
          </div>
          <div className="mt-5 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
            {view.noise.map((item) => (
              <Card key={item.concern}>
                <p className="font-medium capitalize">{item.concern}</p>
                <p className="num mt-3 font-mono text-4xl font-medium">±{item.mdc95.toFixed(2)}</p>
                <p className="mt-2 text-sm text-quiet">
                  from {item.n} scans · average {item.mean.toFixed(1)}
                </p>
              </Card>
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}

function sinceText(iso: string): string {
  const minutes = Math.round((Date.now() - new Date(iso).getTime()) / 60_000);
  if (!Number.isFinite(minutes) || minutes < 1) return "just now";
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} h ago`;
  return `${Math.round(hours / 24)} d ago`;
}

function Metric({ icon, label, value }: { icon: "bed" | "heart" | "droplet"; label: string; value: string | null }) {
  return (
    <div className="rounded-2xl border border-line bg-paper/60 px-3 py-3">
      <Icon name={icon} size={16} className="text-clay" />
      <p className={cx("num mt-2 font-mono text-xl font-medium", value == null && "text-quiet/50")}>{value ?? "—"}</p>
      <p className="text-[11px] uppercase tracking-wider text-quiet">{label}</p>
    </div>
  );
}

function Check({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm",
        done ? "border-sage/30 bg-sage/10 text-sage" : "border-line text-quiet",
      )}
    >
      <Icon name={done ? "check" : "close"} size={14} strokeWidth={2} />
      {label} {done ? "done" : "not yet"}
    </span>
  );
}

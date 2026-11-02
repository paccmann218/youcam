"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { Watch } from "@/components/illustrations/Watch";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Card } from "@/components/ui/card";
import { cx } from "@/components/ui/cx";
import { StatusPill } from "@/components/ui/status";

function friendlyTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" });
}

export default function HandsPage() {
  const { view } = useProof();
  const [count, setCount] = useState(view?.faceTouchesToday ?? 0);
  const [last, setLast] = useState<string | null>(null);

  useEffect(() => {
    if (view) setCount(view.faceTouchesToday);
  }, [view]);

  useEffect(() => {
    const source = new EventSource("/api/events/stream");
    source.onmessage = (event) => {
      const data = JSON.parse(event.data) as { type?: string; createdAt?: string };
      if (data.type === "face_touch") {
        setCount((value) => value + 1);
        setLast(data.createdAt ?? new Date().toISOString());
      }
    };
    return () => source.close();
  }, []);

  return (
    <main className="space-y-8">
      <PageTitle kicker="Hands off" icon="hands" title="Hands off your face.">
        Most face touching happens without noticing. Each time you do it, your Galaxy Watch buzzes and this counter goes up, live. It is one of the things WorthIt checks after a breakout.
      </PageTitle>

      <Card className="overflow-hidden p-0" padded={false}>
        <div className="grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="p-6 md:p-10">
            <StatusPill tone={last ? "clay" : "ink"} live>
              {last ? `Last touch ${friendlyTime(last)}` : "Waiting for the watch"}
            </StatusPill>
            <p key={count} className="num mt-6 animate-pop font-mono text-[7rem] font-medium leading-none tracking-tight md:text-[9rem]">
              {count}
            </p>
            <p className="mt-2 text-lg text-quiet">face touches today</p>
          </div>
          <div className="relative flex justify-center bg-gradient-to-br from-peach/40 via-clay/10 to-transparent px-10 py-8 md:h-full md:items-center md:px-14">
            <div className="dotgrid absolute inset-0 opacity-50" aria-hidden="true" />
            <Watch screen="hands" count={count} ripple={last ? "once" : "loop"} buzzKey={count} className={cx("relative h-64 w-auto md:h-72", last && "buzz")} key={`w-${count}`} />
          </div>
        </div>
      </Card>

      <Checkoffs />
    </main>
  );
}

function Checkoffs() {
  const [note, setNote] = useState<string | null>(null);
  async function mark(slot: "morning" | "evening") {
    const res = await fetch("/api/events", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: "checkoff", payload: { slot } }),
    });
    setNote(res.ok ? `${slot} recorded.` : "Not recorded.");
  }
  return (
    <section>
      <p className="kicker text-clay">Routine</p>
      <h2 className="mt-2 font-serif text-3xl">Check off without the watch</h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-2">
        <button
          type="button"
          onClick={() => mark("morning")}
          className="group flex items-center gap-4 rounded-3xl border border-line bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-lift"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber/10 text-amber">
            <Icon name="sun" size={22} />
          </span>
          <span>
            <span className="block font-medium">Morning check-off</span>
            <span className="text-sm text-quiet">Morning routine done</span>
          </span>
        </button>
        <button
          type="button"
          onClick={() => mark("evening")}
          className="group flex items-center gap-4 rounded-3xl border border-line bg-card p-5 text-left shadow-soft transition hover:-translate-y-0.5 hover:border-clay/40 hover:shadow-lift"
        >
          <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-sage/10 text-sage">
            <Icon name="check" size={22} />
          </span>
          <span>
            <span className="block font-medium">Used the product</span>
            <span className="text-sm text-quiet">Counts toward adherence</span>
          </span>
        </button>
      </div>
      {note ? (
        <p className="mt-3 inline-flex items-center gap-2 text-sm text-quiet" aria-live="polite">
          <Icon name="check" size={14} className="text-sage" />
          {note}
        </p>
      ) : null}
    </section>
  );
}

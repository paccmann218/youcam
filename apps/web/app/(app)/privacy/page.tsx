"use client";

import { useState } from "react";
import { Icon, type IconName } from "@/components/icons";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";

const POINTS: [IconName, string][] = [
  ["calendar", "Cycle is optional. If the phone syncs it, a phase term can enter the model. If it does not, the column stays out."],
  ["watch", "There is no pairing step. The watch sends to the account currently using this server, so anyone on the same network could add a face touch to the counter."],
  ["scan", "YouCam deletes result files on their side. WorthIt copies masks here so a later half-split still has them."],
  ["privacy", "This is a personal test. It is not medical care."],
];

export default function PrivacyPage() {
  const { view, refresh } = useProof();
  const [gone, setGone] = useState(false);
  return (
    <main className="space-y-8">
      <PageTitle kicker="Privacy" icon="privacy" title="Your face is the data.">
        Photos, scores, nights, and watch events live in the local ledger on this server. If Supabase is configured, the same rows are copied there. Delete removes both.
      </PageTitle>

      <section className="grid gap-4 md:grid-cols-2">
        {POINTS.map(([icon, text]) => (
          <Card key={text} className="flex gap-4">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-clay/10 text-clay">
              <Icon name={icon} size={20} />
            </span>
            <p className="leading-relaxed text-ink/85">{text}</p>
          </Card>
        ))}
      </section>

      {view?.user.consentAt ? <p className="text-sm text-quiet">Consent recorded {view.user.consentAt}.</p> : null}

      {view?.user.consentAt ? <SampleData loaded={view.demo} onChange={refresh} /> : null}

      <Card tone="rose" className="flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
        <div>
          <p className="kicker text-rose">Danger zone</p>
          <h2 className="mt-2 font-serif text-2xl">Delete your records</h2>
          <p className="mt-1 text-sm text-quiet">Scans, scores, trials, nights and watch events, from the local ledger and Supabase.</p>
        </div>
        <Button
          variant="danger"
          size="lg"
          className="shrink-0"
          onClick={async () => {
            const res = await fetch("/api/me", { method: "DELETE" });
            if (res.ok) {
              setGone(true);
              await refresh();
            }
          }}
        >
          <Icon name="trash" size={18} />
          Delete my data
        </Button>
      </Card>
      {gone ? <Callout kind="success">Deleted.</Callout> : null}
    </main>
  );
}

function SampleData({ loaded, onChange }: { loaded: boolean; onChange: () => Promise<void> }) {
  const [busy, setBusy] = useState<"load" | "remove" | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function run(action: "load" | "remove") {
    setBusy(action);
    setNote(null);
    const res = await fetch("/api/demo", { method: action === "load" ? "POST" : "DELETE" });
    const json = (await res.json().catch(() => ({}))) as { mornings?: number; faceTouches?: number; error?: string };
    if (!res.ok) setNote(json.error ?? "That did not work.");
    else setNote(action === "load" ? `Loaded ${json.mornings} mornings and ${json.faceTouches} watch touches, ending this morning.` : "Sample data removed.");
    await onChange();
    setBusy(null);
  }

  return (
    <Card id="sample" className="scroll-mt-24 flex flex-col gap-5 p-6 md:flex-row md:items-center md:justify-between md:p-8">
      <div>
        <p className="kicker text-amber">Sample data</p>
        <h2 className="mt-2 font-serif text-2xl">{loaded ? "Sample data is loaded" : "Fill the app with four weeks of sample data"}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-quiet">
          Mornings, nights, watch touches, a light test and a niacinamide test, so every page has numbers to show. Your own scans and watch events stay. Load it again on the day of a demo so it ends that morning.
        </p>
        {note ? <p className="mt-3 text-sm" aria-live="polite">{note}</p> : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2">
        <Button variant="accent" disabled={busy != null} onClick={() => run("load")}>
          <Icon name="sparkle" size={16} />
          {busy === "load" ? "Loading…" : loaded ? "Reload sample data" : "Load sample data"}
        </Button>
        {loaded ? (
          <Button variant="secondary" disabled={busy != null} onClick={() => run("remove")}>
            <Icon name="trash" size={16} />
            {busy === "remove" ? "Removing…" : "Remove"}
          </Button>
        ) : null}
      </div>
    </Card>
  );
}

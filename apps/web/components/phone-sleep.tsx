"use client";

import { useEffect, useState } from "react";
import { Icon } from "@/components/icons";
import { useProof } from "@/components/provider";
import { Button } from "@/components/ui/button";

type NativeSleep = {
  ok: boolean;
  day?: string;
  sleepHours?: number | null;
  cyclePhase?: string | null;
  needsPermission?: boolean;
  error?: string;
};

declare global {
  interface Window {
    WorthItApp?: { readSleep(ask: boolean): void };
  }
}

/** Only shows inside the WorthIt Android app, which reads last night's sleep from Health Connect. */
export function PhoneSleepSync() {
  const { refresh } = useProof();
  const [inApp, setInApp] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);

  useEffect(() => {
    const app = window.WorthItApp;
    if (!app) return;
    setInApp(true);
    const onSleep = async (event: Event) => {
      const sleep = (event as CustomEvent<NativeSleep>).detail;
      if (!sleep.ok) {
        setBusy(false);
        if (!sleep.needsPermission) setNote(sleep.error ?? "Couldn't read sleep from Health Connect.");
        return;
      }
      if (sleep.sleepHours == null) {
        setBusy(false);
        setNote("No sleep recorded since yesterday. Wear the watch to bed and let Samsung Health sync to Health Connect.");
        return;
      }
      try {
        const response = await fetch("/api/ingest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ day: sleep.day, sleepHours: sleep.sleepHours, cyclePhase: sleep.cyclePhase ?? undefined }),
        });
        if (!response.ok) throw new Error(String(response.status));
        setNote(`Synced ${sleep.sleepHours.toFixed(1)} h of sleep from Health Connect.`);
        await refresh();
      } catch {
        setNote("Read your sleep, but couldn't save it. Check the laptop is still running WorthIt.");
      } finally {
        setBusy(false);
      }
    };
    window.addEventListener("worthit:sleep", onSleep);
    const today = new Date().toLocaleDateString("en-CA");
    if (sessionStorage.getItem("worthit-sleep-day") !== today) {
      sessionStorage.setItem("worthit-sleep-day", today);
      app.readSleep(false);
    }
    return () => window.removeEventListener("worthit:sleep", onSleep);
  }, [refresh]);

  if (!inApp) return null;
  return (
    <div className="mt-4 space-y-2">
      <Button
        variant="secondary"
        size="sm"
        disabled={busy}
        onClick={() => {
          setBusy(true);
          setNote(null);
          window.WorthItApp?.readSleep(true);
        }}
      >
        <Icon name="bed" size={16} />
        {busy ? "Reading Health Connect…" : "Sync sleep from Health Connect"}
      </Button>
      {note ? <p className="text-sm leading-relaxed text-quiet">{note}</p> : null}
    </div>
  );
}

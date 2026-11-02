"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import type { View } from "@/lib/derive";

type Status = { youcam: boolean; anthropic: boolean; supabase: boolean; mode: string };

type ProofContext = {
  view: View | null;
  status: Status | null;
  ready: boolean;
  error: string | null;
  refresh: () => Promise<void>;
};

const Ctx = createContext<ProofContext | null>(null);

export function ProofProvider({ children }: { children: React.ReactNode }) {
  const [view, setView] = useState<View | null>(null);
  const [status, setStatus] = useState<Status | null>(null);
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const session = await fetch("/api/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tzOffsetMinutes: -new Date().getTimezoneOffset() }),
    });
    if (!session.ok) {
      setError("The ledger did not open.");
      setReady(true);
      return;
    }
    const state = await fetch("/api/state", { cache: "no-store" });
    const json = (await state.json()) as { view?: View; status?: Status };
    setView(json.view ?? null);
    setStatus(json.status ?? null);
    setReady(true);
  }, []);

  // Stays live: anything the watch sends (touches, check-offs) or coming back to the tab reloads the view.
  useEffect(() => {
    let closed = false;
    let source: EventSource | null = null;
    let timer: ReturnType<typeof setTimeout> | undefined;
    void refresh().then(() => {
      if (closed) return;
      source = new EventSource("/api/events/stream");
      source.onmessage = (message) => {
        if ((JSON.parse(message.data) as { type?: string }).type === "hello") return;
        clearTimeout(timer);
        timer = setTimeout(() => void refresh(), 400);
      };
    });
    const onVisible = () => {
      if (document.visibilityState === "visible") void refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      closed = true;
      source?.close();
      clearTimeout(timer);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  return <Ctx.Provider value={{ view, status, ready, error, refresh }}>{children}</Ctx.Provider>;
}

export function useProof() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProof outside provider");
  return ctx;
}

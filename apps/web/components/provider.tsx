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

  useEffect(() => {
    void refresh();
  }, [refresh]);

  return <Ctx.Provider value={{ view, status, ready, error, refresh }}>{children}</Ctx.Provider>;
}

export function useProof() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useProof outside provider");
  return ctx;
}

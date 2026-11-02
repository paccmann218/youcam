"use client";

import { useState } from "react";
import { Icon } from "@/components/icons";
import { ClaimMini } from "@/components/illustrations/Mini";
import { Watch } from "@/components/illustrations/Watch";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Empty } from "@/components/ui/empty";
import { Field, FileDrop, Input, Select, Textarea } from "@/components/ui/field";
import { StatusPill } from "@/components/ui/status";

export default function ClaimPage() {
  const { refresh } = useProof();
  const [result, setResult] = useState<{ line?: string; note?: { decision: string | null; renderFile: string | null; measuredDelta: number | null }; error?: string | null } | null>(null);
  const [busy, setBusy] = useState(false);
  const [photoName, setPhotoName] = useState<string | null>(null);

  const decision = result?.note?.decision ?? null;
  const isTest = decision === "test";

  return (
    <main className="space-y-8">
      <PageTitle kicker="Before you buy" icon="claim" title="Check a claim before you pay.">
        Type what the label promises. YouCam Skin Simulation renders that change on your face, then Skin Analysis measures it. If the change is smaller than your normal wobble, you would never see it, so skip it.
      </PageTitle>

      <section className="grid gap-5 lg:grid-cols-[1fr_1fr]">
        <Card className="p-6 md:p-8">
          <form
            className="space-y-4"
            onSubmit={async (event) => {
              event.preventDefault();
              setBusy(true);
              const data = new FormData(event.currentTarget);
              const res = await fetch("/api/claim", { method: "POST", body: data });
              setResult(await res.json());
              setBusy(false);
              await refresh();
            }}
          >
            <Field label="Claim, as printed">
              <Textarea name="claim" rows={3} placeholder="Visibly reduces the look of pores." />
            </Field>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Product name">
                <Input name="name" />
              </Field>
              <Field label="Barcode" hint="If Open Beauty Facts has it">
                <Input name="barcode" inputMode="numeric" />
              </Field>
            </div>
            <Field label="Concern">
              <Select name="concern" defaultValue="">
                <option value="">Read it from the claim</option>
                <option value="acne">Acne</option>
                <option value="pore">Pores</option>
                <option value="redness">Redness</option>
                <option value="texture">Texture</option>
              </Select>
            </Field>
            <FileDrop label="Pack photo" hint="Optional. Read only when phrasing is on." name="photo" accept="image/*" onFile={(file) => setPhotoName(file?.name ?? null)} fileName={photoName} />
            <Button type="submit" variant="accent" size="lg" disabled={busy} className="w-full">
              <Icon name="sparkle" size={18} />
              {busy ? "Measuring the render…" : "Check the claim"}
            </Button>
          </form>
        </Card>

        <div className="space-y-5">
          {decision ? (
            <Card tone={isTest ? "sage" : "rose"} className="p-6 md:p-8">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-start">
                <Watch screen="verdict" decision={isTest ? "test" : "skip"} className="h-44 w-auto shrink-0" />
                <div className="min-w-0">
                  <StatusPill tone={isTest ? "sage" : "rose"}>{isTest ? "test it" : decision}</StatusPill>
                  <p className="text-balance mt-4 font-serif text-2xl leading-snug md:text-3xl">{result?.line}</p>
                  {result?.note?.measuredDelta != null ? (
                    <p className="num mt-3 font-mono text-sm text-quiet">measured change {result.note.measuredDelta.toFixed(1)}</p>
                  ) : null}
                </div>
              </div>
              {result?.note?.renderFile ? (
                <figure className="mt-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/api/images/${result.note.renderFile}`}
                    alt="Skin simulation of the claim on your photo"
                    className="w-full max-w-sm rounded-3xl border border-line shadow-soft"
                  />
                  <figcaption className="mt-2 text-xs text-quiet">Skin Simulation render. Illustrative, not a prediction.</figcaption>
                </figure>
              ) : null}
            </Card>
          ) : (
            <Empty art={<ClaimMini className="h-24" />} title="No claim checked yet.">
              Type the claim from the pack. WorthIt renders it on your face, measures the render, and compares it with your normal wobble.
            </Empty>
          )}
          {result?.error ? <Callout kind="danger">{result.error}</Callout> : null}
        </div>
      </section>
    </main>
  );
}

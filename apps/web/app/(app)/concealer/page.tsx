"use client";

import { useEffect, useState } from "react";
import { FaceUpload } from "@/components/face-upload";
import { Icon } from "@/components/icons";
import { Face } from "@/components/illustrations/Face";
import { PageTitle } from "@/components/shell";
import { Button } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { StatusPill } from "@/components/ui/status";

export default function ConcealerPage() {
  const [result, setResult] = useState<{ color?: string; toneSource?: string; previewUrl?: string; note?: string; error?: string } | null>(null);
  const [busy, setBusy] = useState(false);
  const [faceImage, setFaceImage] = useState<string | null>(null);

  async function loadFace() {
    const res = await fetch("/api/profile", { cache: "no-store" });
    if (!res.ok) return;
    const json = (await res.json()) as { faceImage: string | null };
    setFaceImage(json.faceImage);
  }

  useEffect(() => {
    void loadFace();
  }, []);

  return (
    <main className="space-y-8">
      <PageTitle
        kicker="Cover-up shade"
        icon="concealer"
        title="Bad skin day? Find your shade."
        aside={
          <Button
            variant="accent"
            size="lg"
            disabled={busy || !faceImage}
            onClick={async () => {
              setBusy(true);
              const res = await fetch("/api/concealer", { method: "POST", headers: { "Content-Type": "application/json" }, body: "{}" });
              setResult(await res.json());
              setBusy(false);
            }}
          >
            <Icon name="concealer" size={18} />
            {busy ? "Trying it on…" : "Try a concealer"}
          </Button>
        }
      >
        WorthIt reads your skin tone with YouCam and tries a matching concealer on your face photo with Makeup VTO. It is cosmetic only and does not touch your test.
      </PageTitle>

      <FaceUpload image={faceImage} onDone={loadFace} />

      {result?.error ? <Callout kind="danger">{result.error}</Callout> : null}

      {result?.previewUrl ? (
        <Card className="grid gap-6 p-6 md:grid-cols-[auto_1fr] md:p-8">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={result.previewUrl} alt="Concealer try-on" className="w-full max-w-sm rounded-3xl border border-line shadow-soft" />
          <div>
            <p className="kicker text-clay">The shade</p>
            <div className="mt-4 flex items-center gap-4">
              <span className="h-16 w-16 rounded-full border-4 border-card shadow-lift" style={{ background: result.color }} aria-hidden="true" />
              <div>
                <p className="num font-mono text-2xl font-medium">{result.color}</p>
                <StatusPill tone={result.toneSource === "youcam" ? "sage" : "ink"} className="mt-2">
                  {result.toneSource === "youcam" ? "YouCam skin tone" : "cheek sample"}
                </StatusPill>
              </div>
            </div>
            {result.note ? <p className="mt-5 leading-relaxed text-quiet">{result.note}</p> : null}
          </div>
        </Card>
      ) : !result?.error ? (
        <Card className="flex flex-col items-center gap-6 bg-gradient-to-br from-peach/30 via-card to-card p-8 text-center md:flex-row md:text-left">
          <Face className="h-40 w-auto shrink-0" />
          <div>
            <h2 className="font-serif text-2xl">Uses your latest scan photo.</h2>
            <p className="mt-2 max-w-md leading-relaxed text-quiet">
              The shade is matched to your skin tone, then tried on with YouCam Makeup VTO. Nothing here touches the trial.
            </p>
          </div>
        </Card>
      ) : null}
    </main>
  );
}

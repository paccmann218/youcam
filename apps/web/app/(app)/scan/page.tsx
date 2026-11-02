"use client";

import { useState } from "react";
import { CaptureForm } from "@/components/capture";
import { Phone } from "@/components/illustrations/Phone";
import { useProof } from "@/components/provider";
import { PageTitle } from "@/components/shell";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";
import { Segmented } from "@/components/ui/segmented";

export default function ScanPage() {
  const { refresh, status } = useProof();
  const [purpose, setPurpose] = useState<"noise" | "daily">("noise");
  return (
    <main className="space-y-8">
      <PageTitle kicker="Scan my face" icon="scan" title="Scan your face">
        Start with five quick scans in a row to measure your normal wobble. After that, one scan each morning. YouCam Camera Kit refuses bad light or a bad angle, so every scan is comparable.
      </PageTitle>
      {!status?.youcam ? <Callout kind="danger">Scanning is off: YOUCAM_API_KEY is not set on the server. WorthIt never invents a score.</Callout> : null}

      <section className="grid gap-5 lg:grid-cols-[1.1fr_.9fr]">
        <Card className="p-6 md:p-8">
          <p className="kicker mb-2 text-quiet">What is this scan for?</p>
          <Segmented
            label="Scan purpose"
            value={purpose}
            onChange={setPurpose}
            options={[
              { value: "noise", label: "Baseline", hint: "5 in a row" },
              { value: "daily", label: "This morning" },
            ]}
          />
          <p className="mt-4 leading-relaxed text-quiet">
            {purpose === "noise"
              ? "Five in a row, without moving. They measure how much the scan itself wobbles, not five different days."
              : "One scan, in the same spot and light as your baseline."}
          </p>
          <div className="mt-6 border-t border-line pt-6">
            <CaptureForm key={purpose} purpose={purpose} onDone={refresh} />
          </div>
        </Card>

        <Card className="relative hidden overflow-hidden bg-gradient-to-b from-peach/40 to-card lg:block" padded={false}>
          <div className="dotgrid absolute inset-0 opacity-50" aria-hidden="true" />
          <div className="relative flex h-full flex-col items-center px-8 pb-0 pt-8">
            <p className="kicker text-clay">How to take it</p>
            <ul className="mt-4 space-y-2 text-center text-sm text-ink/80">
              <li>Face the light, no shadows across the cheeks.</li>
              <li>Fill the oval with your face, eyes level.</li>
              <li>Same spot, same time, every morning.</li>
            </ul>
            <Phone screen="capture" className="mt-8 h-[26rem] w-auto translate-y-10 drop-shadow-2xl" />
          </div>
        </Card>
      </section>
    </main>
  );
}

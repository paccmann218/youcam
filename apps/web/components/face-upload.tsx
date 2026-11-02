"use client";

import { useState } from "react";
import { prepareImage } from "@/components/capture";
import { Icon } from "@/components/icons";
import { buttonClass } from "@/components/ui/button";
import { Callout } from "@/components/ui/callout";
import { Card } from "@/components/ui/card";

/** Uploads a face photo for try-on and claim checks. It does not count as a morning scan. */
export function FaceUpload({
  image,
  onDone,
}: {
  image: string | null;
  onDone: () => Promise<void>;
}) {
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  async function send(file: File) {
    setBusy(true);
    setError(null);
    setNote(null);
    try {
      const prepared = await prepareImage(file, "sd");
      const body = new FormData();
      body.set("image", prepared.blob, "face.jpg");
      body.set("mode", "sd");
      const res = await fetch("/api/face", { method: "POST", body });
      const json = (await res.json()) as { error?: string; scoreError?: string | null };
      if (!res.ok) throw new Error(json.error || "Could not save that photo.");
      setNote(json.scoreError ? `Photo saved. YouCam could not score it yet: ${json.scoreError}` : "Face photo saved. Try-on and colour matching use this picture.");
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save that photo.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Card className="grid items-center gap-5 p-5 md:grid-cols-[auto_1fr] md:p-6">
      <div className="mx-auto h-36 w-28 overflow-hidden rounded-3xl border border-line bg-paper/70">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={`/api/images/${image}`} alt="Face photo used for try-on" className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full flex-col items-center justify-center gap-2 px-3 text-center text-quiet">
            <Icon name="scan" size={22} />
            <span className="text-xs">No face photo yet</span>
          </div>
        )}
      </div>
      <div>
        <p className="kicker text-clay">Your face</p>
        <h2 className="mt-1 font-serif text-2xl">{image ? "This photo is used for try-on" : "Add a photo of your face"}</h2>
        <p className="mt-1 max-w-xl text-sm leading-relaxed text-quiet">
          Take one now or upload a picture you already have. Shade matching, makeup try-on, concealer, and claim checks use it. It is not one of your morning scans.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <label className={buttonClass("accent", "md", "w-full cursor-pointer")}>
            <Icon name="camera" size={18} />
            {busy ? "Saving…" : "Take a photo"}
            <input
              className="hidden"
              type="file"
              accept="image/*"
              capture="user"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void send(file);
              }}
            />
          </label>
          <label className={buttonClass("secondary", "md", "w-full cursor-pointer")}>
            <Icon name="upload" size={18} />
            {busy ? "Saving…" : image ? "Replace photo" : "Upload a photo"}
            <input
              className="hidden"
              type="file"
              accept="image/*"
              disabled={busy}
              onChange={(event) => {
                const file = event.target.files?.[0];
                event.target.value = "";
                if (file) void send(file);
              }}
            />
          </label>
        </div>
        {note ? <Callout kind="success" className="mt-4">{note}</Callout> : null}
        {error ? <Callout kind="danger" className="mt-4">{error}</Callout> : null}
      </div>
    </Card>
  );
}

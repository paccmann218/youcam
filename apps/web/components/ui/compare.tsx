"use client";

import { useState } from "react";

/** Before/after image comparison with a draggable divider (keyboard accessible via the range input). */
export function Compare({ before, after, beforeLabel = "Before", afterLabel = "After" }: { before: string; after: string; beforeLabel?: string; afterLabel?: string }) {
  const [split, setSplit] = useState(50);
  return (
    <div className="relative overflow-hidden rounded-3xl border border-line bg-paper shadow-soft">
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={after} alt={afterLabel} className="block w-full select-none" draggable={false} />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={before}
        alt={beforeLabel}
        className="absolute inset-0 block h-full w-full select-none object-cover"
        style={{ clipPath: `inset(0 ${100 - split}% 0 0)` }}
        draggable={false}
      />
      <div className="pointer-events-none absolute inset-y-0 w-0.5 bg-paper shadow-[0_0_0_1px_rgb(0_0_0/0.15)]" style={{ left: `${split}%` }}>
        <span className="absolute top-1/2 left-1/2 flex h-9 w-9 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-paper text-ink shadow-lift">
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <path d="m9 7-5 5 5 5M15 7l5 5-5 5" />
          </svg>
        </span>
      </div>
      <span className="glass pointer-events-none absolute left-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-ink">{beforeLabel}</span>
      <span className="glass pointer-events-none absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-medium text-ink">{afterLabel}</span>
      <input
        type="range"
        min={0}
        max={100}
        value={split}
        onChange={(event) => setSplit(Number(event.target.value))}
        aria-label="Drag to compare before and after"
        className="absolute inset-0 h-full w-full cursor-ew-resize opacity-0"
      />
    </div>
  );
}

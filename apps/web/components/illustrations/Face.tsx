"use client";

import { useId } from "react";

/** Stylised face line art with skin-analysis regions, or a split-face (one-side) layout. */
export function Face({
  variant = "regions",
  className,
  title,
}: {
  variant?: "regions" | "split";
  className?: string;
  title?: string;
}) {
  const id = useId().replace(/:/g, "");
  const label =
    title ?? (variant === "split" ? "Face split down the midline: product on one side, the other side as control" : "Face with highlighted skin analysis regions");
  const head = "M100 34c-42 0-64 32-64 76 0 50 28 96 64 96s64-46 64-96c0-44-22-76-64-76Z";
  return (
    <svg viewBox="0 0 200 240" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <clipPath id={`${id}-head`}>
          <path d={head} />
        </clipPath>
      </defs>

      <path d={head} className="fill-peach/40" />
      {variant === "split" ? (
        <g clipPath={`url(#${id}-head)`}>
          <rect x="0" y="0" width="100" height="240" className="fill-sage/20" />
          <rect x="100" y="0" width="100" height="240" className="fill-ink/[0.04]" />
        </g>
      ) : (
        <g clipPath={`url(#${id}-head)`}>
          {/* T-zone */}
          <path d="M66 70c10-12 58-12 68 0v16c-8 4-16 6-22 8v52c-4 8-20 8-24 0V94c-6-2-14-4-22-8Z" className="fill-clay/15" />
          {/* cheeks */}
          <ellipse cx="66" cy="150" rx="20" ry="16" className="fill-rose/15" />
          <ellipse cx="134" cy="150" rx="20" ry="16" className="fill-rose/15" />
          <g className="fill-clay/70">
            <circle cx="58" cy="146" r="1.6" />
            <circle cx="66" cy="152" r="1.3" />
            <circle cx="72" cy="144" r="1.1" />
            <circle cx="62" cy="158" r="1.2" />
            <circle cx="140" cy="146" r="1.6" />
            <circle cx="132" cy="154" r="1.3" />
            <circle cx="128" cy="145" r="1.1" />
            <circle cx="142" cy="158" r="1.2" />
          </g>
          {/* under-eye */}
          <path d="M62 128c8 6 20 6 28 0M110 128c8 6 20 6 28 0" fill="none" className="stroke-amber" strokeWidth="3" strokeLinecap="round" opacity="0.55" />
        </g>
      )}

      {/* line art */}
      <g fill="none" className="stroke-ink/70" strokeLinecap="round" strokeLinejoin="round">
        <path d={head} strokeWidth="1.8" />
        <path d="M38 98c6-40 30-62 62-62s56 22 62 62c-14-20-36-30-62-30s-48 10-62 30Z" className="fill-ink/10" strokeWidth="1.6" />
        <path d="M66 112c6-4 14-4 20 0M114 112c6-4 14-4 20 0" strokeWidth="1.8" />
        <path d="M66 122c5 3 12 3 18 0M116 122c5 3 12 3 18 0" strokeWidth="1.5" />
        <path d="M100 124v30c-3 4-8 5-11 4" strokeWidth="1.6" />
        <path d="M84 178c10 7 22 7 32 0" strokeWidth="2" />
        <path d="M36 118c-6 0-8 6-6 12s6 10 10 10M164 118c6 0 8 6 6 12s-6 10-10 10" strokeWidth="1.4" />
      </g>

      {variant === "split" ? (
        <>
          <path d="M100 26V216" className="stroke-clay" strokeWidth="1.6" strokeDasharray="4 4" />
          <g className="font-mono" fontSize="8" letterSpacing="1.2">
            <rect x="20" y="214" width="66" height="18" rx="9" className="fill-sage/15 stroke-sage/40" />
            <text x="53" y="226" textAnchor="middle" className="fill-sage">
              PRODUCT
            </text>
            <rect x="114" y="214" width="66" height="18" rx="9" className="fill-card stroke-line" />
            <text x="147" y="226" textAnchor="middle" className="fill-quiet">
              CONTROL
            </text>
          </g>
        </>
      ) : null}
    </svg>
  );
}

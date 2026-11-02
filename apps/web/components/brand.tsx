export const BRAND = "WorthIt";
export const TAGLINE = "Is your skincare actually worth it?";

/*
 * The WorthIt mark: a "W" drawn as a data line. It wobbles between two
 * dashed hairlines (your normal wobble), then its last stroke breaks out
 * above them in clay and ends on a data point: a change that is real.
 * Geometry is on a 48-unit grid and shared with app/icon.svg.
 */
export const MARK = {
  band: "M6 21 H42 M6 32.5 H42",
  wobble: "M10 18 L16.6 35.5 L24 25 L31.4 35.5",
  breakout: "M31.4 35.5 L38 13.5",
  dot: { cx: 38, cy: 13.5, r: 3.4 },
} as const;

/** The logo tile. Colours come from theme tokens, so it inverts cleanly in dark mode. */
export function LogoMark({ className = "", title }: { className?: string; title?: string }) {
  return (
    <svg viewBox="0 0 48 48" className={className} role={title ? "img" : undefined} aria-label={title} aria-hidden={title ? undefined : true}>
      <rect width="48" height="48" rx="12" className="fill-ink" />
      <path d={MARK.band} className="stroke-paper" strokeWidth="1.1" strokeDasharray="2 2.2" opacity="0.38" />
      <path d={MARK.wobble} fill="none" className="stroke-paper" strokeWidth="3.6" strokeLinecap="round" strokeLinejoin="miter" strokeMiterlimit="10" />
      <path d={MARK.breakout} fill="none" className="stroke-clay" strokeWidth="3.6" strokeLinecap="round" />
      <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} className="fill-clay" />
    </svg>
  );
}

/** Mark + wordmark, in the app's serif. */
export function Wordmark({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2.5 ${className}`}>
      <LogoMark className="h-8 w-8 shrink-0" />
      {compact ? null : (
        <span className="font-serif text-[1.55rem] font-medium leading-none tracking-tight">
          Worth<span className="italic text-clay">It</span>
        </span>
      )}
    </span>
  );
}

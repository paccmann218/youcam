import { cx } from "./cx";

/**
 * Shows a delta against the ±MDC band. The shaded centre is "within noise".
 * The scale is ±(2 × MDC) so the band always takes the middle half.
 */
export function NoiseGauge({ delta, mdc, className }: { delta: number | null; mdc: number | null; className?: string }) {
  if (delta == null || mdc == null || mdc <= 0) {
    return <div className={cx("h-2 rounded-full bg-line/60", className)} aria-hidden="true" />;
  }
  const span = mdc * 2;
  const clamped = Math.max(-span, Math.min(span, delta));
  const position = 50 + (clamped / span) * 50;
  const inside = Math.abs(delta) <= mdc;
  const color = inside ? "bg-ink" : delta > 0 ? "bg-sage" : "bg-rose";
  return (
    <div className={cx("relative h-2 rounded-full bg-line/50", className)} role="img" aria-label={`Change ${delta.toFixed(1)} against a noise band of ±${mdc.toFixed(1)}`}>
      <div className="absolute inset-y-0 left-1/4 right-1/4 rounded-full bg-amber/20" />
      <div className="absolute inset-y-[-3px] left-1/2 w-px bg-quiet/40" />
      <div
        className={cx("absolute top-1/2 h-3.5 w-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card shadow-soft", color)}
        style={{ left: `${position}%` }}
      />
    </div>
  );
}

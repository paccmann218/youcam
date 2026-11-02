"use client";

import { useId } from "react";

type WatchProps = {
  screen?: "hands" | "verdict" | "tile" | "wake";
  count?: number;
  decision?: "skip" | "test" | null;
  day?: number;
  of?: number;
  verdictDay?: number | null;
  /** Change this value to replay the buzz ripple. */
  buzzKey?: string | number;
  ripple?: "loop" | "once" | "none";
  /** Use "clay" when the watch sits on a dark background. */
  strap?: "ink" | "clay";
  className?: string;
  title?: string;
};

/** A round Wear OS watch in the shape of a Galaxy Watch4. No brand marks. */
export function Watch({
  screen = "hands",
  count = 14,
  decision = "skip",
  day = 9,
  of = 28,
  verdictDay = 19,
  buzzKey,
  ripple = "none",
  strap = "ink",
  className,
  title,
}: WatchProps) {
  const id = useId().replace(/:/g, "");
  const label =
    title ??
    (screen === "hands"
      ? `Smartwatch showing ${count} face touches today`
      : screen === "verdict"
        ? `Smartwatch showing ${decision === "test" ? "TEST IT" : "SKIP"}`
        : screen === "tile"
          ? `Smartwatch tile showing trial day ${day}`
          : "Smartwatch prompting a morning scan");
  const progress = Math.max(0, Math.min(1, day / of));
  const arc = 2 * Math.PI * 50;

  return (
    <svg viewBox="0 0 200 270" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}-case`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: "rgb(var(--elevated))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--line))" }} />
        </linearGradient>
        <linearGradient id={`${id}-strap`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: `rgb(var(--${strap}) / 0.82)` }} />
          <stop offset="0.5" style={{ stopColor: `rgb(var(--${strap}) / 0.95)` }} />
          <stop offset="1" style={{ stopColor: `rgb(var(--${strap}) / 0.78)` }} />
        </linearGradient>
        <radialGradient id={`${id}-glass`} cx="0.35" cy="0.25" r="0.9">
          <stop offset="0" style={{ stopColor: "rgb(255 255 255 / 0.10)" }} />
          <stop offset="0.5" style={{ stopColor: "rgb(255 255 255 / 0.02)" }} />
          <stop offset="1" style={{ stopColor: "rgb(255 255 255 / 0)" }} />
        </radialGradient>
      </defs>

      {/* buzz ripples */}
      {ripple === "loop" ? (
        <g className="stroke-clay" fill="none" strokeWidth="1.5">
          <circle className="ripple-ring" cx="100" cy="135" r="76" />
          <circle className="ripple-ring delay-1" cx="100" cy="135" r="76" />
          <circle className="ripple-ring delay-2" cx="100" cy="135" r="76" />
        </g>
      ) : null}
      {ripple === "once" ? (
        <g key={buzzKey} className="stroke-clay" fill="none" strokeWidth="2">
          <circle className="ripple-once" cx="100" cy="135" r="76" />
        </g>
      ) : null}

      {/* straps */}
      <path d="M62 8 Q100 0 138 8 L134 70 H66 Z" fill={`url(#${id}-strap)`} />
      <path d="M66 200 H134 L138 262 Q100 270 62 262 Z" fill={`url(#${id}-strap)`} />
      <g className="fill-paper/25">
        <circle cx="100" cy="222" r="2.2" />
        <circle cx="100" cy="236" r="2.2" />
        <circle cx="100" cy="250" r="2.2" />
      </g>
      <path d="M70 22 H130 M70 34 H130" className="stroke-paper/10" strokeWidth="1" />

      {/* case and buttons */}
      <rect x="170" y="104" width="9" height="20" rx="3" className="fill-line" />
      <rect x="170" y="146" width="9" height="20" rx="3" className="fill-line" />
      <circle cx="100" cy="135" r="74" fill={`url(#${id}-case)`} />
      <circle cx="100" cy="135" r="74" fill="none" className="stroke-ink/10" />
      <circle cx="100" cy="135" r="66" className="fill-screen" />
      <circle cx="100" cy="135" r="61" fill="none" className="stroke-screen-ink/10" />

      {/* screen */}
      <g className="font-sans">
        {screen === "hands" ? (
          <>
            <text x="100" y="108" textAnchor="middle" fontSize="8.5" letterSpacing="2" className="fill-clay font-mono">
              HANDS OFF
            </text>
            <text x="100" y="150" textAnchor="middle" fontSize="40" fontWeight="500" className="fill-screen-ink font-mono">
              {count}
            </text>
            <text x="100" y="168" textAnchor="middle" fontSize="9" className="fill-screen-ink/60">
              face touches today
            </text>
            <path d="M84 180 h32" className="stroke-clay" strokeWidth="2.5" strokeLinecap="round" />
          </>
        ) : null}
        {screen === "verdict" ? (
          <>
            <text x="100" y="106" textAnchor="middle" fontSize="8.5" letterSpacing="2" className="fill-screen-ink/60 font-mono">
              CLAIM CHECK
            </text>
            <rect
              x="56"
              y="118"
              width="88"
              height="34"
              rx="17"
              className={decision === "test" ? "fill-sage/20 stroke-sage" : "fill-rose/20 stroke-rose"}
              strokeWidth="1.5"
            />
            <text
              x="100"
              y="141"
              textAnchor="middle"
              fontSize="17"
              fontWeight="600"
              letterSpacing="1.5"
              className={decision === "test" ? "fill-sage" : "fill-rose"}
            >
              {decision === "test" ? "TEST IT" : "SKIP"}
            </text>
            <text x="100" y="167" textAnchor="middle" fontSize="8.5" className="fill-screen-ink/60">
              {decision === "test" ? "bigger than" : "even if true,"}
            </text>
            <text x="100" y="178" textAnchor="middle" fontSize="8.5" className="fill-screen-ink/60">
              {decision === "test" ? "your noise" : "too small to see"}
            </text>
          </>
        ) : null}
        {screen === "tile" ? (
          <>
            <circle cx="100" cy="135" r="50" fill="none" className="stroke-screen-ink/10" strokeWidth="5" />
            <circle
              cx="100"
              cy="135"
              r="50"
              fill="none"
              className="stroke-clay"
              strokeWidth="5"
              strokeLinecap="round"
              strokeDasharray={`${arc * progress} ${arc}`}
              transform="rotate(-90 100 135)"
            />
            <text x="100" y="118" textAnchor="middle" fontSize="8" letterSpacing="2" className="fill-screen-ink/60 font-mono">
              TRIAL DAY
            </text>
            <text x="100" y="146" textAnchor="middle" fontSize="30" fontWeight="500" className="fill-screen-ink font-mono">
              {day}
            </text>
            <text x="100" y="162" textAnchor="middle" fontSize="8.5" className="fill-amber">
              {verdictDay ? `verdict ~ day ${verdictDay}` : "too early"}
            </text>
          </>
        ) : null}
        {screen === "wake" ? (
          <>
            <g transform="translate(88 92)" className="stroke-amber" fill="none" strokeWidth="1.6" strokeLinecap="round">
              <circle cx="12" cy="12" r="5" />
              <path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M5 5l1.7 1.7M17.3 17.3 19 19M5 19l1.7-1.7M17.3 6.7 19 5" />
            </g>
            <text x="100" y="140" textAnchor="middle" fontSize="13" fontWeight="500" className="fill-screen-ink">
              Same light.
            </text>
            <text x="100" y="156" textAnchor="middle" fontSize="13" fontWeight="500" className="fill-screen-ink">
              Same time.
            </text>
            <rect x="70" y="166" width="60" height="18" rx="9" className="fill-clay" />
            <text x="100" y="178.5" textAnchor="middle" fontSize="8.5" fontWeight="600" className="fill-on-clay">
              Scan now
            </text>
          </>
        ) : null}
      </g>
      <circle cx="100" cy="135" r="66" fill={`url(#${id}-glass)`} pointerEvents="none" />
    </svg>
  );
}

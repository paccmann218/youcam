"use client";

import { useId } from "react";

/** A laptop showing the WorthIt dashboard: a normal-wobble band, a live path, a simulated path. Values are illustrative. */
export function Laptop({ className, title = "Laptop showing the WorthIt dashboard with a progress chart and a verdict" }: { className?: string; title?: string }) {
  const id = useId().replace(/:/g, "");
  const live = "M120 196 L150 188 L180 198 L210 184 L240 192 L270 176 L300 182";
  const sim = "M300 182 L330 170 L360 164 L390 152 L420 146";
  return (
    <svg viewBox="0 0 560 360" className={className} role="img" aria-label={title}>
      <title>{title}</title>
      <defs>
        <linearGradient id={`${id}-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "rgb(var(--elevated))" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--line))" }} />
        </linearGradient>
        <linearGradient id={`${id}-area`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "rgb(var(--clay) / 0.18)" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--clay) / 0)" }} />
        </linearGradient>
      </defs>

      {/* lid */}
      <rect x="44" y="8" width="472" height="306" rx="20" className="fill-ink" />
      <rect x="56" y="20" width="448" height="280" rx="8" className="fill-paper" />
      <circle cx="280" cy="14" r="2.2" className="fill-paper/30" />

      {/* sidebar */}
      <rect x="56" y="20" width="58" height="280" className="fill-card" />
      <path d="M114 20v280" className="stroke-line" />
      <text x="68" y="46" fontSize="11" className="fill-ink font-serif">
        WorthIt
      </text>
      {[70, 92, 114, 136, 158, 180].map((y, index) => (
        <g key={y}>
          <rect x="68" y={y} width={index === 1 ? 36 : 30} height="10" rx="5" className={index === 1 ? "fill-clay/20" : "fill-line"} />
        </g>
      ))}

      {/* header */}
      <text x="130" y="44" fontSize="7.5" letterSpacing="1.8" className="fill-clay font-mono">
        YOUR PRODUCT · ONE SIDE
      </text>
      <text x="130" y="64" fontSize="15" className="fill-ink font-serif">
        Niacinamide serum, pores
      </text>
      <rect x="130" y="72" width="70" height="16" rx="8" className="fill-sage/15 stroke-sage/40" />
      <circle cx="139" cy="80" r="2.4" className="fill-sage" />
      <text x="146" y="83" fontSize="7.5" fontWeight="500" className="fill-sage">
        Worth it
      </text>
      <rect x="206" y="72" width="88" height="16" rx="8" className="fill-ink/5 stroke-line" />
      <text x="250" y="83" textAnchor="middle" fontSize="7.5" className="fill-quiet">
        earliest day 19
      </text>

      {/* chart card */}
      <rect x="126" y="98" width="306" height="186" rx="10" className="fill-card stroke-line" />
      {[130, 160, 190, 220, 250].map((y) => (
        <path key={y} d={`M140 ${y}H420`} className="stroke-line" strokeWidth="0.8" />
      ))}
      {/* on-product region */}
      <rect x="210" y="112" width="210" height="150" className="fill-clay/[0.05]" />
      <text x="214" y="122" fontSize="6.5" className="fill-clay font-mono">
        ON PRODUCT
      </text>
      {/* noise band */}
      <rect x="140" y="176" width="280" height="30" className="fill-amber/15" />
      <text x="416" y="202" textAnchor="end" fontSize="6.5" className="fill-amber font-mono">
        NORMAL WOBBLE
      </text>
      <path d={`${live} L300 262 L120 262 Z`} fill={`url(#${id}-area)`} />
      <path d={live} fill="none" className="stroke-ink draw-line" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      <path d={sim} fill="none" className="stroke-amber" strokeWidth="2" strokeDasharray="5 5" strokeLinecap="round" />
      {[
        [120, 196],
        [150, 188],
        [180, 198],
        [210, 184],
        [240, 192],
        [270, 176],
        [300, 182],
      ].map(([x, y]) => (
        <circle key={x} cx={x} cy={y} r="3" className="fill-card stroke-ink" strokeWidth="1.5" />
      ))}
      <text x="140" y="276" fontSize="6.5" className="fill-quiet font-mono">
        your mornings
      </text>
      <text x="330" y="276" fontSize="6.5" className="fill-amber font-mono">
        simulated from your noise
      </text>

      {/* side cards */}
      <rect x="442" y="98" width="52" height="88" rx="10" className="fill-card stroke-line" />
      <text x="468" y="116" textAnchor="middle" fontSize="6" letterSpacing="1" className="fill-quiet font-mono">
        HANDS
      </text>
      <text x="468" y="150" textAnchor="middle" fontSize="22" fontWeight="500" className="fill-ink font-mono">
        14
      </text>
      <circle cx="468" cy="170" r="3" className="fill-clay" />
      <rect x="442" y="196" width="52" height="88" rx="10" className="fill-card stroke-line" />
      <text x="468" y="214" textAnchor="middle" fontSize="6" letterSpacing="1" className="fill-quiet font-mono">
        SLEEP
      </text>
      <text x="468" y="246" textAnchor="middle" fontSize="16" fontWeight="500" className="fill-ink font-mono">
        7.2h
      </text>
      <path d="M452 266 l6 -6 6 4 6 -8 6 5 6 -3" fill="none" className="stroke-sage" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* base */}
      <path d="M8 314 H552 L540 340 Q536 348 524 348 H36 Q24 348 20 340 Z" fill={`url(#${id}-base)`} />
      <path d="M8 314 H552" className="stroke-ink/15" />
      <path d="M232 314 h96 a6 6 0 0 1 -6 7 h-84 a6 6 0 0 1 -6 -7 Z" className="fill-ink/10" />
    </svg>
  );
}

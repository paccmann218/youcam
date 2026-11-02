"use client";

import { useId } from "react";

type PhoneProps = {
  screen?: "capture" | "result" | "claim" | "verdict";
  className?: string;
  title?: string;
};

/** A generic Android phone with a punch-hole camera. Screen values are illustrative. */
export function Phone({ screen = "capture", className, title }: PhoneProps) {
  const id = useId().replace(/:/g, "");
  const label =
    title ??
    (screen === "capture"
      ? "Phone camera framing a face inside the Camera Kit guide"
      : screen === "result"
        ? "Phone showing skin scores compared to the noise floor"
        : screen === "verdict"
          ? "Phone showing an example verdict: worth it"
          : "Phone showing a claim check that says skip");

  return (
    <svg viewBox="0 0 220 440" className={className} role="img" aria-label={label}>
      <title>{label}</title>
      <defs>
        <linearGradient id={`${id}-cam`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" style={{ stopColor: "#3a302a" }} />
          <stop offset="1" style={{ stopColor: "#16120f" }} />
        </linearGradient>
        <linearGradient id={`${id}-scan`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" style={{ stopColor: "rgb(var(--clay) / 0)" }} />
          <stop offset="0.5" style={{ stopColor: "rgb(var(--clay) / 0.9)" }} />
          <stop offset="1" style={{ stopColor: "rgb(var(--clay) / 0)" }} />
        </linearGradient>
        <clipPath id={`${id}-clip`}>
          <rect x="14" y="14" width="192" height="412" rx="28" />
        </clipPath>
      </defs>

      {/* body */}
      <rect x="214" y="110" width="4" height="46" rx="2" className="fill-ink/40" />
      <rect x="214" y="170" width="4" height="70" rx="2" className="fill-ink/40" />
      <rect x="4" y="4" width="212" height="432" rx="38" className="fill-ink" />
      <rect x="4.5" y="4.5" width="211" height="431" rx="37.5" fill="none" className="stroke-paper/15" />

      <g clipPath={`url(#${id}-clip)`}>
        {screen === "capture" ? <CaptureScreen id={id} /> : null}
        {screen === "result" ? <ResultScreen /> : null}
        {screen === "claim" ? <ClaimScreen /> : null}
        {screen === "verdict" ? <VerdictScreen /> : null}
      </g>

      {/* punch-hole camera */}
      <circle cx="110" cy="30" r="6" className="fill-ink" />
      <circle cx="110" cy="30" r="2.4" className="fill-paper/20" />
    </svg>
  );
}

function CaptureScreen({ id }: { id: string }) {
  return (
    <>
      <rect x="14" y="14" width="192" height="412" fill={`url(#${id}-cam)`} />
      <text x="110" y="62" textAnchor="middle" fontSize="9" letterSpacing="2" className="fill-screen-ink/70 font-mono">
        CAMERA KIT · STRICT
      </text>

      {/* face line art */}
      <g fill="none" strokeLinecap="round" strokeLinejoin="round">
        <path
          d="M110 108c-34 0-52 26-52 62 0 40 22 76 52 76s52-36 52-76c0-36-18-62-52-62Z"
          className="fill-[#c99a7e]/25 stroke-screen-ink/55"
          strokeWidth="1.6"
        />
        <path d="M62 150c6-30 26-46 48-46s42 16 48 46c-12-14-28-20-48-20s-36 6-48 20Z" className="fill-screen-ink/20 stroke-screen-ink/50" strokeWidth="1.4" />
        <path d="M84 168c5-3 11-3 16 0M120 168c5-3 11-3 16 0" className="stroke-screen-ink/70" strokeWidth="1.6" />
        <path d="M110 176v24c-2 3-6 4-8 3" className="stroke-screen-ink/50" strokeWidth="1.4" />
        <path d="M97 218c8 6 18 6 26 0" className="stroke-screen-ink/70" strokeWidth="1.8" />
        {/* mask dots, like a pore overlay */}
        <g className="fill-clay/80" stroke="none">
          <circle cx="82" cy="196" r="1.6" />
          <circle cx="88" cy="202" r="1.3" />
          <circle cx="78" cy="204" r="1.2" />
          <circle cx="138" cy="196" r="1.6" />
          <circle cx="132" cy="203" r="1.3" />
          <circle cx="142" cy="205" r="1.2" />
          <circle cx="106" cy="142" r="1.2" />
          <circle cx="114" cy="138" r="1.4" />
        </g>
      </g>

      {/* Camera Kit oval guide */}
      <ellipse cx="110" cy="176" rx="70" ry="90" fill="none" className="stroke-clay" strokeWidth="2" strokeDasharray="6 6" />
      <g className="stroke-screen-ink" strokeWidth="2.5" strokeLinecap="round" fill="none">
        <path d="M32 86v-18h18M188 86v-18h-18M32 286v18h18M188 286v18h-18" />
      </g>

      {/* scan line */}
      <g className="scan-line" style={{ ["--scan-travel" as string]: "170px" }}>
        <rect x="40" y="94" width="140" height="3" rx="1.5" fill={`url(#${id}-scan)`} />
      </g>

      {/* quality chips */}
      {[
        ["Light even", 330],
        ["Face centred", 356],
        ["Distance ok", 382],
      ].map(([text, y]) => (
        <g key={text as string}>
          <rect x="52" y={(y as number) - 13} width="116" height="20" rx="10" className="fill-screen-ink/10" />
          <circle cx="66" cy={(y as number) - 3} r="5" className="fill-sage" />
          <path d={`M63.6 ${(y as number) - 3}l1.6 1.6 3-3.2`} className="stroke-screen" strokeWidth="1.5" fill="none" />
          <text x="78" y={(y as number) + 0.5} fontSize="9.5" className="fill-screen-ink/85">
            {text}
          </text>
        </g>
      ))}
    </>
  );
}

function ResultScreen() {
  const rows: [string, string, string, number][] = [
    ["Pores", "72.4", "+2.0", 0.56],
    ["Acne", "81.0", "−0.6", 0.46],
    ["Redness", "64.2", "+0.9", 0.53],
    ["Texture", "69.8", "+3.4", 0.7],
  ];
  return (
    <>
      <rect x="14" y="14" width="192" height="412" className="fill-paper" />
      <text x="32" y="66" fontSize="8.5" letterSpacing="2" className="fill-clay font-mono">
        TODAY
      </text>
      <rect x="32" y="76" width="76" height="18" rx="9" className="fill-amber/15 stroke-amber/40" />
      <circle cx="42" cy="85" r="2.5" className="fill-amber" />
      <text x="50" y="88.5" fontSize="8.5" fontWeight="500" className="fill-amber">
        Too early
      </text>
      <text x="32" y="122" fontSize="16" className="fill-ink font-serif">
        Pores +2:
      </text>
      <text x="32" y="142" fontSize="16" className="fill-ink font-serif">
        within noise.
      </text>
      <text x="32" y="160" fontSize="9" className="fill-quiet">
        Don&apos;t celebrate yet.
      </text>
      {rows.map(([name, value, delta, pos], index) => {
        const y = 186 + index * 52;
        return (
          <g key={name}>
            <rect x="26" y={y} width="168" height="44" rx="12" className="fill-card stroke-line" />
            <text x="38" y={y + 18} fontSize="10" className="fill-ink">
              {name}
            </text>
            <text x="182" y={y + 19} textAnchor="end" fontSize="13" fontWeight="500" className="fill-ink font-mono">
              {value}
            </text>
            <text x="38" y={y + 33} fontSize="8" className="fill-quiet font-mono">
              {delta}
            </text>
            <rect x="74" y={y + 29} width="108" height="4" rx="2" className="fill-line" />
            <rect x="101" y={y + 29} width="54" height="4" rx="2" className="fill-amber/30" />
            <circle cx={74 + 108 * pos} cy={y + 31} r="3.5" className="fill-ink stroke-card" strokeWidth="1.5" />
          </g>
        );
      })}
      <rect x="62" y="400" width="96" height="5" rx="2.5" className="fill-ink/20" />
    </>
  );
}

function ClaimScreen() {
  return (
    <>
      <rect x="14" y="14" width="192" height="412" className="fill-paper" />
      <text x="32" y="66" fontSize="8.5" letterSpacing="2" className="fill-clay font-mono">
        BEFORE YOU BUY
      </text>
      {/* bottle */}
      <g transform="translate(78 84)">
        <rect x="22" y="0" width="20" height="16" rx="3" className="fill-ink/80" />
        <path d="M14 22c0-4 3-6 7-6h22c4 0 7 2 7 6v78c0 5-4 9-9 9H23c-5 0-9-4-9-9V22Z" className="fill-peach/60 stroke-ink/30" />
        <rect x="18" y="46" width="28" height="34" rx="4" className="fill-card" />
        <path d="M23 56h18M23 63h12M23 70h15" className="stroke-ink/40" strokeWidth="1.6" strokeLinecap="round" />
      </g>
      <text x="110" y="222" textAnchor="middle" fontSize="9" className="fill-quiet">
        “Visibly smaller pores”
      </text>
      <rect x="26" y="238" width="168" height="62" rx="12" className="fill-card stroke-line" />
      <text x="38" y="258" fontSize="8.5" className="fill-quiet">
        Simulated change, measured
      </text>
      <text x="38" y="284" fontSize="18" fontWeight="500" className="fill-ink font-mono">
        +0.8
      </text>
      <text x="182" y="284" textAnchor="end" fontSize="9" className="fill-quiet font-mono">
        noise ±2.1
      </text>
      <rect x="50" y="318" width="120" height="40" rx="20" className="fill-rose/15 stroke-rose" strokeWidth="1.5" />
      <text x="110" y="343" textAnchor="middle" fontSize="16" fontWeight="600" letterSpacing="1.5" className="fill-rose">
        SKIP
      </text>
      <text x="110" y="378" textAnchor="middle" fontSize="8.5" className="fill-quiet">
        Even if true, you couldn&apos;t see it.
      </text>
      <rect x="62" y="400" width="96" height="5" rx="2.5" className="fill-ink/20" />
    </>
  );
}

function VerdictScreen() {
  const line = "M40 300 L62 296 L84 302 L106 290 L128 284 L150 270 L172 262 L180 258";
  return (
    <>
      <rect x="14" y="14" width="192" height="412" className="fill-paper" />
      <text x="32" y="66" fontSize="8.5" letterSpacing="2" className="fill-clay font-mono">
        DAY 21 · YOUR PRODUCT
      </text>
      <text x="32" y="94" fontSize="17" className="fill-ink font-serif">
        Niacinamide serum
      </text>
      <text x="32" y="111" fontSize="9" className="fill-quiet">
        Pores · tested on one side
      </text>

      <rect x="26" y="128" width="168" height="92" rx="18" className="fill-sage/15 stroke-sage/50" />
      <circle cx="56" cy="164" r="16" className="fill-sage" />
      <path d="M49 164.5l5 5 9-10" fill="none" className="stroke-paper" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" />
      <text x="82" y="161" fontSize="9" letterSpacing="1.5" className="fill-sage font-mono">
        VERDICT
      </text>
      <text x="82" y="180" fontSize="19" fontWeight="600" className="fill-sage">
        Worth it
      </text>
      <text x="40" y="206" fontSize="8.5" className="fill-ink/70">
        Bigger than your normal wobble
      </text>

      <rect x="26" y="236" width="168" height="96" rx="14" className="fill-card stroke-line" />
      <rect x="36" y="280" width="148" height="26" className="fill-ink/[0.06]" />
      <path d={line} fill="none" className="stroke-series-a" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
      <circle cx="180" cy="258" r="3.5" className="fill-series-a stroke-card" strokeWidth="1.5" />
      <text x="36" y="252" fontSize="7.5" className="fill-quiet font-mono">
        YOUR MORNINGS
      </text>
      <text x="184" y="324" textAnchor="end" fontSize="7" className="fill-quiet font-mono">
        normal wobble
      </text>

      <g className="font-sans" fontSize="8.5">
        <rect x="26" y="346" width="80" height="34" rx="10" className="fill-card stroke-line" />
        <text x="36" y="360" className="fill-quiet">Sleep</text>
        <text x="36" y="373" className="fill-ink" fontWeight="500">ruled out</text>
        <rect x="114" y="346" width="80" height="34" rx="10" className="fill-card stroke-line" />
        <text x="124" y="360" className="fill-quiet">Stress</text>
        <text x="124" y="373" className="fill-ink" fontWeight="500">ruled out</text>
      </g>
      <rect x="62" y="400" width="96" height="5" rx="2.5" className="fill-ink/20" />
    </>
  );
}

/** Small spot illustrations for problem cards and steps. Decorative: hidden from assistive tech. */

export function LightsMini({ className }: { className?: string }) {
  const bulbs: [number, string, string][] = [
    [30, "fill-amber/70", "71"],
    [80, "fill-[#9fb6d6]/80", "64"],
    [130, "fill-ink/25", "77"],
  ];
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      {bulbs.map(([x, fill, score]) => (
        <g key={x}>
          <circle cx={x} cy="34" r="20" className={`${fill} opacity-30`} />
          <path d={`M${x - 8} 30a8 8 0 1 1 16 0c0 4-3 6-4 9h-8c-1-3-4-5-4-9Z`} className={`${fill} stroke-ink/50`} strokeWidth="1.2" />
          <path d={`M${x - 4} 43h8M${x - 3} 47h6`} className="stroke-ink/50" strokeWidth="1.2" strokeLinecap="round" />
          <ellipse cx={x} cy="80" rx="12" ry="15" className="fill-peach/50 stroke-ink/40" strokeWidth="1.2" />
          <text x={x} y="106" textAnchor="middle" fontSize="10" className="fill-ink font-mono">
            {score}
          </text>
        </g>
      ))}
    </svg>
  );
}

export function ConfoundersMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      <path d="M44 22a20 20 0 1 0 22 26 16 16 0 0 1-22-26Z" className="fill-amber/20 stroke-amber" strokeWidth="1.5" />
      <path d="M10 76h28l8-14 10 26 10-20 6 8h22" fill="none" className="stroke-rose" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M124 18s16 18 16 30a16 16 0 0 1-32 0c0-12 16-30 16-30Z" className="fill-sage/20 stroke-sage" strokeWidth="1.5" />
      <g className="fill-clay">
        <circle cx="112" cy="88" r="4" />
        <circle cx="126" cy="94" r="4" />
        <circle cx="140" cy="86" r="4" />
      </g>
      <path d="M104 100h44" className="stroke-line" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

export function ClaimMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      <rect x="44" y="10" width="20" height="14" rx="3" className="fill-ink/70" />
      <path d="M36 30c0-4 3-6 7-6h22c4 0 7 2 7 6v66c0 5-4 8-8 8H44c-4 0-8-3-8-8V30Z" className="fill-peach/60 stroke-ink/40" strokeWidth="1.2" />
      <rect x="42" y="50" width="24" height="28" rx="4" className="fill-card" />
      <path d="M46 58h16M46 64h10M46 70h13" className="stroke-ink/40" strokeWidth="1.4" strokeLinecap="round" />
      <circle cx="112" cy="52" r="22" className="fill-card/60 stroke-clay" strokeWidth="3" />
      <path d="M128 68l18 18" className="stroke-clay" strokeWidth="5" strokeLinecap="round" />
      <text x="112" y="57" textAnchor="middle" fontSize="13" className="fill-clay font-serif">
        ?
      </text>
    </svg>
  );
}

export function NoiseMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      <rect x="54" y="14" width="52" height="76" className="fill-amber/15" />
      <path d="M8 90C40 90 50 18 80 18s40 72 72 72" fill="none" className="stroke-ink/70" strokeWidth="2" />
      <path d="M8 90h144" className="stroke-line" strokeWidth="1.5" />
      <circle cx="92" cy="40" r="5" className="fill-ink stroke-card" strokeWidth="2" />
      <text x="80" y="104" textAnchor="middle" fontSize="8.5" className="fill-amber font-mono">
        normal wobble
      </text>
    </svg>
  );
}

export function VerdictMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      <rect x="16" y="14" width="128" height="22" rx="11" className="fill-sage/15 stroke-sage/50" />
      <circle cx="30" cy="25" r="3.5" className="fill-sage" />
      <text x="40" y="29" fontSize="10" className="fill-sage">
        Worth it
      </text>
      <rect x="16" y="44" width="128" height="22" rx="11" className="fill-amber/15 stroke-amber/50" />
      <circle cx="30" cy="55" r="3.5" className="fill-amber" />
      <text x="40" y="59" fontSize="10" className="fill-amber">
        Too early · day 19
      </text>
      <rect x="16" y="74" width="128" height="22" rx="11" className="fill-ink/5 stroke-line" />
      <circle cx="30" cy="85" r="3.5" className="fill-ink/50" />
      <text x="40" y="89" fontSize="10" className="fill-quiet">
        Not worth it
      </text>
    </svg>
  );
}

export function ScanMini({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 160 110" className={className} aria-hidden="true">
      {[0, 1, 2, 3, 4].map((index) => (
        <g key={index} transform={`translate(${14 + index * 28} 18)`}>
          <rect width="22" height="34" rx="6" className={index < 5 ? "fill-card stroke-line" : ""} />
          <ellipse cx="11" cy="16" rx="6" ry="8" className="fill-peach/60 stroke-ink/40" strokeWidth="1" />
        </g>
      ))}
      <path d="M14 70h132" className="stroke-line" strokeWidth="1.5" />
      <text x="80" y="90" textAnchor="middle" fontSize="11" className="fill-ink font-mono">
        MDC95 = 1.96·√2·SEM
      </text>
    </svg>
  );
}

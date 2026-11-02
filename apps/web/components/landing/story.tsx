"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cx } from "../ui/cx";
import { SectionTag, WRAP } from "./kit";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/*
 * The product, told in six scenes by one person in one room. The stage is a
 * single SVG; GSAP scrubs a timeline over it while the section is pinned.
 * Her right arm is a tiny rig (shoulder → elbow → hand) so she can hold a
 * bottle, scan with a phone, sleep, touch her face and point, all from one
 * set of points that tween between poses.
 */

const C = {
  skin: "#E8B693",
  skinShade: "#D29B77",
  hair: "#2B1E19",
  hairHi: "#4A332A",
  top: "#B9563C",
  sleeve: "#A64A33",
  lip: "#9A4636",
  blush: "#EE8D78",
  gold: "#E1AE4C",
  wallDay: "#F3E9DD",
  wallNight: "#23212E",
  frame: "#E5D6C3",
  frameNight: "#363342",
  sun: "#F29A62",
  moon: "#F4ECDF",
  ink: "#211C19",
  device: "#2B2623",
  card: "#FFFCF7",
  cardLine: "#E6DACB",
  quiet: "#857A6F",
  clay: "#DD7449",
  mint: "#7FD8B0",
  rose: "#E0626F",
  sage: "#3F8A67",
  glass: "#C7834B",
  label: "#FBF4EA",
};

const SCENES = [
  { tag: "The problem", title: "You bought a serum.", body: "Is it working? Your mirror can't tell you." },
  { tag: "Every morning", title: "Scan your face.", body: "YouCam scores acne, pores, redness and texture." },
  { tag: "Every night", title: "Wear your watch to bed.", body: "Sleep and stress change your skin too. It logs both." },
  { tag: "All day", title: "It buzzes when you touch your face.", body: "Every touch is counted." },
  { tag: "Over the weeks", title: "Every morning lands on one chart.", body: "Ups and downs inside your normal wobble don't count." },
  { tag: "The answer", title: "Worth it. Or not.", body: "Or too early, with the day you'll know." },
];

type Pose = { ex: number; ey: number; hx: number; hy: number };
const SHOULDER = { x: 514, y: 512 };
// elbow + hand for each pose, solved for ~115-unit upper arm and forearm
const POSES = {
  bottle: { ex: 566, ey: 614, hx: 470, hy: 552 },
  scan: { ex: 554, ey: 620, hx: 452, hy: 566 },
  sleep: { ex: 560, ey: 617, hx: 452, hy: 655 },
  touch: { ex: 586, ey: 424, hx: 478, hy: 384 },
  away: { ex: 620, ey: 486, hx: 522, hy: 448 },
  point: { ex: 586, ey: 602, hx: 640, hy: 500 },
  verdict: { ex: 618, ey: 562, hx: 590, hy: 450 },
} satisfies Record<string, Pose>;

const f1 = (n: number) => n.toFixed(1);

function armGeometry(p: Pose) {
  const dx = p.hx - p.ex;
  const dy = p.hy - p.ey;
  const along = (k: number) => [p.ex + dx * k, p.ey + dy * k] as const;
  // sleeve ends at 58% of the forearm; the watch sits on the bare wrist, clear of the hand
  const [wx, wy] = along(0.58);
  const [mx, my] = along(0.71);
  const angle = (Math.atan2(dy, dx) * 180) / Math.PI;
  return {
    upper: `M${SHOULDER.x} ${SHOULDER.y} L${f1(p.ex)} ${f1(p.ey)}`,
    fore: `M${f1(p.ex)} ${f1(p.ey)} L${f1(wx)} ${f1(wy)}`,
    wrist: `M${f1(wx)} ${f1(wy)} L${f1(p.hx)} ${f1(p.hy)}`,
    hand: `translate(${f1(p.hx)} ${f1(p.hy)}) rotate(${f1(angle)})`,
    watch: `translate(${f1(mx)} ${f1(my)}) rotate(${f1(angle)})`,
    props: `translate(${f1(p.hx)} ${f1(p.hy)})`,
  };
}

const START = armGeometry(POSES.bottle);
const FACE = "M420 232 C 468 232 496 266 496 318 C 496 374 462 414 420 414 C 378 414 344 374 344 318 C 344 266 372 232 420 232 Z";

const SCORES = [
  { label: "Texture", value: "64.3", y: 232, to: [410, 284] },
  { label: "Redness", value: "71.0", y: 288, to: [378, 354] },
  { label: "Pores", value: "58.1", y: 344, to: [421, 344] },
  { label: "Acne", value: "62.4", y: 400, to: [420, 402] },
];

const CHART_Y = [452, 441, 462, 447, 456, 444, 436, 420, 410, 398];
const CHART_LINE = CHART_Y.map((y, i) => `${i ? "L" : "M"}${680 + i * 24} ${y}`).join(" ");

function Chip({ x, y, w = 190, h = 42, className, children }: { x: number; y: number; w?: number; h?: number; className: string; children: React.ReactNode }) {
  return (
    <g className={className} opacity="0">
      <rect x={x} y={y} width={w} height={h} rx={h / 2} fill={C.card} stroke={C.cardLine} strokeWidth="1.5" />
      {children}
    </g>
  );
}

function Stage() {
  return (
    <svg viewBox="60 0 900 700" className="block h-full w-full" role="img" aria-label="Illustration: a woman tests a serum with her phone, her watch and her laptop, until she gets a verdict.">
      <defs>
        <clipPath id="st-window">
          <path d="M196 640 L196 262 A224 224 0 0 1 644 262 L644 640 Z" />
        </clipPath>
        <clipPath id="st-face">
          <path d={FACE} />
        </clipPath>
        <linearGradient id="st-sky-day" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#FBE3CB" />
          <stop offset="1" stopColor="#F3C29C" />
        </linearGradient>
        <linearGradient id="st-sky-night" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#121829" />
          <stop offset="1" stopColor="#2C3253" />
        </linearGradient>
        <linearGradient id="st-beam" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stopColor={C.clay} stopOpacity="0.45" />
          <stop offset="1" stopColor={C.clay} stopOpacity="0.04" />
        </linearGradient>
        <filter id="st-grain">
          <feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="3" seed="4" />
          <feColorMatrix values="0 0 0 -3.2 2.7  0 0 0 -3.2 2.7  0 0 0 -3.2 2.7  0 0 0 0 1" />
        </filter>
        <mask id="st-worn" maskUnits="userSpaceOnUse" x="590" y="150" width="370" height="240">
          <rect x="590" y="150" width="370" height="240" fill="#fff" filter="url(#st-grain)" />
        </mask>
      </defs>

      {/* ---------- room ---------- */}
      <rect x="0" y="0" width="1000" height="700" fill={C.wallDay} />
      <g>
        <rect x="760" y="168" width="150" height="8" rx="3" fill="#DCCDBA" />
        <path d="M800 130 L840 130 L835 168 L805 168 Z" fill="#D98C68" />
        <ellipse cx="810" cy="112" rx="9" ry="22" fill="#6E9E80" transform="rotate(-24 810 112)" />
        <ellipse cx="831" cy="108" rx="9" ry="24" fill="#5E8C70" transform="rotate(18 831 108)" />
        <ellipse cx="820" cy="98" rx="8" ry="26" fill="#7DAA8D" />
      </g>
      <rect className="st-night" x="0" y="0" width="1000" height="700" fill={C.wallNight} opacity="0" />

      <g clipPath="url(#st-window)">
        <rect x="196" y="30" width="448" height="620" fill="url(#st-sky-day)" />
        <g className="st-sun">
          <circle cx="306" cy="330" r="82" fill="#F7B98A" opacity="0.45" />
          <circle cx="306" cy="330" r="44" fill={C.sun} />
        </g>
        <path d="M196 600 Q300 548 420 584 T644 566 L644 650 L196 650 Z" fill="#EDBE99" />
        <g className="st-night" opacity="0">
          <rect x="196" y="30" width="448" height="620" fill="url(#st-sky-night)" />
          <circle cx="286" cy="150" r="32" fill={C.moon} />
          <circle cx="301" cy="140" r="28" fill="#141A2C" />
          {[
            [350, 96, 2.2],
            [410, 70, 1.6],
            [250, 236, 1.8],
            [610, 250, 2],
            [560, 110, 1.5],
            [480, 84, 1.7],
          ].map(([x, y, r]) => (
            <circle key={`${x}-${y}`} cx={x} cy={y} r={r} fill={C.moon} />
          ))}
          <path d="M196 600 Q300 548 420 584 T644 566 L644 650 L196 650 Z" fill="#1A1F33" />
        </g>
      </g>
      <path d="M196 640 L196 262 A224 224 0 0 1 644 262 L644 640" fill="none" stroke={C.frame} strokeWidth="14" />
      <path className="st-night" d="M196 640 L196 262 A224 224 0 0 1 644 262 L644 640" fill="none" stroke={C.frameNight} strokeWidth="14" opacity="0" />
      <rect x="176" y="634" width="488" height="18" rx="4" fill={C.frame} />

      {/* ---------- her ---------- */}
      <g className="st-breathe">
        <circle cx="420" cy="196" r="36" fill={C.hair} />
        <path d="M398 176 Q420 166 444 180" fill="none" stroke={C.hairHi} strokeWidth="3" strokeLinecap="round" />
        <path d="M332 330 C 326 240 368 200 420 200 C 472 200 514 240 508 330 C 506 372 498 396 486 410 L 354 410 C 342 396 334 372 332 330 Z" fill={C.hair} />
        <path d="M396 392 L396 470 Q420 484 444 470 L444 392 Z" fill={C.skinShade} />
        <path d="M292 700 C 290 574 314 500 374 476 Q420 498 466 476 C 526 500 550 574 548 700 Z" fill={C.top} />
        <path d="M374 476 Q420 498 466 476" fill="none" stroke={C.sleeve} strokeWidth="4" />
        <path d="M394 480 Q420 503 446 480" fill="none" stroke={C.gold} strokeWidth="1.6" />
        <circle cx="420" cy="502" r="4.5" fill={C.gold} />
        <path d="M330 512 C 304 568 296 640 302 712" fill="none" stroke={C.sleeve} strokeWidth="48" strokeLinecap="round" />

        <ellipse cx="345" cy="328" rx="11" ry="17" fill={C.skinShade} />
        <ellipse cx="495" cy="328" rx="11" ry="17" fill={C.skinShade} />
        <circle cx="344" cy="352" r="4.5" fill={C.gold} />
        <circle cx="496" cy="352" r="4.5" fill={C.gold} />
        <path d={FACE} fill={C.skin} />
        <ellipse cx="380" cy="358" rx="15" ry="8" fill={C.blush} opacity="0.45" />
        <ellipse cx="460" cy="358" rx="15" ry="8" fill={C.blush} opacity="0.45" />

        <path d="M378 300 Q392 292 406 297" fill="none" stroke={C.hair} strokeWidth="4.5" strokeLinecap="round" />
        <path d="M434 297 Q448 292 462 300" fill="none" stroke={C.hair} strokeWidth="4.5" strokeLinecap="round" />
        <g className="st-eyes-open st-blink">
          <g className="st-pupils">
            <ellipse cx="393" cy="324" rx="6" ry="7.5" fill={C.hair} />
            <ellipse cx="447" cy="324" rx="6" ry="7.5" fill={C.hair} />
            <circle cx="395" cy="321" r="1.8" fill="#fff" />
            <circle cx="449" cy="321" r="1.8" fill="#fff" />
          </g>
          <path d="M386 318 L380 314 M454 318 L460 314" stroke={C.hair} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="st-eyes-closed" opacity="0" fill="none" stroke={C.hair} strokeWidth="3.5" strokeLinecap="round">
          <path d="M385 324 Q393 331 401 324" />
          <path d="M439 324 Q447 331 455 324" />
        </g>
        <path d="M421 330 Q415 350 419 356 Q424 359 429 355" fill="none" stroke={C.skinShade} strokeWidth="3.5" strokeLinecap="round" />
        <path className="st-mouth-worried" d="M405 385 Q420 377 435 385" fill="none" stroke={C.lip} strokeWidth="4" strokeLinecap="round" />
        <path className="st-mouth-neutral" d="M406 381 Q420 387 434 381" fill="none" stroke={C.lip} strokeWidth="4" strokeLinecap="round" opacity="0" />
        <path className="st-mouth-smile" d="M401 376 Q420 400 439 376 Q420 384 401 376 Z" fill={C.lip} stroke={C.lip} strokeWidth="2" strokeLinejoin="round" opacity="0" />

        <path d="M344 312 C 340 254 376 222 420 222 C 466 222 500 254 496 312 C 488 286 470 266 442 258 C 410 250 372 262 352 292 C 348 298 346 305 344 312 Z" fill={C.hair} />
        <path d="M388 236 Q410 227 444 232" fill="none" stroke={C.hairHi} strokeWidth="3" strokeLinecap="round" />
      </g>

      {/* scan beam + sweeping line, clipped to her face */}
      <polygon className="st-beam" points="436,482 468,482 512,232 328,232" fill="url(#st-beam)" opacity="0" />
      <g clipPath="url(#st-face)">
        <g className="st-scanline" opacity="0">
          <rect x="330" y="226" width="180" height="16" fill={C.clay} opacity="0.25" />
          <line x1="330" x2="510" y1="234" y2="234" stroke={C.clay} strokeWidth="3" />
        </g>
      </g>

      {/* laptop sits behind her arm, so the pointing hand lands in front of the screen */}
      <g className="st-laptop" opacity="0">
        <rect x="648" y="352" width="272" height="176" rx="12" fill={C.device} />
        <rect x="660" y="364" width="248" height="152" rx="4" fill={C.card} />
        <text x="674" y="386" fontSize="10" letterSpacing="1.2" fill={C.quiet} style={{ fontFamily: "var(--font-lab), monospace" }}>
          PORES · 28 MORNINGS
        </text>
        <g className="st-band" opacity="0">
          <rect x="672" y="426" width="224" height="44" fill={C.clay} opacity="0.13" />
          <path d="M672 426 H896 M672 470 H896" stroke={C.clay} strokeOpacity="0.5" strokeDasharray="3 4" />
        </g>
        <path className="st-line" d={CHART_LINE} fill="none" stroke={C.ink} strokeWidth="2.5" strokeLinejoin="round" pathLength={1} strokeDasharray="1" strokeDashoffset="1" />
        {CHART_Y.map((y, i) => (
          <circle key={i} className="st-dot" cx={680 + i * 24} cy={y} r="4.5" fill={y < 426 ? C.sage : C.ink} opacity="0" />
        ))}
        <text className="st-clears" x="896" y="500" textAnchor="end" fontSize="10" letterSpacing="1.2" fill={C.sage} opacity="0" style={{ fontFamily: "var(--font-lab), monospace" }}>
          ↑ CLEARS THE WOBBLE
        </text>
        <path d="M620 528 L948 528 L938 544 Q935 549 928 549 L640 549 Q633 549 630 544 Z" fill="#D8CEC1" />
      </g>

      {/* ---------- her right arm (the rig) ---------- */}
      <g className="st-breathe">
        <path className="st-arm-upper" d={START.upper} fill="none" stroke={C.sleeve} strokeWidth="46" strokeLinecap="round" />
        <path className="st-arm-fore" d={START.fore} fill="none" stroke={C.sleeve} strokeWidth="40" strokeLinecap="round" />
        <path className="st-arm-wrist" d={START.wrist} fill="none" stroke={C.skin} strokeWidth="24" strokeLinecap="round" />
        <g className="st-props" transform={START.props}>
          <g className="st-bottle">
            <path d="M-7 -86 L-7 -99 Q0 -114 7 -99 L7 -86 Z" fill={C.device} />
            <rect x="-9" y="-88" width="18" height="12" rx="2" fill={C.device} />
            <rect x="-19" y="-76" width="38" height="62" rx="9" fill={C.glass} />
            <rect x="-13" y="-70" width="5" height="46" rx="2.5" fill="#fff" opacity="0.35" />
            <rect x="-15" y="-60" width="30" height="26" rx="3" fill={C.label} />
            <path d="M-9 -52 H9 M-9 -45 H4" stroke={C.glass} strokeWidth="2" strokeLinecap="round" />
          </g>
          <g className="st-phone" opacity="0">
            <rect x="-22" y="-88" width="44" height="82" rx="9" fill={C.device} />
            <rect x="-17" y="-82" width="16" height="16" rx="5" fill="#16120F" />
            <circle cx="-9" cy="-74" r="4" fill="#3B342F" />
          </g>
        </g>
        <g className="st-hand" transform={START.hand}>
          <ellipse cx="5" cy="0" rx="21" ry="17" fill={C.skin} />
          <ellipse cx="-3" cy="-13" rx="9" ry="6" fill={C.skin} />
          <path d="M14 -8 Q22 0 14 8" fill="none" stroke={C.skinShade} strokeWidth="2.5" strokeLinecap="round" />
        </g>
        <g className="st-watch" transform={START.watch}>
          <circle className="st-watch-glow" r="30" fill={C.mint} opacity="0" />
          <circle className="st-ripple" r="14" fill="none" stroke={C.mint} strokeWidth="3" opacity="0" />
          <circle className="st-ripple" r="14" fill="none" stroke={C.mint} strokeWidth="3" opacity="0" />
          <rect x="-9" y="-19" width="18" height="38" rx="4" fill={C.ink} />
          <circle r="14" fill="#3A332E" />
          <circle className="st-watch-screen" r="10.5" fill="#141210" />
        </g>
      </g>

      {/* ---------- scene props ---------- */}
      {["?", "?", "?"].map((q, i) => (
        <text
          key={i}
          className="st-q"
          x={[534, 584, 506][i]}
          y={[268, 214, 190][i]}
          fontSize={[76, 56, 40][i]}
          fill={C.clay}
          fontStyle="italic"
          fontWeight="600"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          opacity="0"
        >
          {q}
        </text>
      ))}

      {SCORES.map((score) => (
        <Chip key={score.label} x={96} y={score.y} className="st-chip-score">
          <line x1="286" y1={score.y + 21} x2={score.to[0]} y2={score.to[1]} stroke={C.clay} strokeWidth="1.6" strokeDasharray="4 4" />
          <circle cx={score.to[0]} cy={score.to[1]} r="4.5" fill={C.clay} />
          <text x="116" y={score.y + 27} fontSize="14" letterSpacing="1.5" fill={C.quiet} style={{ fontFamily: "var(--font-lab), monospace" }}>
            {score.label.toUpperCase()}
          </text>
          <text x="270" y={score.y + 28} textAnchor="end" fontSize="18" fontWeight="700" fill={C.ink} style={{ fontFamily: "var(--font-lab), monospace" }}>
            {score.value}
          </text>
        </Chip>
      ))}

      {[0, 1, 2].map((i) => (
        <text
          key={i}
          className="st-z"
          x={[524, 556, 596][i]}
          y={[256, 216, 168][i]}
          fontSize={[32, 46, 62][i]}
          fill={C.moon}
          fontStyle="italic"
          style={{ fontFamily: "var(--font-display), Georgia, serif" }}
          opacity="0"
        >
          z
        </text>
      ))}
      {[
        ["Sleep", "6.1 h", 452],
        ["Stress", "high", 506],
      ].map(([label, value, y]) => (
        <Chip key={label as string} x={96} y={y as number} className="st-chip-sleep">
          <line x1="286" y1={(y as number) + 21} x2="462" y2="640" stroke={C.mint} strokeWidth="1.6" strokeDasharray="4 4" />
          <text x="116" y={(y as number) + 27} fontSize="14" letterSpacing="1.5" fill={C.quiet} style={{ fontFamily: "var(--font-lab), monospace" }}>
            {(label as string).toUpperCase()}
          </text>
          <text x="270" y={(y as number) + 28} textAnchor="end" fontSize="18" fontWeight="700" fill={C.ink} style={{ fontFamily: "var(--font-lab), monospace" }}>
            {value}
          </text>
        </Chip>
      ))}

      <Chip x={640} y={296} w={210} h={84} className="st-chip-touch">
        <line x1="640" y1="338" x2="512" y2="390" stroke={C.mint} strokeWidth="1.6" strokeDasharray="4 4" />
        <text x="664" y="328" fontSize="13" letterSpacing="1.5" fill={C.quiet} style={{ fontFamily: "var(--font-lab), monospace" }}>
          FACE TOUCHES
        </text>
        <text className="st-touch-count" x="664" y="366" fontSize="30" fontWeight="700" fill={C.ink} style={{ fontFamily: "var(--font-lab), monospace" }}>
          1
        </text>
        <text x="698" y="364" fontSize="13" fill={C.quiet} style={{ fontFamily: "var(--font-lab), monospace" }}>
          TODAY
        </text>
      </Chip>

      <g className="st-stamp" opacity="0" mask="url(#st-worn)">
        <rect x="640" y="218" width="260" height="100" rx="12" fill={C.card} fillOpacity="0.6" stroke={C.sage} strokeWidth="7" />
        <rect x="651" y="229" width="238" height="78" rx="6" fill="none" stroke={C.sage} strokeWidth="2.5" />
        <text x="770" y="276" textAnchor="middle" fontSize="30" fontWeight="800" letterSpacing="1" fill={C.sage} style={{ fontFamily: "var(--font-lab), monospace" }}>
          WORTH IT
        </text>
        <text x="770" y="298" textAnchor="middle" fontSize="12" letterSpacing="4" fill={C.sage} style={{ fontFamily: "var(--font-lab), monospace" }}>
          DAY 19
        </text>
      </g>
      {[
        [556, 340, 1],
        [624, 324, 0.75],
        [634, 392, 0.6],
      ].map(([x, y, s]) => (
        <path key={`${x}-${y}`} className="st-spark" d="M0 -12 L3 -3 L12 0 L3 3 L0 12 L-3 3 L-12 0 L-3 -3 Z" fill={C.gold} transform={`translate(${x} ${y}) scale(${s})`} opacity="0" />
      ))}

      <text x="84" y="684" fontSize="11" letterSpacing="2" fill="#A39684" style={{ fontFamily: "var(--font-lab), monospace" }}>
        ILLUSTRATION
      </text>
    </svg>
  );
}

export function Story() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const one = <T extends Element>(selector: string) => scope.querySelector<T>(selector) as T;
      const all = <T extends Element>(selector: string) => Array.from(scope.querySelectorAll<T>(selector));
      const parts = {
        upper: one<SVGPathElement>(".st-arm-upper"),
        fore: one<SVGPathElement>(".st-arm-fore"),
        wrist: one<SVGPathElement>(".st-arm-wrist"),
        hand: one<SVGGElement>(".st-hand"),
        watch: one<SVGGElement>(".st-watch"),
        props: one<SVGGElement>(".st-props"),
      };
      const captions = all<HTMLElement>(".st-cap");
      const ticks = all<HTMLElement>(".st-tick");
      const stepEl = one<HTMLElement>(".st-step");
      const touchEl = one<SVGTextElement>(".st-touch-count");

      const arm: Pose = { ...POSES.bottle };
      const drawArm = () => {
        const g = armGeometry(arm);
        parts.upper.setAttribute("d", g.upper);
        parts.fore.setAttribute("d", g.fore);
        parts.wrist.setAttribute("d", g.wrist);
        parts.hand.setAttribute("transform", g.hand);
        parts.watch.setAttribute("transform", g.watch);
        parts.props.setAttribute("transform", g.props);
      };

      let scene = -1;
      let touches = -1;
      const onTime = (t: number) => {
        drawArm();
        const next = Math.max(0, Math.min(SCENES.length - 1, Math.floor(t + 0.04)));
        if (next !== scene) {
          captions.forEach((caption, i) =>
            gsap.to(caption, { autoAlpha: i === next ? 1 : 0, y: i === next ? 0 : i < next ? -18 : 18, duration: 0.45, ease: "power3.out", overwrite: true }),
          );
          ticks.forEach((tick, i) => {
            tick.style.backgroundColor = i <= next ? "rgb(var(--clay))" : "";
          });
          stepEl.textContent = String(next + 1).padStart(2, "0");
          scene = next;
        }
        const count = t >= 3.72 ? 2 : 1;
        if (count !== touches) {
          touchEl.textContent = String(count);
          touches = count;
        }
      };

      const build = (tl: gsap.core.Timeline) => {
        const pose = (to: Pose, at: number, duration = 0.26) => tl.to(arm, { ...to, duration, ease: "power2.inOut" }, at);
        const fade = (targets: string | string[], opacity: number, at: number, duration = 0.12) => tl.to(targets, { opacity, duration }, at);

        gsap.set(".st-q", { y: 18 });
        gsap.set([".st-chip-score", ".st-chip-sleep", ".st-chip-touch"], { x: -16 });
        gsap.set(".st-laptop", { x: 70 });
        gsap.set(".st-stamp", { svgOrigin: "770 268", scale: 2.4, rotation: -26 });

        // 0 · the problem: worried, bottle in hand, question marks rise
        tl.to(".st-q", { opacity: 1, y: 0, stagger: 0.08, duration: 0.22 }, 0.08).to(".st-q", { y: -16, duration: 0.55 }, 0.3);

        // 1 · morning scan
        fade(".st-q", 0, 0.95);
        fade(".st-bottle", 0, 1.0, 0.08);
        fade(".st-phone", 1, 1.06, 0.08);
        pose(POSES.scan, 1.0);
        tl.to(".st-sun", { y: -150, duration: 0.4, ease: "power1.out" }, 1.0);
        fade(".st-mouth-worried", 0, 1.0, 0.06);
        fade(".st-mouth-neutral", 1, 1.0, 0.06);
        fade(".st-beam", 1, 1.26, 0.08);
        fade(".st-scanline", 1, 1.3, 0.04);
        tl.to(".st-scanline", { y: 176, duration: 0.45 }, 1.3);
        tl.to(".st-chip-score", { opacity: 1, x: 0, stagger: 0.09, duration: 0.12 }, 1.36);
        fade(".st-scanline", 0, 1.78, 0.04);

        // 2 · night: watch on, eyes closed
        fade([".st-beam", ".st-chip-score", ".st-phone"], 0, 2.0);
        pose(POSES.sleep, 2.0);
        fade(".st-night", 1, 2.0, 0.3);
        tl.to(".st-sun", { y: 260, duration: 0.3 }, 2.0);
        fade(".st-eyes-open", 0, 2.24, 0.04);
        fade(".st-eyes-closed", 1, 2.24, 0.04);
        tl.to(".st-z", { opacity: 1, y: -14, stagger: 0.1, duration: 0.3 }, 2.3);
        fade(".st-watch-glow", 0.45, 2.34, 0.1);
        tl.to(".st-watch-screen", { fill: C.mint, duration: 0.06 }, 2.34);
        tl.to(".st-chip-sleep", { opacity: 1, x: 0, stagger: 0.1, duration: 0.12 }, 2.44);

        // 3 · day: a hand to the cheek, the watch buzzes, twice
        fade([".st-night", ".st-z", ".st-chip-sleep", ".st-watch-glow"], 0, 3.0, 0.2);
        tl.to(".st-sun", { y: -150, duration: 0.3 }, 3.0);
        tl.to(".st-watch-screen", { fill: "#141210", duration: 0.05 }, 3.0);
        fade(".st-eyes-open", 1, 3.06, 0.04);
        fade(".st-eyes-closed", 0, 3.06, 0.04);
        pose(POSES.touch, 3.1, 0.24);
        for (const at of [3.34, 3.74]) {
          tl.set(".st-ripple", { attr: { r: 14 }, opacity: 0.9 }, at);
          tl.to(".st-ripple", { attr: { r: 64 }, opacity: 0, stagger: 0.07, duration: 0.24 }, at);
          tl.to(".st-watch-screen", { fill: C.mint, duration: 0.03 }, at);
          tl.to(".st-watch-screen", { fill: "#141210", duration: 0.03 }, at + 0.2);
        }
        tl.to(".st-chip-touch", { opacity: 1, x: 0, duration: 0.12 }, 3.34);
        pose(POSES.away, 3.56, 0.08);
        pose(POSES.touch, 3.64, 0.1);

        // 4 · the chart
        fade(".st-chip-touch", 0, 4.0);
        pose(POSES.point, 4.0);
        tl.to(".st-laptop", { opacity: 1, x: 0, duration: 0.26, ease: "power2.out" }, 4.02);
        tl.to(".st-pupils", { x: 4, duration: 0.12 }, 4.05);
        fade(".st-band", 1, 4.3, 0.1);
        tl.to(".st-dot", { opacity: 1, stagger: 0.045, duration: 0.04 }, 4.36);
        tl.to(".st-line", { strokeDashoffset: 0, duration: 0.42 }, 4.36);
        fade(".st-clears", 1, 4.78, 0.08);

        // 5 · the verdict
        tl.to(".st-laptop", { opacity: 0, x: 70, duration: 0.2 }, 5.0);
        tl.to(".st-pupils", { x: 0, duration: 0.1 }, 5.0);
        pose(POSES.verdict, 5.0);
        fade(".st-bottle", 1, 5.04, 0.08);
        fade(".st-mouth-neutral", 0, 5.24, 0.04);
        fade(".st-mouth-smile", 1, 5.24, 0.04);
        tl.to(".st-stamp", { opacity: 1, scale: 1, rotation: -9, duration: 0.12, ease: "power4.in" }, 5.3);
        tl.to(".st-spark", { opacity: 1, stagger: 0.05, duration: 0.08 }, 5.42);
        tl.set({}, {}, SCENES.length);
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          // matchMedia only runs when a condition matches, so both widths are listed.
          wide: "(min-width: 1024px)",
          narrow: "(max-width: 1023.98px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { wide, reduce } = context.conditions as { wide: boolean; narrow: boolean; reduce: boolean };
          if (reduce) {
            // no pin: one representative frame (the morning scan) and every caption as a list
            scope.dataset.static = "true";
            const tl = gsap.timeline({ paused: true });
            build(tl);
            tl.time(1.8);
            drawArm();
            return () => {
              delete scope.dataset.static;
            };
          }
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: scope,
              start: "top top",
              end: wide ? "+=4400" : "+=3600",
              pin: true,
              scrub: 0.6,
              anticipatePin: 1,
            },
            // `this` is the timeline; it can fire during construction, before a variable would be assigned.
            onUpdate(this: gsap.core.Timeline) {
              onTime(this.time());
            },
          });
          build(tl);
          onTime(0);
        },
      );
    },
    { scope: root },
  );

  return (
    <section id="story" ref={root} className="theme-night relative h-[100svh] min-h-[640px] overflow-hidden bg-paper text-ink" aria-label="How WorthIt works">
      <div className={cx(WRAP, "flex h-full flex-col pb-6 pt-20 md:pt-24")}>
        <SectionTag index="01" label="How it works" fig="Keep scrolling" />
        <div className="mt-5 grid min-h-0 flex-1 content-center items-center gap-6 md:mt-6 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.6fr)] lg:gap-12">
          <div className="st-copy order-2 lg:order-1">
            <p className="st-counter num font-display text-[clamp(2.6rem,6vw,6rem)] font-medium leading-none tracking-[-0.04em]">
              <span className="st-step">01</span>
              <span className="ml-2 align-top text-[0.32em] text-quiet">/ 0{SCENES.length}</span>
            </p>
            <div aria-hidden="true" className="st-ticks mt-4 flex gap-1.5 md:mt-6">
              {SCENES.map((scene) => (
                <span key={scene.tag} className="st-tick h-[3px] flex-1 rounded-full bg-line transition-colors duration-300" />
              ))}
            </div>
            <ol className="st-caps relative mt-5 min-h-[8.5rem] md:mt-8 md:min-h-[10rem]">
              {SCENES.map((scene, index) => (
                <li key={scene.tag} className={cx("st-cap absolute inset-x-0 top-0", index === 0 ? "" : "invisible opacity-0")}>
                  <p className="lab text-clay">{scene.tag}</p>
                  <h3 className="mt-2 font-display text-[clamp(1.8rem,3.2vw,3.2rem)] font-medium leading-[1.02] tracking-[-0.02em]">{scene.title}</h3>
                  <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-quiet md:text-lg">{scene.body}</p>
                </li>
              ))}
            </ol>
          </div>
          <div className="order-1 lg:order-2">
            <div className="relative mx-auto aspect-[9/7] w-[min(100%,calc((100svh_-_12rem)*1.2857))] overflow-hidden rounded-[28px] border border-line shadow-lift">
              <Stage />
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

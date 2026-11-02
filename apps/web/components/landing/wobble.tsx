"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cx } from "../ui/cx";
import { SectionTag, Stamp, WRAP } from "./kit";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* Illustrative data: one person, one serum, 28 mornings. */
const BASELINE = [60.4, 59.1, 61.2, 60.0, 59.6];
const DAYS = [
  59.2, 61.4, 62.1, 60.3, 58.4, 59.0, 57.9, 60.6, 61.0, 59.7, 60.9, 61.8, 60.5, 61.3, 61.9, 61.6, 62.2, 62.3, 63.6, 63.3, 64.2, 64.0, 64.9, 64.4, 65.1,
  64.8, 65.5, 65.2,
];
const MEAN = 60;
const MDC = 2.4;
const CROSS_DAY = 19;

const VW = 1000;
const VH = 560;
const TOP = 40;
const BOTTOM = 492;
const Y_MIN = 54;
const Y_MAX = 68;
const BASE_X = [62, 92, 122, 152, 182];
const DX0 = 270;
const DX1 = 968;

const sx = (day: number) => DX0 + ((day - 1) / (DAYS.length - 1)) * (DX1 - DX0);
const sy = (value: number) => TOP + (1 - (value - Y_MIN) / (Y_MAX - Y_MIN)) * (BOTTOM - TOP);
const valueAt = (day: number) => {
  const i = Math.min(DAYS.length - 1, Math.max(0, day - 1));
  const lo = Math.floor(i);
  const hi = Math.min(DAYS.length - 1, lo + 1);
  return DAYS[lo] + (DAYS[hi] - DAYS[lo]) * (i - lo);
};

const LINE = DAYS.map((value, i) => `${i ? "L" : "M"}${sx(i + 1).toFixed(1)} ${sy(value).toFixed(1)}`).join(" ");
const BAND_TOP = sy(MEAN + MDC);
const BAND_BOTTOM = sy(MEAN - MDC);
// where the line leaves the band (between day 18 and 19), as an offset along the gradient
const CROSS_X = sx(18 + (MEAN + MDC - DAYS[17]) / (DAYS[18] - DAYS[17]));
const CROSS_OFFSET = (CROSS_X - DX0) / (DX1 - DX0);

const CAPTIONS = [
  { tag: "Baseline", title: "Five scans, back to back.", body: "Their spread is your normal wobble." },
  { tag: "Day 3", title: "“It's working!”", body: "Inside the wobble. Doesn't count." },
  { tag: "Day 7", title: "“It stopped working.”", body: "Still inside. Still nothing." },
  { tag: "Days 10–18", title: "Too early.", body: "And it tells you so." },
  { tag: "Day 19", title: "Now it counts.", body: "Clear of the wobble, and staying there." },
];

/* Timeline (in timeline seconds): baseline + band, then 28 mornings, then a short hold on the verdict. */
const T_LINE_START = 1.4;
const T_LINE_END = 7.2;
const T_TOTAL = 8;
const dayFromTime = (t: number) =>
  t < T_LINE_START ? 0 : t >= T_LINE_END ? DAYS.length : 1 + ((t - T_LINE_START) / (T_LINE_END - T_LINE_START)) * (DAYS.length - 1);

function Note({ x, y, text, className }: { x: number; y: number; text: string; className: string }) {
  const width = text.length * 9.6 + 34;
  // outer group places the note; the inner one is what GSAP fades and nudges
  return (
    <g transform={`translate(${x} ${y})`}>
      <g className={className} opacity="0">
        <rect x={-width / 2} y={-19} width={width} height={36} rx={18} className="fill-card stroke-line" />
        <text textAnchor="middle" y={6} fontSize="18" className="fill-ink font-display italic">
          {text}
        </text>
        <line x1={-width / 2 + 14} x2={width / 2 - 14} y1={0} y2={0} className="stroke-rose" strokeWidth="2" />
      </g>
    </g>
  );
}

export function Wobble() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const scope = root.current;
      if (!scope) return;
      const one = <T extends Element>(selector: string) => scope.querySelector<T>(selector) as T;
      const all = <T extends Element>(selector: string) => Array.from(scope.querySelectorAll<T>(selector));
      const clip = one<SVGRectElement>(".wb-clip");
      const cursor = one<SVGGElement>(".wb-cursor");
      const cursorDot = one<SVGCircleElement>(".wb-cursor-dot");
      const dots = all<SVGCircleElement>(".wb-dot");
      const captions = all<HTMLElement>(".wb-caption");
      const dayEl = one<HTMLElement>(".wb-day");
      const scoreEl = one<HTMLElement>(".wb-score");
      const note3 = one<SVGGElement>(".wb-note3");
      const note7 = one<SVGGElement>(".wb-note7");
      const ticks = all<HTMLElement>(".wb-tick");

      const slam = gsap
        .timeline({ paused: true })
        .fromTo(".wb-stamp", { autoAlpha: 0, scale: 2.6, rotate: -26 }, { autoAlpha: 1, scale: 1, rotate: -8, duration: 0.3, ease: "power4.in" })
        .fromTo(".wb-chart", { x: 0 }, { x: 6, duration: 0.05, repeat: 3, yoyo: true, ease: "none" })
        .fromTo(".wb-ring", { attr: { r: 6 }, opacity: 0.9 }, { attr: { r: 46 }, opacity: 0, duration: 0.8, ease: "expo.out", immediateRender: false }, "<");

      const shown = DAYS.map(() => false);
      let dotR = 5;
      let phase = -1;
      let stamped = false;
      let notes = [false, false];

      const render = (d: number) => {
        const started = d >= 1;
        const x = started ? sx(Math.min(d, DAYS.length)) : DX0;
        clip.setAttribute("width", String(Math.max(0, x - DX0 + 4)));
        cursor.setAttribute("opacity", started && d < DAYS.length ? "1" : "0");
        cursor.setAttribute("transform", `translate(${x.toFixed(1)} 0)`);
        cursorDot.setAttribute("cy", sy(valueAt(Math.max(1, d))).toFixed(1));

        dots.forEach((dot, i) => {
          const on = d >= i + 1;
          if (on === shown[i]) return;
          shown[i] = on;
          gsap.to(dot, { opacity: on ? 1 : 0, attr: { r: on ? dotR : 0 }, duration: 0.25, overwrite: true });
        });

        const nextNotes = [d >= 3, d >= 7];
        [note3, note7].forEach((note, i) => {
          if (nextNotes[i] !== notes[i]) gsap.to(note, { opacity: nextNotes[i] ? 1 : 0, y: nextNotes[i] ? 0 : 8, duration: 0.3, overwrite: true });
        });
        notes = nextNotes;

        const day = Math.max(1, Math.min(DAYS.length, Math.floor(d)));
        dayEl.textContent = started ? String(day).padStart(2, "0") : "00";
        scoreEl.textContent = (started ? DAYS[day - 1] : MEAN).toFixed(1);

        const next = d < 1 ? 0 : d < 5 ? 1 : d < 10 ? 2 : d < CROSS_DAY ? 3 : 4;
        if (next !== phase) {
          captions.forEach((caption, i) =>
            gsap.to(caption, { autoAlpha: i === next ? 1 : 0, y: i === next ? 0 : i < next ? -18 : 18, duration: 0.45, ease: "power3.out", overwrite: true }),
          );
          ticks.forEach((tick, i) => {
            tick.style.backgroundColor = i <= next ? "rgb(var(--clay))" : "";
          });
          phase = next;
        }

        if (d >= CROSS_DAY && !stamped) {
          stamped = true;
          slam.play();
        } else if (d < CROSS_DAY && stamped) {
          stamped = false;
          slam.reverse();
        }
      };

      const mm = gsap.matchMedia();
      mm.add(
        {
          // matchMedia only runs the callback when at least one condition matches, so both widths are listed.
          wide: "(min-width: 768px)",
          narrow: "(max-width: 767.98px)",
          reduce: "(prefers-reduced-motion: reduce)",
        },
        (context) => {
          const { wide, reduce } = context.conditions as { wide: boolean; narrow: boolean; reduce: boolean };
          // the chart is drawn much smaller on a phone, so its dots get bigger in user units
          dotR = wide ? 5 : 11;
          if (reduce) {
            render(DAYS.length);
            slam.progress(1);
            return;
          }
          render(0);
          const tl = gsap.timeline({
            defaults: { ease: "none" },
            scrollTrigger: {
              trigger: root.current,
              start: "top top",
              end: wide ? "+=3200" : "+=2400",
              pin: true,
              scrub: 0.7,
              anticipatePin: 1,
              invalidateOnRefresh: true,
            },
            // `this` is the timeline; it can fire during construction, before `tl` is assigned.
            onUpdate(this: gsap.core.Timeline) {
              render(dayFromTime(this.time()));
            },
          });
          // SVG attributes, not transforms: scaled <g> origins drift after a ScrollTrigger refresh.
          const mid = (BAND_TOP + BAND_BOTTOM) / 2;
          const open = { duration: 0.5, ease: "power2.out" };
          tl.fromTo(".wb-base", { attr: { r: 0 } }, { attr: { r: wide ? 7 : 14 }, stagger: 0.12, duration: 0.3, ease: "back.out(2.5)" }, 0)
            .fromTo(".wb-band", { opacity: 0 }, { opacity: 1, duration: 0.25 }, 0.75)
            .fromTo(".wb-band-rect", { attr: { y: mid, height: 0 } }, { attr: { y: BAND_TOP, height: BAND_BOTTOM - BAND_TOP }, ...open }, 0.75)
            .fromTo(".wb-band-top", { attr: { y1: mid, y2: mid } }, { attr: { y1: BAND_TOP, y2: BAND_TOP }, ...open }, 0.75)
            .fromTo(".wb-band-bottom", { attr: { y1: mid, y2: mid } }, { attr: { y1: BAND_BOTTOM, y2: BAND_BOTTOM }, ...open }, 0.75)
            .fromTo(".wb-band-label", { opacity: 0 }, { opacity: 1, duration: 0.3 }, 1.05)
            .set({}, {}, T_TOTAL);
        },
      );
    },
    { scope: root },
  );

  return (
    <section
      id="wobble"
      ref={root}
      className="theme-night relative h-[100svh] min-h-[600px] overflow-hidden bg-paper text-ink"
      aria-label="The wobble: how a verdict forms"
    >
      <div aria-hidden="true" className="dotgrid absolute inset-0 opacity-[0.35]" />
      <div className={cx(WRAP, "relative flex h-full flex-col pb-6 pt-20 md:pb-10 md:pt-24")}>
        <SectionTag index="02" label="The wobble" fig="Fig. 02 · illustrative" />

        <div className="mt-5 grid min-h-0 flex-1 gap-5 md:mt-8 md:grid-cols-[minmax(0,0.78fr)_minmax(0,2fr)] md:gap-10">
          {/* readout + story */}
          <div className="order-2 flex min-h-0 flex-col md:order-1">
            <div className="flex items-end gap-6">
              <div>
                <p className="lab text-quiet">Day</p>
                <p className="num font-display text-[clamp(4rem,10vw,9.5rem)] font-medium leading-[0.8] tracking-[-0.04em]">
                  <span className="wb-day">00</span>
                </p>
              </div>
              <div className="pb-1">
                <p className="lab text-quiet">Raw score</p>
                <p className="num font-lab text-lg md:text-xl">
                  <span className="wb-score">60.0</span>
                </p>
              </div>
            </div>
            <div aria-hidden="true" className="mt-5 flex gap-1.5 md:mt-8">
              {CAPTIONS.map((caption) => (
                <span key={caption.tag} className="wb-tick h-[3px] flex-1 rounded-full bg-line transition-colors duration-300" />
              ))}
            </div>
            <div className="relative mt-5 min-h-[7.5rem] flex-1 md:mt-8">
              {CAPTIONS.map((caption, index) => (
                <div key={caption.tag} className={cx("wb-caption absolute inset-x-0 top-0", index === 0 ? "" : "invisible opacity-0")}>
                  <p className="lab text-clay">{caption.tag}</p>
                  <p className="mt-2 font-display text-[clamp(1.6rem,2.6vw,2.6rem)] italic leading-[1.05]">{caption.title}</p>
                  <p className="mt-3 max-w-sm text-[15px] leading-relaxed text-quiet md:text-base">{caption.body}</p>
                </div>
              ))}
            </div>
          </div>

          {/* chart */}
          <div className="wb-chart relative order-1 h-[30svh] min-h-0 md:order-2 md:h-auto">
            <svg
              viewBox={`0 0 ${VW} ${VH}`}
              className="h-full w-full overflow-visible"
              role="img"
              aria-label="Illustration: daily skin scores while using a serum. Mornings bounce inside the normal wobble band until day 19, when the score clears the band and stays above it."
            >
              <defs>
                <clipPath id="wb-clip-path">
                  <rect className="wb-clip" x={DX0 - 4} y={0} width={0} height={VH} />
                </clipPath>
                <linearGradient id="wb-stroke" gradientUnits="userSpaceOnUse" x1={DX0} x2={DX1} y1="0" y2="0">
                  <stop offset={CROSS_OFFSET} style={{ stopColor: "rgb(var(--ink))" }} />
                  <stop offset={CROSS_OFFSET} style={{ stopColor: "rgb(var(--sage))" }} />
                </linearGradient>
              </defs>

              {[56, 60, 64, 68].map((value) => (
                <g key={value}>
                  <line x1={40} x2={DX1} y1={sy(value)} y2={sy(value)} className="stroke-line" />
                  <text x={30} y={sy(value) + 4} textAnchor="end" fontSize="13" className="num fill-quiet font-lab">
                    {value}
                  </text>
                </g>
              ))}

              <g className="wb-band">
                <rect className="wb-band-rect fill-ink/[0.08]" x={44} y={BAND_TOP} width={DX1 - 44} height={BAND_BOTTOM - BAND_TOP} />
                <line className="wb-band-top stroke-ink/45" x1={44} x2={DX1} y1={BAND_TOP} y2={BAND_TOP} strokeDasharray="5 7" />
                <line className="wb-band-bottom stroke-ink/45" x1={44} x2={DX1} y1={BAND_BOTTOM} y2={BAND_BOTTOM} strokeDasharray="5 7" />
              </g>
              <g className="wb-band-label">
                <text x={DX1} y={BAND_TOP - 12} textAnchor="end" fontSize="13" letterSpacing="1.6" className="fill-quiet font-lab">
                  NORMAL WOBBLE ±{MDC}
                </text>
              </g>

              {BASELINE.map((value, i) => (
                <circle key={i} className="wb-base fill-clay" cx={BASE_X[i]} cy={sy(value)} r="7" />
              ))}
              <text x={BASE_X[2]} y={BOTTOM + 34} textAnchor="middle" fontSize="12" letterSpacing="1.6" className="fill-quiet font-lab">
                BASELINE ×5
              </text>

              <line x1={DX0 - 34} x2={DX0 - 34} y1={TOP - 10} y2={BOTTOM} className="stroke-ink/25" strokeDasharray="2 6" />
              <text x={DX0 - 24} y={TOP + 2} fontSize="12" letterSpacing="1.6" className="fill-quiet font-lab">
                ON PRODUCT →
              </text>

              {[1, 7, 14, 19, 28].map((day) => (
                <text key={day} x={sx(day)} y={BOTTOM + 34} textAnchor="middle" fontSize="12" letterSpacing="1.4" className={cx("num font-lab", day === CROSS_DAY ? "fill-sage" : "fill-quiet")}>
                  D{day}
                </text>
              ))}

              <g clipPath="url(#wb-clip-path)">
                <path d={LINE} fill="none" stroke="url(#wb-stroke)" strokeWidth="3" strokeLinejoin="round" strokeLinecap="round" />
              </g>
              {DAYS.map((value, i) => (
                <circle key={i} className={cx("wb-dot", i + 1 >= CROSS_DAY ? "fill-sage" : "fill-ink")} cx={sx(i + 1)} cy={sy(value)} r="0" opacity="0" />
              ))}

              <Note x={sx(3)} y={sy(DAYS[2]) - 40} text="“It's working!”" className="wb-note3" />
              <Note x={sx(7)} y={sy(DAYS[6]) + 44} text="“It stopped.”" className="wb-note7" />

              <circle className="wb-ring stroke-sage" fill="none" strokeWidth="2.5" cx={sx(CROSS_DAY)} cy={sy(DAYS[CROSS_DAY - 1])} r="6" opacity="0" />

              <g className="wb-cursor" opacity="0">
                <line x1={0} x2={0} y1={TOP - 10} y2={BOTTOM} className="stroke-ink/50" />
                <circle className="wb-cursor-dot fill-paper stroke-ink" strokeWidth="3" r="8" cx={0} cy={sy(MEAN)} />
              </g>
            </svg>

            <div className="wb-stamp invisible absolute right-[2%] top-[10%] text-[clamp(14px,1.9vw,26px)] opacity-0 md:right-[6%] md:top-[12%]">
              <Stamp tone="sage" sub="Day 19 · clears the wobble">
                Worth it
              </Stamp>
            </div>
          </div>
        </div>
        <p className="lab mt-4 hidden text-quiet md:block">MDC95 = 1.96 · √2 · SEM</p>
      </div>
    </section>
  );
}

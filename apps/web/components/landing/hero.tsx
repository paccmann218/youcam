"use client";

import { AnimatePresence, motion, useInView } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";
import { Arrow, EASE_OUT, Magnetic, SplitWords, Stamp, WRAP, scrollToId, type Tone } from "./kit";
import { SECTIONS } from "./nav";
import { TopoFace } from "./topo-face";

type Specimen = { no: string; product: string; concern: string; day: string; design: string; verdict: string; sub: string; tone: Tone };

const SPECIMENS: Specimen[] = [
  { no: "014", product: "Niacinamide serum", concern: "Pores", day: "21 of 28", design: "One side", verdict: "Worth it", sub: "Day 21", tone: "sage" },
  { no: "027", product: "Vitamin C toner", concern: "Texture", day: "28 of 28", design: "Before / after", verdict: "Not worth it", sub: "Day 28", tone: "ink" },
  { no: "031", product: "Retinol cream", concern: "Acne", day: "9 of 19", design: "Before / after", verdict: "Too early", sub: "Ask on day 19", tone: "amber" },
];

/** Letters rise out of a mask with a slight tilt. */
function SplitChars({ text, delay = 0, className }: { text: string; delay?: number; className?: string }) {
  return (
    <span className={cx("inline-block", className)}>
      {Array.from(text).map((char, index) => (
        <span key={index} className="-mb-[0.12em] -mr-[0.07em] inline-block overflow-hidden pb-[0.12em] pr-[0.07em] align-bottom">
          <motion.span
            className="inline-block origin-bottom-left will-change-transform"
            initial={{ y: "108%", rotate: 9 }}
            animate={{ y: "0%", rotate: 0 }}
            transition={{ duration: 1.2, ease: EASE_OUT, delay: delay + index * 0.065 }}
          >
            {char}
          </motion.span>
        </span>
      ))}
    </span>
  );
}

/** A tiny oval mirror set into the headline, with the topographic face and a scan line sweeping it. */
function MirrorPill() {
  return (
    <motion.span
      aria-hidden="true"
      className="relative inline-block h-[0.86em] w-[0.66em] shrink-0 overflow-hidden rounded-[50%] border border-ink/25 bg-card align-middle shadow-soft"
      initial={{ scale: 0, rotate: -25 }}
      animate={{ scale: 1, rotate: 0 }}
      transition={{ type: "spring", stiffness: 170, damping: 15, delay: 0.75 }}
    >
      <TopoFace className="absolute inset-[9%] h-[82%] w-[82%]" weight={2.4} delay={0.9} />
      <span className="scan-sweep absolute inset-x-[8%] h-[2px] rounded-full bg-clay shadow-[0_0_12px_rgb(var(--clay))]" />
    </motion.span>
  );
}

function Barcode() {
  const bars = [3, 1, 2, 1, 1, 3, 1, 2, 2, 1, 3, 1, 1, 2, 1, 3, 2, 1, 1, 2, 3, 1, 2, 1, 1, 3, 1, 2];
  return (
    <span aria-hidden="true" className="flex h-7 items-stretch gap-[2px]">
      {bars.map((width, index) => (
        <span key={index} className={cx("bg-ink/70", index % 2 ? "opacity-0" : "")} style={{ width }} />
      ))}
    </span>
  );
}

/** A sample tag that cycles through three example verdicts, each one stamped on. */
function SpecimenTag() {
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const timer = window.setInterval(() => setIndex((value) => (value + 1) % SPECIMENS.length), 3800);
    return () => window.clearInterval(timer);
  }, [inView]);

  const specimen = SPECIMENS[index];

  return (
    <motion.figure
      ref={ref}
      className="relative w-full max-w-[340px]"
      initial={{ opacity: 0, y: 50, rotate: 6 }}
      animate={{ opacity: 1, y: 0, rotate: 1.5 }}
      transition={{ duration: 1.3, ease: EASE_OUT, delay: 1.1 }}
    >
      <div className="relative rounded-[22px] border border-line bg-card py-5 pl-14 pr-5 shadow-lift">
        {/* punched hole + string */}
        <span aria-hidden="true" className="absolute left-5 top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border border-line bg-paper shadow-[inset_0_1px_3px_rgb(var(--ink)/0.25)]" />
        <span aria-hidden="true" className="absolute left-0 top-1/2 h-px w-6 -translate-x-full bg-ink/40" />
        <span aria-hidden="true" className="absolute bottom-4 left-11 top-4 border-l border-dashed border-line" />

        <div className="lab flex items-center justify-between text-quiet">
          <span>Specimen</span>
          <span className="num text-ink">Nº {specimen.no}</span>
        </div>
        <AnimatePresence mode="wait">
          <motion.div key={specimen.no} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.3 }}>
            <p className="mt-2 font-display text-[1.7rem] italic leading-tight">{specimen.product}</p>
            <dl className="lab mt-3 grid grid-cols-[auto_1fr] gap-x-4 gap-y-1 text-quiet">
              <dt>Concern</dt>
              <dd className="text-ink">{specimen.concern}</dd>
              <dt>Day</dt>
              <dd className="num text-ink">{specimen.day}</dd>
              <dt>Design</dt>
              <dd className="text-ink">{specimen.design}</dd>
            </dl>
          </motion.div>
        </AnimatePresence>
        <div className="mt-4">
          <Barcode />
        </div>

        <div className="pointer-events-none absolute -bottom-6 -right-4 text-[14px]">
          <AnimatePresence mode="popLayout">
            <motion.div
              key={specimen.no}
              initial={{ scale: 2.6, opacity: 0, rotate: -28 }}
              animate={{ scale: 1, opacity: 1, rotate: -9 }}
              exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.18 } }}
              transition={{ type: "spring", stiffness: 520, damping: 24, delay: 0.25 }}
            >
              <Stamp tone={specimen.tone} sub={specimen.sub} className="bg-card/70">
                {specimen.verdict}
              </Stamp>
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
      <figcaption className="lab mt-10 text-quiet">Example specimens. Real verdicts only appear once measured.</figcaption>
    </motion.figure>
  );
}

const STRIP_PERIOD = 1200;
const STRIP_HEIGHT = 64;

/** A periodic wobble (whole-number harmonics), drawn twice so a 50% slide loops without a seam. */
function stripPath() {
  const harmonics: [number, number, number][] = [
    [3, 0.34, 0.4],
    [7, 0.24, 1.9],
    [12, 0.17, 0.7],
    [19, 0.12, 2.6],
    [31, 0.08, 1.1],
    [47, 0.05, 2.2],
  ];
  const total = harmonics.reduce((sum, [, amp]) => sum + amp, 0);
  let d = "";
  for (let x = 0; x <= STRIP_PERIOD * 2; x += 6) {
    const t = (2 * Math.PI * x) / STRIP_PERIOD;
    const wave = harmonics.reduce((sum, [k, amp, phase]) => sum + amp * Math.sin(k * t + phase), 0) / total;
    d += `${x ? "L" : "M"}${x} ${(STRIP_HEIGHT / 2 + wave * STRIP_HEIGHT * 0.5).toFixed(1)}`;
  }
  return d;
}

function WobbleStrip() {
  const [d, setD] = useState<string | null>(null);
  useEffect(() => setD(stripPath()), []);
  return (
    <motion.div
      aria-hidden="true"
      className="relative mt-auto border-t border-line"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ delay: 1.4, duration: 1.2 }}
    >
      <div className="relative h-16 overflow-hidden md:h-20">
        <div className="absolute inset-x-0 top-1/2 h-[58%] -translate-y-1/2 border-y border-dashed border-ink/25 bg-ink/[0.035]" />
        {d ? (
          <svg viewBox={`0 0 ${STRIP_PERIOD * 2} ${STRIP_HEIGHT}`} preserveAspectRatio="none" className="wobble-run absolute inset-y-0 left-0 h-full w-[200%]">
            <path d={d} fill="none" className="stroke-clay" strokeWidth="1.6" vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
          </svg>
        ) : null}
        <div className={cx(WRAP, "lab pointer-events-none relative flex h-full items-center justify-between text-quiet")}>
          <span className="-ml-2 rounded bg-paper/85 px-2">Normal wobble ±2.4 · inside the band nothing counts</span>
          <span className="hidden rounded bg-paper/85 px-2 sm:inline">Live · illustrative</span>
        </div>
      </div>
    </motion.div>
  );
}

export function Hero() {
  return (
    <section id="top" className="relative flex min-h-[100svh] flex-col overflow-hidden pt-24">
      <div className={cx(WRAP, "flex flex-1 flex-col")}>
        <motion.div
          className="lab grid grid-cols-2 gap-2 text-quiet md:grid-cols-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.1 }}
        >
          <span>Nº 001 · Specimen report</span>
          <span className="text-right md:text-left">A personal test for skincare</span>
          <span className="hidden md:block">Measured with YouCam AI</span>
          <span className="hidden text-right md:block">Not medical care</span>
        </motion.div>
        <motion.div
          aria-hidden="true"
          className="mt-3 h-px origin-left bg-line"
          initial={{ scaleX: 0 }}
          animate={{ scaleX: 1 }}
          transition={{ duration: 1.8, ease: EASE_OUT, delay: 0.15 }}
        />

        {/* left: headline + lede. right (lg): contents, then the specimen tag. "Worth it?" is sized to the left column (≈4.75em wide). */}
        <div className="mt-8 grid flex-1 gap-x-10 gap-y-14 pb-10 md:mt-10 lg:grid-cols-[minmax(0,1fr)_300px]">
          <div className="flex min-w-0 flex-col">
            <h1 aria-label="Is your skincare actually worth it?" className="font-display tracking-[-0.035em]">
              <span aria-hidden="true" className="block text-[clamp(2.6rem,5.8vw,6rem)] font-normal leading-[0.98]">
                <SplitWords text="Is your skincare" immediate delay={0.2} stagger={0.08} />
              </span>
              <span aria-hidden="true" className="mt-1 flex items-center gap-[0.22em] pl-[0.9em] text-[clamp(2.6rem,5.8vw,6rem)] font-normal italic leading-[0.98] md:pl-[1.7em]">
                <SplitWords text="actually" immediate delay={0.42} />
                <MirrorPill />
              </span>
              <span
                aria-hidden="true"
                className="block whitespace-nowrap text-[clamp(3.6rem,17.5vw,11rem)] font-extrabold leading-[0.86] lg:text-[length:min(14vw,calc((100vw_-_440px)/4.75),13rem)]"
              >
                <SplitChars text="Worth" delay={0.55} /> <SplitChars text="it?" delay={0.9} className="font-normal italic text-clay" />
              </span>
            </h1>

            <motion.div className="mt-10 max-w-2xl lg:mt-auto lg:pt-10" initial={{ opacity: 0, y: 24 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: EASE_OUT, delay: 1.05 }}>
            <p className="text-lg leading-relaxed text-quiet md:text-xl">
              You can&apos;t tell from the mirror, so you keep buying. WorthIt scans your skin every morning, reads your sleep and stress from your Galaxy Watch,
              and gives a straight answer: <span className="text-ink">worth it, not worth it, or too early to tell.</span>
            </p>
            <div className="mt-8 flex flex-wrap items-center gap-x-7 gap-y-4">
              <Magnetic>
                <Link
                  href="/today"
                  className="group inline-flex min-h-14 items-center gap-4 rounded-full bg-ink py-2 pl-7 pr-2 text-[15px] font-medium text-paper shadow-lift transition-colors hover:bg-ink/90"
                >
                  Start your test
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-clay text-lg text-on-clay transition-transform duration-300 group-hover:-rotate-45">
                    <Arrow />
                  </span>
                </Link>
              </Magnetic>
              <button type="button" onClick={() => scrollToId("wobble")} className="draw-under inline-flex items-center gap-2 pb-0.5 text-[15px] font-medium">
                Watch a verdict form
                <Arrow direction="down" className="text-clay" />
              </button>
            </div>
            </motion.div>
          </div>

          <div className="flex flex-col gap-12 lg:justify-between">
            <motion.nav
              aria-label="In this report"
              className="hidden lg:block"
              initial={{ opacity: 0, x: 24 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.1, ease: EASE_OUT, delay: 0.7 }}
            >
              <p className="lab text-quiet">In this report</p>
              <ol className="mt-3 border-t border-line">
                {SECTIONS.map((section) => (
                  <li key={section.id} className="border-b border-line">
                    <button type="button" onClick={() => scrollToId(section.id)} className="group flex w-full items-baseline gap-3 py-[6px] text-left">
                      <span className="lab text-clay">{section.n}</span>
                      <span className="font-display text-[1.05rem] italic transition-transform duration-300 group-hover:translate-x-1.5">{section.label}</span>
                    </button>
                  </li>
                ))}
              </ol>
            </motion.nav>
            <SpecimenTag />
          </div>
        </div>
      </div>
      <WobbleStrip />
    </section>
  );
}

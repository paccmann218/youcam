"use client";

import { AnimatePresence, LayoutGroup, motion, useInView, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";
import { Arrow, CropMarks, EASE_OUT, Reveal, SectionTag, SplitWords, Stamp, WRAP } from "./kit";

type Claim = { chip: string; text: string; delta: number; test: boolean };

/* Illustrative numbers: a real check renders the claim on your own photo and compares it with your own wobble. */
const CLAIMS: Claim[] = [
  { chip: "Pores", text: "Visibly smaller pores in 14 days", delta: 0.9, test: false },
  { chip: "Redness", text: "Reduces the look of redness", delta: 3.8, test: true },
  { chip: "Glow", text: "Clinically proven glow", delta: 0.4, test: false },
];
const WOBBLE = 2.4;
const SCALE = 6;

const STEPS = [
  ["Type it", "Copy the promise off the label, scan the barcode, or photograph the pack."],
  ["Render it", "YouCam Skin Simulation draws that change on your latest scan."],
  ["Measure it", "Skin Analysis scores the render like any other morning."],
  ["Compare it", "Inside your wobble: skip. Bigger: worth testing on your face."],
];

function ClaimMachine() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { margin: "-15% 0px" });
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);
  const [auto, setAuto] = useState(true);
  const [typed, setTyped] = useState(0);

  const claim = CLAIMS[index];
  const shown = reduce ? claim.text.length : typed;
  const done = shown >= claim.text.length;

  useEffect(() => {
    setTyped(0);
  }, [index]);

  useEffect(() => {
    if (!inView || done) return;
    const timer = window.setTimeout(() => setTyped((count) => count + 1), 34);
    return () => window.clearTimeout(timer);
  }, [inView, typed, done]);

  useEffect(() => {
    if (!auto || !done || !inView) return;
    const timer = window.setTimeout(() => setIndex((value) => (value + 1) % CLAIMS.length), 4400);
    return () => window.clearTimeout(timer);
  }, [auto, done, inView]);

  const marker = 50 + (Math.max(-SCALE, Math.min(SCALE, claim.delta)) / SCALE) * 50;
  const band = (WOBBLE / SCALE) * 50;

  return (
    <div ref={ref}>
      <div className="relative">
      <div className="relative overflow-hidden rounded-[28px] border border-line bg-card p-6 shadow-lift md:p-9">
        <div className="lab flex items-center justify-between text-quiet">
          <span>The label says</span>
          <span>Fig. 05</span>
        </div>
        <p className="mt-5 min-h-[2.6em] font-display text-[clamp(1.9rem,3.2vw,2.9rem)] italic leading-[1.1]" aria-live="polite">
          &ldquo;{claim.text.slice(0, shown)}
          {!done ? <span className="caret ml-0.5 inline-block h-[0.9em] w-[2px] translate-y-[0.1em] bg-clay" /> : "”"}
        </p>

        <div role="radiogroup" aria-label="Example claims" className="mt-6 flex flex-wrap gap-2">
          {CLAIMS.map((item, i) => (
            <button
              key={item.chip}
              type="button"
              role="radio"
              aria-checked={i === index}
              onClick={() => {
                setAuto(false);
                setIndex(i);
              }}
              className={cx(
                "lab rounded-full border px-3.5 py-2 transition-colors",
                i === index ? "border-ink bg-ink text-paper" : "border-line text-quiet hover:border-ink/40 hover:text-ink",
              )}
            >
              {item.chip}
            </button>
          ))}
        </div>

        <div className="mt-9">
          <div className="lab flex items-baseline justify-between text-quiet">
            <span>Rendered on your photo, then measured</span>
            <span className="num text-ink">
              {done ? `+${claim.delta.toFixed(1)}` : "…"} <span className="text-quiet">vs ±{WOBBLE}</span>
            </span>
          </div>
          <div className="relative mt-4 h-12">
            <div className="absolute inset-x-0 top-1/2 h-px bg-line" />
            <div className="absolute inset-y-1 rounded-md border border-dashed border-ink/30 bg-ink/[0.06]" style={{ left: `${50 - band}%`, right: `${50 - band}%` }} />
            <div className="absolute inset-y-0 left-1/2 w-px bg-ink/30" />
            <motion.div
              className={cx("absolute top-1/2 h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-[3px] border-card shadow-soft", done ? (claim.test ? "bg-sage" : "bg-rose") : "bg-ink/40")}
              initial={false}
              animate={{ left: `${done ? marker : 50}%` }}
              transition={{ type: "spring", stiffness: 140, damping: 16 }}
            />
          </div>
          <div className="lab mt-1 flex justify-between text-quiet">
            <span>−{SCALE}</span>
            <span>your wobble</span>
            <span>+{SCALE}</span>
          </div>
        </div>

        <div className="mt-8 flex min-h-[5.5rem] items-center gap-5 border-t border-line pt-6">
          <div className="w-[9.5rem] shrink-0 text-[15px]">
            <AnimatePresence mode="popLayout">
              {done ? (
                <motion.div
                  key={`${index}-stamp`}
                  initial={{ scale: 2.2, opacity: 0, rotate: -22 }}
                  animate={{ scale: 1, opacity: 1, rotate: -7 }}
                  exit={{ opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 520, damping: 24, delay: 0.35 }}
                >
                  <Stamp tone={claim.test ? "sage" : "rose"}>{claim.test ? "Test it" : "Skip"}</Stamp>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
          <AnimatePresence mode="wait">
            {done ? (
              <motion.p
                key={`${index}-line`}
                className="leading-relaxed text-ink/85"
                initial={{ opacity: 0, x: 12 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.4, delay: 0.45 }}
              >
                {claim.test
                  ? "Big enough to see. Worth testing on your own skin before you commit."
                  : "Even if it is true, the change sits inside your wobble. You would never see it."}
              </motion.p>
            ) : (
              <motion.p key="wait" className="lab text-quiet" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                Reading the label…
              </motion.p>
            )}
          </AnimatePresence>
        </div>
      </div>
      <CropMarks />
      </div>
      <p className="lab mt-5 text-quiet">Illustration. A real check uses your latest scan and your own wobble.</p>
    </div>
  );
}

const SHADES = ["#f4dcc8", "#ebc7aa", "#dfb291", "#cf9b76", "#b9825e", "#966246", "#6a432e"];
const MATCH = 3;

function Shades() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-20% 0px" });
  const [at, setAt] = useState(0);

  useEffect(() => {
    if (!inView || at >= MATCH) return;
    const timer = window.setTimeout(() => setAt((value) => value + 1), 320);
    return () => window.clearTimeout(timer);
  }, [inView, at]);

  return (
    <div ref={ref}>
      <LayoutGroup>
        <ul className="flex flex-wrap gap-3 md:gap-4" aria-label="Example foundation shades">
          {SHADES.map((hex, i) => (
            <motion.li
              key={hex}
              className="relative flex flex-col items-center"
              initial={{ y: 30, opacity: 0 }}
              animate={inView ? { y: 0, opacity: 1 } : undefined}
              transition={{ duration: 0.8, ease: EASE_OUT, delay: i * 0.06 }}
            >
              <span className="relative block h-14 w-14 md:h-20 md:w-20">
                <span className="absolute inset-0 rounded-full shadow-soft ring-1 ring-ink/10" style={{ background: hex }} />
                {i === at ? (
                  <motion.span layoutId="shade-ring" className="absolute -inset-2 rounded-full border-2 border-clay" transition={{ type: "spring", stiffness: 380, damping: 30 }} />
                ) : null}
              </span>
              <span className={cx("lab mt-3 transition-colors", i === MATCH && at === MATCH ? "text-clay" : "text-quiet")}>
                {i === MATCH && at === MATCH ? "Closest" : `N${i + 1}`}
              </span>
            </motion.li>
          ))}
        </ul>
      </LayoutGroup>
      <p className="lab mt-6 text-quiet">Illustration. Shades are ranked by colour distance to the skin tone YouCam reads from your scan.</p>
    </div>
  );
}

export function BeforeYouBuy() {
  return (
    <section id="buy" className="theme-night relative overflow-hidden bg-paper py-24 text-ink md:py-36">
      <div aria-hidden="true" className="absolute -right-40 top-20 h-[34rem] w-[34rem] rounded-full bg-clay/20 blur-[120px]" />
      <div aria-hidden="true" className="absolute -left-40 bottom-0 h-[28rem] w-[28rem] rounded-full bg-sage/10 blur-[120px]" />
      <div className={cx(WRAP, "relative")}>
        <SectionTag index="05" label="Before you buy" fig="Fig. 05 · a claim, measured" />
        <div className="mt-14 grid gap-16 lg:mt-20 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <h2 className="font-display text-[clamp(2.6rem,5.2vw,5.4rem)] font-medium leading-[0.98] tracking-[-0.03em]">
              <SplitWords text="Check the label" /> <SplitWords text="on your own face" wordClassName="font-normal italic text-clay" delay={0.2} />{" "}
              <SplitWords text="before you pay." delay={0.4} />
            </h2>
            <ol className="mt-12 border-t border-line">
              {STEPS.map(([title, body], index) => (
                <Reveal key={title} as="li" delay={index * 0.07} className="grid grid-cols-[2.5rem_7.5rem_1fr] items-baseline gap-3 border-b border-line py-4 md:grid-cols-[3rem_9rem_1fr]">
                  <span className="lab text-clay">0{index + 1}</span>
                  <span className="font-display text-xl italic md:text-2xl">{title}</span>
                  <span className="text-[15px] leading-relaxed text-quiet">{body}</span>
                </Reveal>
              ))}
            </ol>
            <Link href="/claim" className="draw-under mt-10 inline-flex items-center gap-2 pb-0.5 font-medium">
              Check a claim now <Arrow className="text-clay" />
            </Link>
          </div>
          <ClaimMachine />
        </div>

        <div className="mt-24 grid items-center gap-12 border-t border-line pt-16 lg:mt-32 lg:grid-cols-[0.95fr_1.05fr] lg:gap-20">
          <div>
            <p className="lab text-clay">Makeup</p>
            <h3 className="mt-4 font-display text-[clamp(2.2rem,4vw,4rem)] font-medium leading-[1] tracking-[-0.025em]">
              Shades matched to you, <em className="font-normal text-clay">tried on together.</em>
            </h3>
            <p className="mt-6 max-w-lg text-lg leading-relaxed text-quiet">
              YouCam reads your skin, lip, eye, brow and hair colour from your scan, ranks foundation, concealer and lip shades by how close they sit, then tries
              the whole look on your photo in one go.
            </p>
            <Link href="/shop" className="draw-under mt-8 inline-flex items-center gap-2 pb-0.5 font-medium">
              Open the shop <Arrow className="text-clay" />
            </Link>
          </div>
          <Shades />
        </div>
      </div>
    </section>
  );
}

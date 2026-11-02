"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { cx } from "../ui/cx";
import { Arrow, EASE_OUT, Magnetic, SectionTag, SplitWords, WRAP } from "./kit";

/** A slowly turning seal of the three promises. */
function Seal() {
  return (
    <div className="relative h-36 w-36 shrink-0 md:h-48 md:w-48" aria-hidden="true">
      <svg viewBox="0 0 200 200" className="spin-slow absolute inset-0 h-full w-full">
        <defs>
          <path id="landing-seal-path" d="M100 100 m-78 0 a78 78 0 1 1 156 0 a78 78 0 1 1 -156 0" />
        </defs>
        <text className="fill-ink font-lab" fontSize="11" letterSpacing="2">
          <textPath href="#landing-seal-path" textLength="486" lengthAdjust="spacing">
            PERSONAL TEST ✳ NOT MEDICAL CARE ✳ NO MADE-UP NUMBERS ✳
          </textPath>
        </text>
      </svg>
      <div className="absolute inset-[29%] flex items-center justify-center rounded-full bg-clay text-on-clay">
        <svg viewBox="0 0 24 24" className="h-1/2 w-1/2" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round">
          <path d="m5.5 12.5 4 4 9-9" />
        </svg>
      </div>
    </div>
  );
}

function GiantMark() {
  const letters = Array.from("WorthIt");
  return (
    <motion.p
      aria-hidden="true"
      className="flex select-none justify-center overflow-hidden whitespace-nowrap font-display text-[19vw] font-black leading-[0.78] tracking-[-0.05em] text-ink/[0.08]"
      initial="hidden"
      whileInView="show"
      viewport={{ once: true }}
    >
      {letters.map((letter, index) => (
        <motion.span
          key={index}
          className={cx("inline-block", index >= 5 && "pr-[0.04em] font-normal italic text-clay/30")}
          variants={{
            hidden: { y: "70%" },
            show: { y: "14%", transition: { duration: 1.3, ease: EASE_OUT, delay: index * 0.06 } },
          }}
        >
          {letter}
        </motion.span>
      ))}
    </motion.p>
  );
}

export function Finale() {
  return (
    <section className="theme-night relative overflow-hidden bg-paper text-ink">
      <div aria-hidden="true" className="absolute -left-32 top-24 h-[30rem] w-[30rem] rounded-full bg-clay/25 blur-[130px]" />
      <div className={cx(WRAP, "relative pb-16 pt-28 md:pt-40")}>
        <SectionTag index="07" label="Start tonight" fig="Fig. 07" />
        <div className="mt-14 flex flex-col gap-12 md:mt-20 lg:flex-row lg:items-end lg:justify-between">
          <h2 className="font-display text-[clamp(3.6rem,11vw,11.5rem)] font-medium leading-[0.86] tracking-[-0.04em]">
            <SplitWords text="Stop paying" />
            <br />
            <SplitWords text="for maybe." wordClassName="font-normal italic text-clay" delay={0.2} />
          </h2>
          <Seal />
        </div>

        <div className="mt-16 grid gap-10 border-t border-line pt-10 md:grid-cols-[1fr_auto] md:items-center">
          <p className="max-w-lg text-lg leading-relaxed text-quiet">
            Five baseline scans. Your watch on overnight. Then one scan each morning, until the answer is honest.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <Magnetic>
              <Link
                href="/today"
                className="group inline-flex min-h-14 items-center gap-4 rounded-full bg-clay py-2 pl-7 pr-2 text-[15px] font-medium text-on-clay shadow-glow transition-[filter] hover:brightness-110"
              >
                Start your test
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-on-clay text-lg text-clay transition-transform duration-300 group-hover:-rotate-45">
                  <Arrow />
                </span>
              </Link>
            </Magnetic>
            <Magnetic>
              <Link
                href="/shop"
                className="inline-flex min-h-14 items-center rounded-full border border-ink/25 px-7 text-[15px] font-medium transition-colors hover:border-ink/60 hover:bg-ink/5"
              >
                Try a shade first
              </Link>
            </Magnetic>
          </div>
        </div>
      </div>

      <footer className="relative">
        <div className={cx(WRAP, "grid gap-8 border-t border-line py-10 text-sm leading-relaxed text-quiet md:grid-cols-3")}>
          <p className="max-w-sm">WorthIt is a personal test. It is not medical care, and it never calls itself a clinical trial.</p>
          <p className="max-w-sm">Built with the YouCam API: Skin Analysis, Skin Simulation, Makeup VTO, Facial Color Tones and Camera Kit.</p>
          <nav aria-label="Footer" className="lab flex flex-wrap gap-x-6 gap-y-3 md:justify-end">
            <Link href="/today" className="draw-under text-ink">
              Open the app
            </Link>
            <Link href="/shop" className="draw-under text-ink">
              Shop & try on
            </Link>
            <Link href="/privacy" className="draw-under text-ink">
              Privacy
            </Link>
          </nav>
        </div>
        <GiantMark />
      </footer>
    </section>
  );
}

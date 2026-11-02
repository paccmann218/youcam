"use client";

import { AnimatePresence, motion, useMotionValue, useSpring } from "framer-motion";
import { useRef, useState } from "react";
import { cx } from "../ui/cx";
import { EASE_OUT, Reveal, SectionTag, SplitWords, Stamp, TONE_TEXT, WRAP, type Tone } from "./kit";

type Row = { key: string; n: string; word: string; stamp: string; tone: Tone; body: string; path: string; future?: string };

const ROWS: Row[] = [
  {
    key: "working",
    n: "01",
    word: "Worth it.",
    stamp: "Worth it",
    tone: "sage",
    body: "Your skin changed by more than its normal wobble while you used it.",
    path: "M4 33 L24 30 L44 35 L64 31 L84 34 L104 29 L124 26 L144 20 L164 16 L184 12 L196 10",
  },
  {
    key: "no_effect",
    n: "02",
    word: "Not worth it.",
    stamp: "Not worth it",
    tone: "ink",
    body: "No change beyond your normal wobble. You could stop paying for it.",
    path: "M4 32 L24 29 L44 36 L64 31 L84 35 L104 30 L124 36 L144 31 L164 34 L184 29 L196 32",
  },
  {
    key: "too_early",
    n: "03",
    word: "Too early.",
    stamp: "Too early",
    tone: "amber",
    body: "Not enough mornings to tell yet, so it names the day an honest answer becomes possible.",
    path: "M4 33 L24 29 L44 36 L64 30 L84 34",
    future: "M84 34 L196 34",
  },
  {
    key: "wrong_way",
    n: "04",
    word: "Making it worse.",
    stamp: "Wrong way",
    tone: "rose",
    body: "Worse, beyond your wobble, on the days you used it. Reported as moving the wrong way, never as “no effect”.",
    path: "M4 31 L24 34 L44 29 L64 33 L84 35 L104 38 L124 42 L144 46 L164 49 L184 53 L196 56",
  },
];

const SOFT_BG: Record<Tone, string> = {
  sage: "bg-sage/[0.09]",
  ink: "bg-ink/[0.05]",
  amber: "bg-amber/[0.1]",
  rose: "bg-rose/[0.09]",
  clay: "bg-clay/[0.08]",
};

const STROKE: Record<Tone, string> = {
  sage: "stroke-sage",
  ink: "stroke-ink",
  amber: "stroke-amber",
  rose: "stroke-rose",
  clay: "stroke-clay",
};

function MiniChart({ row, active }: { row: Row; active: boolean }) {
  return (
    <svg viewBox="0 0 200 64" className="relative h-14 w-full max-w-[220px] overflow-visible md:h-16" aria-hidden="true">
      <rect x="0" y="24" width="200" height="18" className="fill-ink/[0.06]" />
      <line x1="0" x2="200" y1="24" y2="24" className="stroke-ink/30" strokeDasharray="3 4" />
      <line x1="0" x2="200" y1="42" y2="42" className="stroke-ink/30" strokeDasharray="3 4" />
      <motion.path
        d={row.path}
        fill="none"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={cx("transition-[stroke] duration-300", active ? STROKE[row.tone] : "stroke-ink/70")}
        initial={{ pathLength: 0 }}
        whileInView={{ pathLength: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.5, ease: EASE_OUT, delay: 0.2 }}
      />
      {row.future ? (
        <g>
          <path d={row.future} fill="none" className="stroke-amber/80" strokeWidth="2" strokeDasharray="2 6" strokeLinecap="round" />
          <line x1="160" x2="160" y1="12" y2="54" className="stroke-amber" strokeWidth="1.5" />
          <text x="160" y="8" textAnchor="middle" fontSize="10" className="fill-amber font-lab">
            D19
          </text>
        </g>
      ) : null}
    </svg>
  );
}

export function Verdicts() {
  const area = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);
  const mx = useMotionValue(0);
  const my = useMotionValue(0);
  const x = useSpring(mx, { stiffness: 320, damping: 28, mass: 0.6 });
  const y = useSpring(my, { stiffness: 320, damping: 28, mass: 0.6 });
  const current = ROWS.find((row) => row.key === active) ?? null;

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = area.current?.getBoundingClientRect();
    if (!rect) return;
    mx.set(event.clientX - rect.left + 28);
    my.set(event.clientY - rect.top - 36);
  }

  return (
    <section id="verdicts" className="relative py-24 md:py-36">
      <div className={WRAP}>
        <SectionTag index="04" label="The verdicts" fig="Fig. 04 · the only four answers" />
        <div className="mt-14 grid gap-10 lg:mt-20 lg:grid-cols-[1.4fr_1fr] lg:items-end">
          <h2 className="font-display text-[clamp(2.6rem,5.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.03em]">
            <SplitWords text="It only ever says" /> <SplitWords text="one of four things." wordClassName="font-normal italic text-clay" delay={0.2} />
          </h2>
          <Reveal delay={0.15}>
            <p className="max-w-md text-lg leading-relaxed text-quiet lg:justify-self-end">
              No score out of 100, no glow index. One of four answers, with the reason behind it, and never before the numbers allow it.
            </p>
          </Reveal>
        </div>

        <div ref={area} className="relative mt-16 md:mt-20" onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
          <ol className="border-t border-line">
            {ROWS.map((row, index) => {
              const on = active === row.key;
              return (
                <Reveal
                  key={row.key}
                  as="li"
                  delay={index * 0.06}
                  className="relative border-b border-line"
                >
                  <div
                    tabIndex={0}
                    onPointerEnter={() => setActive(row.key)}
                    onFocus={() => setActive(row.key)}
                    onBlur={() => setActive(null)}
                    className="relative grid cursor-default grid-cols-[2.25rem_minmax(0,1fr)] items-center gap-x-4 gap-y-4 py-7 outline-none md:grid-cols-[3.5rem_minmax(0,1fr)_200px_minmax(0,19rem)] md:gap-x-8 md:py-9"
                  >
                    <motion.span
                      aria-hidden="true"
                      className={cx("absolute inset-0 origin-left", SOFT_BG[row.tone])}
                      initial={false}
                      animate={{ scaleX: on ? 1 : 0 }}
                      transition={{ duration: 0.6, ease: EASE_OUT }}
                    />
                    <span className="lab relative text-quiet">{row.n}</span>
                    <motion.span
                      className={cx(
                        "relative font-display text-[clamp(2.5rem,6.4vw,6.4rem)] font-medium leading-[0.95] tracking-[-0.03em] transition-colors duration-300",
                        on ? TONE_TEXT[row.tone] : "text-ink",
                      )}
                      animate={{ x: on ? 20 : 0, fontStyle: on ? "italic" : "normal" }}
                      transition={{ duration: 0.5, ease: EASE_OUT }}
                    >
                      {row.word}
                    </motion.span>
                    <span className="relative col-start-2 md:col-start-auto">
                      <MiniChart row={row} active={on} />
                    </span>
                    <p className="relative col-start-2 leading-relaxed text-quiet md:col-start-auto">{row.body}</p>
                  </div>
                </Reveal>
              );
            })}
          </ol>

          {/* the stamp that follows the pointer */}
          <motion.div aria-hidden="true" className="pointer-events-none absolute left-0 top-0 z-10 hidden text-lg md:block" style={{ x, y }}>
            <AnimatePresence mode="popLayout">
              {current ? (
                <motion.div
                  key={current.key}
                  initial={{ scale: 1.9, opacity: 0, rotate: -24 }}
                  animate={{ scale: 1, opacity: 1, rotate: -10 }}
                  exit={{ scale: 0.9, opacity: 0, transition: { duration: 0.15 } }}
                  transition={{ type: "spring", stiffness: 480, damping: 22 }}
                >
                  <Stamp tone={current.tone} sub="Verdict" className="bg-paper/70 backdrop-blur-[2px]">
                    {current.stamp}
                  </Stamp>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </section>
  );
}

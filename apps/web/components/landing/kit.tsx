"use client";

import { motion, useReducedMotion, useSpring } from "framer-motion";
import { Fragment, useRef, type ReactNode } from "react";
import { cx } from "../ui/cx";

export const EASE_OUT: [number, number, number, number] = [0.16, 1, 0.3, 1];

/** Page gutter + max width shared by every section. */
export const WRAP = "mx-auto w-full max-w-[1440px] px-5 md:px-10";

export type Tone = "sage" | "ink" | "amber" | "rose" | "clay";

export const TONE_TEXT: Record<Tone, string> = {
  sage: "text-sage",
  ink: "text-ink",
  amber: "text-amber",
  rose: "text-rose",
  clay: "text-clay",
};

export const TONE_BG: Record<Tone, string> = {
  sage: "bg-sage",
  ink: "bg-ink",
  amber: "bg-amber",
  rose: "bg-rose",
  clay: "bg-clay",
};

/** Scroll smoothly to an in-page anchor (CSS smooth scrolling is off on this page because of the pins). */
export function scrollToId(id: string) {
  const el = document.getElementById(id);
  if (!el) return;
  const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  el.scrollIntoView({ behavior: reduce ? "auto" : "smooth", block: "start" });
}

/** Words rise one by one out of a clipping mask. */
export function SplitWords({
  text,
  className,
  wordClassName,
  delay = 0,
  stagger = 0.055,
  immediate = false,
}: {
  text: string;
  className?: string;
  wordClassName?: string;
  delay?: number;
  stagger?: number;
  /** Animate on mount instead of on scroll into view. */
  immediate?: boolean;
}) {
  const words = text.split(" ");
  // The trigger sits on the wrapper: each word starts clipped by its mask, so an observer on the word itself would never fire.
  const play = immediate ? { animate: "show" } : { whileInView: "show", viewport: { once: true, margin: "0px 0px -8% 0px" } };
  return (
    <motion.span className={className} initial="hidden" {...play}>
      {words.map((word, index) => (
        <Fragment key={`${word}-${index}`}>
          <span className="-mb-[0.14em] -mr-[0.08em] inline-block overflow-hidden pb-[0.14em] pr-[0.08em] align-bottom">
            <motion.span
              className={cx("inline-block will-change-transform", wordClassName)}
              variants={{
                hidden: { y: "118%" },
                show: { y: "0%", transition: { duration: 1.05, ease: EASE_OUT, delay: delay + index * stagger } },
              }}
            >
              {word}
            </motion.span>
          </span>
          {index < words.length - 1 ? " " : null}
        </Fragment>
      ))}
    </motion.span>
  );
}

/** Fade + rise when scrolled into view. */
export function Reveal({
  children,
  className,
  delay = 0,
  y = 28,
  as = "div",
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  y?: number;
  as?: "div" | "li" | "p";
}) {
  const props = {
    className,
    initial: { opacity: 0, y },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: "0px 0px -10% 0px" },
    transition: { duration: 0.95, ease: EASE_OUT, delay },
  };
  if (as === "li") return <motion.li {...props}>{children}</motion.li>;
  if (as === "p") return <motion.p {...props}>{children}</motion.p>;
  return <motion.div {...props}>{children}</motion.div>;
}

/** A rubber verdict stamp. Size follows font size. */
export function Stamp({
  children,
  sub,
  tone = "ink",
  className,
}: {
  children: ReactNode;
  sub?: ReactNode;
  tone?: Tone;
  className?: string;
}) {
  return (
    <span className={cx("stamp", TONE_TEXT[tone], className)}>
      <span>{children}</span>
      {sub ? <span className="stamp-sub">{sub}</span> : null}
    </span>
  );
}

/** Pulls its child toward the mouse pointer a little. Mouse only; touch and reduced motion stay still. */
export function Magnetic({ children, className, strength = 0.3 }: { children: ReactNode; className?: string; strength?: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const x = useSpring(0, { stiffness: 260, damping: 18, mass: 0.5 });
  const y = useSpring(0, { stiffness: 260, damping: 18, mass: 0.5 });

  function move(event: React.PointerEvent<HTMLDivElement>) {
    if (reduce || event.pointerType !== "mouse" || !ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    x.set((event.clientX - (rect.left + rect.width / 2)) * strength);
    y.set((event.clientY - (rect.top + rect.height / 2)) * strength);
  }

  return (
    <motion.div
      ref={ref}
      className={cx("inline-block", className)}
      style={{ x, y }}
      onPointerMove={move}
      onPointerLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

/** "§02 · The wobble ———————— Fig. 02" */
export function SectionTag({ index, label, fig, className }: { index: string; label: string; fig?: string; className?: string }) {
  return (
    <div className={cx("lab flex items-center gap-3 text-quiet md:gap-5", className)}>
      <span className="text-clay">§{index}</span>
      <span className="text-ink">{label}</span>
      <motion.span
        aria-hidden="true"
        className="h-px flex-1 origin-left bg-line"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 1.6, ease: EASE_OUT }}
      />
      {fig ? <span className="hidden sm:inline">{fig}</span> : null}
    </div>
  );
}

/** Printer's crop marks at the four corners of the parent (which must be positioned). */
export function CropMarks({ className }: { className?: string }) {
  const mark = "absolute h-3.5 w-3.5 border-ink/35";
  return (
    <span aria-hidden="true" className={cx("pointer-events-none absolute inset-0", className)}>
      <span className={cx(mark, "-left-2 -top-2 border-l border-t")} />
      <span className={cx(mark, "-right-2 -top-2 border-r border-t")} />
      <span className={cx(mark, "-bottom-2 -left-2 border-b border-l")} />
      <span className={cx(mark, "-bottom-2 -right-2 border-b border-r")} />
    </span>
  );
}

/** The WorthIt mark set in the landing typeface. */
export function LandingMark({ className }: { className?: string }) {
  return (
    <span className={cx("inline-flex items-center gap-2.5", className)}>
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-clay">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5.5 12.5 4 4 9-9" />
        </svg>
      </span>
      <span className="font-display text-[1.6rem] font-semibold leading-none tracking-[-0.02em]">
        Worth<span className="font-normal italic text-clay">It</span>
      </span>
    </span>
  );
}

export function Arrow({ className, direction = "right" }: { className?: string; direction?: "right" | "down" | "up-right" }) {
  const rotate = direction === "down" ? "rotate-90" : direction === "up-right" ? "-rotate-45" : "";
  return (
    <svg viewBox="0 0 24 24" className={cx("h-[1em] w-[1em]", rotate, className)} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M4 12h15M13 6l6 6-6 6" />
    </svg>
  );
}

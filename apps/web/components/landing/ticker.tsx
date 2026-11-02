"use client";

import { motion, useAnimationFrame, useMotionValue, useReducedMotion, useScroll, useSpring, useTransform, useVelocity, wrap } from "framer-motion";
import { Fragment, useRef, type ReactNode } from "react";
import { cx } from "../ui/cx";

/** A marquee that speeds up with your scroll and reverses when you scroll back up. */
function VelocityRow({ children, speed, className }: { children: ReactNode; speed: number; className?: string }) {
  const reduce = useReducedMotion();
  const base = useMotionValue(0);
  const { scrollY } = useScroll();
  const velocity = useVelocity(scrollY);
  const smooth = useSpring(velocity, { damping: 50, stiffness: 400 });
  const boost = useTransform(smooth, [-1600, 0, 1600], [-5, 0, 5], { clamp: false });
  const x = useTransform(base, (value) => `${wrap(-50, 0, value)}%`);
  const direction = useRef(1);

  useAnimationFrame((_, delta) => {
    if (reduce) return;
    const b = boost.get();
    if (b < -0.05) direction.current = -1;
    else if (b > 0.05) direction.current = 1;
    base.set(base.get() + direction.current * speed * (delta / 1000) * (1 + Math.abs(b)));
  });

  return (
    <div className={cx("flex overflow-hidden whitespace-nowrap", className)}>
      <motion.div className="flex shrink-0 whitespace-nowrap will-change-transform" style={{ x }}>
        {children}
        {children}
      </motion.div>
    </div>
  );
}

function Star({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={cx("h-[0.45em] w-[0.45em] shrink-0", className)} fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round">
      <path d="M12 2v20M2 12h20M4.9 4.9l14.2 14.2M19.1 4.9 4.9 19.1" />
    </svg>
  );
}

const VERDICTS: [string, string][] = [
  ["Worth it", "text-sage"],
  ["Not worth it", "text-ink"],
  ["Too early", "text-amber"],
  ["Making it worse", "text-rose"],
];

const SIGNALS = ["Acne", "Pores", "Redness", "Texture", "Sleep", "Stress", "Face touches", "Humidity", "Cycle"];

export function Ticker() {
  const verdictRun = (
    <span className="flex items-center">
      {[...VERDICTS, ...VERDICTS].map(([word, tone], index) => (
        <Fragment key={index}>
          <span className={cx("px-6 font-display text-5xl italic leading-[1.15] md:px-10 md:text-7xl", tone)}>{word}</span>
          <Star className="text-5xl text-clay md:text-7xl" />
        </Fragment>
      ))}
    </span>
  );
  const signalRun = (
    <span className="flex items-center">
      {[...SIGNALS, ...SIGNALS].map((word, index) => (
        <Fragment key={index}>
          <span className="lab px-5 text-[12px] text-quiet md:px-8">{word}</span>
          <span className="h-1 w-1 rounded-full bg-quiet/60" />
        </Fragment>
      ))}
    </span>
  );
  return (
    <section aria-hidden="true" className="theme-night relative overflow-hidden border-y border-line bg-paper py-8 text-ink md:py-12">
      <VelocityRow speed={-1.4}>{verdictRun}</VelocityRow>
      <VelocityRow speed={1.1} className="mt-5 md:mt-7">
        {signalRun}
      </VelocityRow>
    </section>
  );
}

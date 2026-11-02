"use client";

import { MotionConfig, motion, useScroll, useSpring } from "framer-motion";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useEffect } from "react";

gsap.registerPlugin(ScrollTrigger);

/** Page-wide motion setup: reduced-motion aware, a reading-progress hairline, film grain, and pin re-measuring once fonts land. */
export function LandingRuntime({ children }: { children: React.ReactNode }) {
  const { scrollYProgress } = useScroll();
  const progress = useSpring(scrollYProgress, { stiffness: 140, damping: 30, mass: 0.3 });

  useEffect(() => {
    // Display fonts change line heights, so every pinned section has to be measured again once they arrive.
    let cancelled = false;
    document.fonts?.ready.then(() => {
      if (!cancelled) ScrollTrigger.refresh();
    });
    const onLoad = () => ScrollTrigger.refresh();
    window.addEventListener("load", onLoad);
    return () => {
      cancelled = true;
      window.removeEventListener("load", onLoad);
    };
  }, []);

  return (
    <MotionConfig reducedMotion="user">
      <motion.div aria-hidden="true" className="fixed inset-x-0 top-0 z-[80] h-[2px] origin-left bg-clay" style={{ scaleX: progress }} />
      {children}
      <div aria-hidden="true" className="landing-grain" />
    </MotionConfig>
  );
}

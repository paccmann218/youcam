"use client";

import { AnimatePresence, motion, useMotionValueEvent, useScroll } from "framer-motion";
import Link from "next/link";
import { useState } from "react";
import { ThemeToggle } from "../theme-toggle";
import { cx } from "../ui/cx";
import { Arrow, EASE_OUT, LandingMark, Magnetic, scrollToId } from "./kit";

export const SECTIONS: { n: string; label: string; id: string }[] = [
  { n: "01", label: "The mirror", id: "mirror" },
  { n: "02", label: "The wobble", id: "wobble" },
  { n: "03", label: "The verdicts", id: "verdicts" },
  { n: "04", label: "Before you buy", id: "buy" },
  { n: "05", label: "The method", id: "method" },
];

/** Hides while you read downward, returns the moment you scroll up. Section links appear once the cover is behind you. */
export function Nav() {
  const { scrollY } = useScroll();
  const [hidden, setHidden] = useState(false);
  const [solid, setSolid] = useState(false);
  const [deep, setDeep] = useState(false);

  useMotionValueEvent(scrollY, "change", (y) => {
    const previous = scrollY.getPrevious() ?? 0;
    if (y > previous && y > 520) setHidden(true);
    else if (y < previous) setHidden(false);
    setSolid(y > 24);
    setDeep(y > window.innerHeight * 0.8);
  });

  return (
    <motion.header
      className="fixed inset-x-0 top-0 z-50 px-3 pt-3 md:px-6"
      initial={{ y: "-130%" }}
      animate={{ y: hidden ? "-130%" : "0%" }}
      transition={{ duration: 0.6, ease: EASE_OUT }}
    >
      <nav
        aria-label="Main"
        className={cx(
          "mx-auto flex max-w-[1440px] items-center justify-between gap-4 rounded-full border py-2 pl-4 pr-2 transition-[background-color,border-color,box-shadow] duration-500",
          solid ? "glass border-line shadow-soft" : "border-transparent",
        )}
      >
        <button type="button" onClick={() => scrollToId("top")} aria-label="WorthIt, back to top" className="rounded-full">
          <LandingMark />
        </button>

        <AnimatePresence>
          {deep ? (
            <motion.ul
              className="hidden items-center gap-1 xl:flex"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.35 }}
            >
              {SECTIONS.map((section) => (
                <li key={section.id}>
                  <button
                    type="button"
                    onClick={() => scrollToId(section.id)}
                    className="lab rounded-full px-3 py-2 text-quiet transition-colors hover:bg-ink/5 hover:text-ink"
                  >
                    <span className="text-clay">{section.n}</span> {section.label}
                  </button>
                </li>
              ))}
            </motion.ul>
          ) : null}
        </AnimatePresence>

        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Magnetic strength={0.25}>
            <Link
              href="/today"
              className="group inline-flex min-h-10 items-center gap-2 whitespace-nowrap rounded-full bg-ink py-1 pl-4 pr-1 text-sm font-medium text-paper transition-colors hover:bg-ink/90"
            >
              <span className="hidden sm:inline">Open the app</span>
              <span className="sm:hidden">Open app</span>
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-clay text-on-clay transition-transform duration-300 group-hover:-rotate-45">
                <Arrow />
              </span>
            </Link>
          </Magnetic>
        </div>
      </nav>
    </motion.header>
  );
}

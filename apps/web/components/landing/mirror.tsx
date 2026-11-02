"use client";

import {
  AnimatePresence,
  animate,
  motion,
  useMotionTemplate,
  useMotionValue,
  useMotionValueEvent,
  useReducedMotion,
  useSpring,
  useTransform,
} from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { cx } from "../ui/cx";
import { Reveal, SectionTag, SplitWords, WRAP } from "./kit";
import { TopoFace } from "./topo-face";

const MIRROR_SAYS = ["Tired.", "Glowing!", "Fine, I guess.", "Blotchy.", "Worse than yesterday."];

const FORCES = [
  { key: "A", title: "Light", body: "Bathroom bulb, window, phone flash. A good skin day might just be good lighting." },
  { key: "B", title: "Life", body: "A short night or a stressful week can move your skin more than any serum." },
  { key: "C", title: "Hands", body: "You touch your face all day, and the newest product takes the blame." },
];

/** The face sits inset in the oval. Light positions are kept in face coordinates (0..1) and mapped out for the overlay. */
const INSET = 0.08;

function Mirror() {
  const reduce = useReducedMotion();
  const faceRef = useRef<HTMLDivElement>(null);
  const lx = useMotionValue(0.26);
  const ly = useMotionValue(0.3);
  const sx = useSpring(lx, { stiffness: 80, damping: 17 });
  const sy = useSpring(ly, { stiffness: 80, damping: 17 });

  const faceX = useTransform(sx, (v) => `${(v * 100).toFixed(2)}%`);
  const faceY = useTransform(sy, (v) => `${(v * 100).toFixed(2)}%`);
  const ovalX = useTransform(sx, (v) => `${((INSET + v * (1 - 2 * INSET)) * 100).toFixed(2)}%`);
  const ovalY = useTransform(sy, (v) => `${((INSET + v * (1 - 2 * INSET)) * 100).toFixed(2)}%`);

  const shade = useMotionTemplate`radial-gradient(110% 85% at ${ovalX} ${ovalY}, rgb(255 238 214 / 0.55), rgb(255 238 214 / 0.05) 42%, rgb(20 14 10 / 0.42) 100%)`;
  const litMask = useMotionTemplate`radial-gradient(circle at ${faceX} ${faceY}, #000 0%, #000 12%, transparent 44%)`;
  const angle = useTransform(sx, (v) => {
    const deg = Math.round((v - 0.5) * 140);
    return `${deg < 0 ? "−" : deg > 0 ? "+" : "±"}${Math.abs(deg)}°`;
  });

  const [bucket, setBucket] = useState(1);
  const [touched, setTouched] = useState(false);

  useMotionValueEvent(sx, "change", (v) => {
    const next = v < 0.24 ? 0 : v < 0.42 ? 1 : v < 0.58 ? 2 : v < 0.76 ? 3 : 4;
    setBucket((previous) => (previous === next ? previous : next));
  });

  // Until someone takes over, the light drifts around the face by itself (and on touch screens).
  useEffect(() => {
    if (touched || reduce) return;
    const ax = animate(lx, [0.26, 0.86, 0.5, 0.1, 0.26], { duration: 12, repeat: Infinity, ease: "easeInOut" });
    const ay = animate(ly, [0.3, 0.44, 0.2, 0.5, 0.3], { duration: 12, repeat: Infinity, ease: "easeInOut" });
    return () => {
      ax.stop();
      ay.stop();
    };
  }, [touched, reduce, lx, ly]);

  function onMove(event: React.PointerEvent<HTMLDivElement>) {
    const rect = faceRef.current?.getBoundingClientRect();
    if (!rect) return;
    setTouched(true);
    lx.set(Math.min(1.1, Math.max(-0.1, (event.clientX - rect.left) / rect.width)));
    ly.set(Math.min(1.1, Math.max(-0.1, (event.clientY - rect.top) / rect.height)));
  }

  const accepted = bucket === 2;

  return (
    <figure className="relative mx-auto w-full max-w-[440px]">
      <div className="relative">
        <span aria-hidden="true" className="pointer-events-none absolute -inset-3 rounded-[50%] border border-line md:-inset-4" />
        <span aria-hidden="true" className="pointer-events-none absolute -inset-7 rounded-[50%] border border-dashed border-line/80 md:-inset-9" />
        <div
          onPointerMove={onMove}
          className="relative aspect-[3/4] cursor-crosshair touch-pan-y select-none overflow-hidden rounded-[50%] border border-ink/20 bg-card shadow-lift"
          role="img"
          aria-label="Illustration: a face drawn as contour lines inside an oval mirror, lit from a moving light"
        >
          <div ref={faceRef} className="absolute" style={{ inset: `${INSET * 100}%` }}>
            <TopoFace className="absolute inset-0 h-full w-full" weight={0.95} opacity={0.75} />
            <motion.div className="absolute inset-0" style={{ maskImage: litMask, WebkitMaskImage: litMask }}>
              <TopoFace className="h-full w-full" strokeClass="stroke-clay" weight={1.7} draw={false} />
            </motion.div>
          </div>
          <motion.div className="pointer-events-none absolute inset-0 mix-blend-soft-light" style={{ background: shade }} />
          <motion.span
            aria-hidden="true"
            className="pointer-events-none absolute h-5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-paper bg-clay shadow-[0_0_0_6px_rgb(var(--clay)/0.18),0_0_40px_12px_rgb(var(--clay)/0.35)]"
            style={{ left: ovalX, top: ovalY }}
          />
          {/* Camera Kit's guide oval: solid when the light is even, dashed when it would refuse */}
          <span
            aria-hidden="true"
            className={cx(
              "pointer-events-none absolute inset-[5%] rounded-[50%] border-2 transition-colors duration-300",
              accepted ? "border-sage" : "border-dashed border-rose/60",
            )}
          />
        </div>
      </div>

      <dl className="mt-14 border-y border-line text-sm">
        <div className="grid grid-cols-[9rem_1fr] items-center gap-3 border-b border-line py-3">
          <dt className="lab text-quiet">Light angle</dt>
          <dd className="num font-lab text-base">
            <motion.span>{angle}</motion.span>
          </dd>
        </div>
        <div className="grid min-h-[3.75rem] grid-cols-[9rem_1fr] items-center gap-3 border-b border-line py-3">
          <dt className="lab text-quiet">The mirror says</dt>
          <dd aria-live="polite" className="overflow-hidden">
            <AnimatePresence mode="wait" initial={false}>
              <motion.span
                key={bucket}
                className="block font-display text-2xl italic"
                initial={{ y: "100%", opacity: 0 }}
                animate={{ y: "0%", opacity: 1 }}
                exit={{ y: "-100%", opacity: 0 }}
                transition={{ duration: 0.28 }}
              >
                &ldquo;{MIRROR_SAYS[bucket]}&rdquo;
              </motion.span>
            </AnimatePresence>
          </dd>
        </div>
        <div className="grid grid-cols-[9rem_1fr] items-center gap-3 py-3">
          <dt className="lab text-quiet">Camera Kit</dt>
          <dd className={cx("lab flex items-center gap-2 transition-colors", accepted ? "text-sage" : "text-rose")}>
            <span className="h-2 w-2 rounded-full bg-current" />
            {accepted ? "Accepted · even light" : "Refused · uneven light"}
          </dd>
        </div>
      </dl>
      <figcaption className="lab mt-4 text-quiet">
        Fig. 01 · {touched ? "Keep moving the light." : "Move your cursor over the mirror."} The mirror changes its mind. Your skin didn&apos;t.
      </figcaption>
    </figure>
  );
}

export function MirrorSection() {
  return (
    <section id="mirror" className="relative py-24 md:py-36">
      <div className={WRAP}>
        <SectionTag index="01" label="The mirror" fig="Fig. 01 · same face, moving light" />
        <div className="mt-14 grid items-center gap-20 lg:mt-24 lg:grid-cols-[1.05fr_.95fr] lg:gap-24">
          <div>
            <h2 className="font-display text-[clamp(2.6rem,5.4vw,5.6rem)] font-medium leading-[0.98] tracking-[-0.03em]">
              <SplitWords text="Your mirror changes its mind" />{" "}
              <SplitWords text="every time the light moves." wordClassName="font-normal italic text-clay" delay={0.3} />
            </h2>
            <Reveal delay={0.15}>
              <p className="mt-8 max-w-lg text-lg leading-relaxed text-quiet">
                Same face, same morning, a different verdict at every angle. Skincare takes weeks to show, and most of us judge it in days, by eye. Three things
                get in the way:
              </p>
            </Reveal>
            <ol className="mt-12 border-t border-line">
              {FORCES.map((force, index) => (
                <Reveal key={force.key} as="li" delay={0.08 * index} className="grid grid-cols-[2rem_5.5rem_1fr] items-baseline gap-3 border-b border-line py-5 md:grid-cols-[3rem_8rem_1fr]">
                  <span className="lab text-clay">{force.key}</span>
                  <span className="font-display text-2xl italic md:text-3xl">{force.title}</span>
                  <span className="leading-relaxed text-quiet">{force.body}</span>
                </Reveal>
              ))}
            </ol>
          </div>
          <Mirror />
        </div>
      </div>
    </section>
  );
}

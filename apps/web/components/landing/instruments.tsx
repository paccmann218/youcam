"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef, type ReactNode } from "react";
import { Laptop } from "../illustrations/Laptop";
import { Phone } from "../illustrations/Phone";
import { Watch } from "../illustrations/Watch";
import { cx } from "../ui/cx";
import { Arrow, CropMarks, Reveal, SectionTag, SplitWords } from "./kit";

gsap.registerPlugin(ScrollTrigger, useGSAP);

type Instrument = {
  n: string;
  device: string;
  lead: string;
  verb: string;
  body: string;
  specs: [string, string][];
  art: ReactNode;
  fig: string;
};

const INSTRUMENTS: Instrument[] = [
  {
    n: "01",
    device: "Your phone",
    lead: "The phone",
    verb: "scans.",
    body: "One quick scan each morning. YouCam Skin Analysis scores acne, pores, redness and texture, and WorthIt keeps the raw score, not the flattering one.",
    specs: [
      ["Measures", "Acne · pores · redness · texture"],
      ["Gate", "Camera Kit refuses bad light and bad angles"],
      ["First", "Five scans in a row: your normal wobble"],
      ["Then", "One scan a morning, same spot, same time"],
    ],
    art: <Phone screen="capture" className="h-full w-auto drop-shadow-2xl" />,
    fig: "Camera Kit guide oval",
  },
  {
    n: "02",
    device: "Your Galaxy Watch",
    lead: "The watch",
    verb: "notices.",
    body: "It records what else changed: last night's sleep, your stress, and every time your hand reaches your face. It buzzes, and the count goes live on the laptop.",
    specs: [
      ["Watches", "Sleep · stress · face touches"],
      ["Buzzes", "On a face touch, and to wake you for the scan"],
      ["Pairing", "None. It finds the laptop by itself"],
      ["Never faked", "No skin temperature, no invented heart data"],
    ],
    art: <Watch screen="hands" count={3} ripple="loop" className="h-[82%] w-auto drop-shadow-2xl" />,
    fig: "Hands-off counter",
  },
  {
    n: "03",
    device: "Your laptop",
    lead: "The laptop",
    verb: "decides.",
    body: "The ledger. It weighs your mornings against your wobble and everything the watch saw, then gives one of four answers, plus the earliest day an honest one is possible.",
    specs: [
      ["Rule", "Worth it only if P(effect > wobble) ≥ 0.95"],
      ["Adjusts for", "Sleep · stress · touching · humidity · cycle"],
      ["Earliest day", "Simulated from your own noise, every morning"],
      ["Wording", "Checked against cure · treat · diagnose"],
    ],
    art: <Laptop className="w-full drop-shadow-2xl" />,
    fig: "The ledger",
  },
];

function Panel({ item }: { item: Instrument }) {
  return (
    <article
      className={cx(
        "inst-panel relative flex w-full shrink-0 flex-col gap-12 overflow-hidden border-t border-line px-5 py-20 md:px-10",
        "lg:flex-row lg:items-center lg:gap-16 lg:px-14 lg:py-24",
        "lg:motion-safe:h-full lg:motion-safe:w-[86vw] lg:motion-safe:border-l lg:motion-safe:border-t-0 lg:motion-safe:py-0",
      )}
    >
      <span
        aria-hidden="true"
        className="inst-num text-outline pointer-events-none absolute -right-2 top-6 select-none font-display text-[clamp(8rem,17vw,17rem)] font-black leading-none opacity-60 lg:right-10 lg:top-8"
      >
        {item.n}
      </span>

      <div className="relative h-[44svh] max-h-[460px] w-full lg:h-[64vh] lg:max-h-[640px] lg:w-[42%]">
        <div className="relative h-full overflow-hidden rounded-[28px] border border-line bg-card/70">
          <div aria-hidden="true" className="dotgrid absolute inset-0 opacity-60" />
          <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-peach/30 to-transparent" />
          <div className="inst-art absolute inset-0 flex items-center justify-center p-8 md:p-12">{item.art}</div>
          <p className="lab absolute bottom-4 left-5 text-quiet">
            Fig. 03.{item.n} · {item.fig}
          </p>
        </div>
        <CropMarks />
      </div>

      <div className="relative max-w-xl lg:flex-1">
        <p className="lab text-clay">
          Instrument {item.n} · {item.device}
        </p>
        <h3 className="mt-4 font-display text-[clamp(3rem,5.6vw,6rem)] font-medium leading-[0.92] tracking-[-0.03em]">
          {item.lead} <em className="font-normal text-clay">{item.verb}</em>
        </h3>
        <p className="mt-6 text-lg leading-relaxed text-quiet">{item.body}</p>
        <dl className="mt-8 border-t border-line">
          {item.specs.map(([key, value]) => (
            <div key={key} className="grid grid-cols-[7.5rem_1fr] items-baseline gap-4 border-b border-line py-3 md:grid-cols-[9rem_1fr]">
              <dt className="lab text-quiet">{key}</dt>
              <dd className="text-[15px] leading-snug">{value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </article>
  );
}

export function Instruments() {
  const root = useRef<HTMLElement>(null);
  const track = useRef<HTMLDivElement>(null);
  const bar = useRef<HTMLSpanElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(min-width: 1024px) and (prefers-reduced-motion: no-preference)", () => {
        const section = root.current;
        const strip = track.current;
        if (!section || !strip) return;
        const distance = () => Math.max(0, strip.scrollWidth - window.innerWidth);

        const slide = gsap.to(strip, {
          x: () => -distance(),
          ease: "none",
          scrollTrigger: {
            trigger: section,
            start: "top top",
            end: () => `+=${distance()}`,
            pin: true,
            scrub: 0.9,
            anticipatePin: 1,
            invalidateOnRefresh: true,
            onUpdate: (self) => {
              if (bar.current) bar.current.style.transform = `scaleX(${self.progress})`;
            },
          },
        });

        gsap.utils.toArray<HTMLElement>(".inst-num", section).forEach((el) => {
          gsap.fromTo(
            el,
            { xPercent: 30 },
            { xPercent: -20, ease: "none", scrollTrigger: { trigger: el.parentElement, containerAnimation: slide, start: "left right", end: "right left", scrub: true } },
          );
        });
        gsap.utils.toArray<HTMLElement>(".inst-art", section).forEach((el) => {
          gsap.fromTo(
            el,
            { yPercent: 22, rotate: 6, opacity: 0.15 },
            { yPercent: 0, rotate: 0, opacity: 1, ease: "power2.out", scrollTrigger: { trigger: el, containerAnimation: slide, start: "left 98%", end: "left 40%", scrub: true } },
          );
        });
      });
    },
    { scope: root },
  );

  return (
    <section id="method" ref={root} className="relative overflow-hidden" aria-label="The method: three instruments">
      <div ref={track} className="flex flex-col lg:motion-safe:h-[100svh] lg:motion-safe:w-max lg:motion-safe:flex-row">
        <div className="flex shrink-0 flex-col justify-center px-5 pb-4 pt-24 md:px-10 lg:px-14 lg:motion-safe:h-full lg:motion-safe:w-[48vw] lg:motion-safe:pt-0">
          <SectionTag index="03" label="The method" fig="Fig. 03" />
          <h2 className="mt-10 font-display text-[clamp(3rem,6.2vw,7rem)] font-medium leading-[0.92] tracking-[-0.035em]">
            <SplitWords text="Three instruments" /> <SplitWords text="you already own." wordClassName="font-normal italic text-clay" delay={0.2} />
          </h2>
          <Reveal delay={0.2}>
            <p className="mt-8 max-w-md text-lg leading-relaxed text-quiet">No new gadget. Set it up once, and after that it is one scan a morning.</p>
          </Reveal>
          <p className="lab mt-12 hidden items-center gap-3 text-quiet lg:motion-safe:flex">
            Keep scrolling <Arrow className="text-clay" />
          </p>
        </div>
        {INSTRUMENTS.map((item) => (
          <Panel key={item.n} item={item} />
        ))}
      </div>

      <div aria-hidden="true" className="pointer-events-none absolute inset-x-14 bottom-8 hidden items-center gap-4 lg:motion-safe:flex">
        <span className="lab text-quiet">01</span>
        <span className="relative h-px flex-1 bg-line">
          <span ref={bar} className="absolute inset-0 origin-left scale-x-0 bg-clay" />
        </span>
        <span className="lab text-quiet">03</span>
      </div>
    </section>
  );
}

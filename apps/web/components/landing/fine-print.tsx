"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { useRef } from "react";
import { cx } from "../ui/cx";
import { Reveal, SectionTag, WRAP } from "./kit";

gsap.registerPlugin(ScrollTrigger, useGSAP);

/* [text, emphasised] */
const STATEMENT: [string, boolean][] = [
  ["WorthIt only calls it when a change is bigger than your", false],
  ["normal wobble.", true],
  ["Until then it says", false],
  ["too early,", true],
  ["and tells you the day it could know.", false],
];

const RULES = [
  { n: "i", title: "No made-up numbers.", body: "If something hasn't been measured yet, the app says not measured instead of guessing." },
  { n: "ii", title: "The raw score.", body: "YouCam returns a friendlier display score. WorthIt keeps the raw one." },
  { n: "iii", title: "A personal test, not medicine.", body: "Every sentence is checked against cure, treat, diagnose and guaranteed before you see it." },
  { n: "iv", title: "Your face, your data.", body: "Consent comes first, and one button deletes your records." },
];

const FORMULAS = [
  { label: "Normal wobble", formula: "MDC95 = 1.96 · √2 · SEM", note: "From five back-to-back scans." },
  { label: "Worth it, only if", formula: "P(β > MDC95) ≥ 0.95", note: "The effect has to clear the wobble." },
  { label: "Earliest honest day", formula: "min n : power ≥ 0.80", note: "Seeded simulation from your own noise." },
];

export function FinePrint() {
  const root = useRef<HTMLElement>(null);

  useGSAP(
    () => {
      const mm = gsap.matchMedia();
      mm.add("(prefers-reduced-motion: no-preference)", () => {
        gsap.fromTo(
          ".fp-word",
          { opacity: 0.14 },
          {
            opacity: 1,
            ease: "none",
            stagger: 0.12,
            scrollTrigger: { trigger: ".fp-statement", start: "top 82%", end: "bottom 42%", scrub: true },
          },
        );
      });
    },
    { scope: root },
  );

  return (
    <section id="fine-print" ref={root} className="relative py-24 md:py-36">
      <div className={WRAP}>
        <SectionTag index="06" label="The fine print" fig="Fig. 06 · in large print" />

        <p className="fp-statement mt-16 max-w-[22ch] font-display text-[clamp(2.3rem,5vw,5.2rem)] font-medium leading-[1.04] tracking-[-0.03em] md:mt-24">
          {STATEMENT.flatMap(([text, emphasis], segment) =>
            text.split(" ").map((word, index) => (
              <span key={`${segment}-${index}`} className={cx("fp-word", emphasis && "font-normal italic text-clay")}>
                {word}{" "}
              </span>
            )),
          )}
        </p>

        <div className="mt-24 grid border-t border-line md:mt-32 md:grid-cols-2">
          {RULES.map((rule, index) => (
            <Reveal
              key={rule.n}
              delay={(index % 2) * 0.08}
              className={cx("flex gap-6 border-b border-line py-10 md:gap-8 md:py-14", index % 2 === 0 ? "md:border-r md:pr-12" : "md:pl-12")}
            >
              <span className="w-14 shrink-0 font-display text-5xl italic leading-none text-clay md:w-20 md:text-7xl">{rule.n}.</span>
              <div>
                <h3 className="font-display text-2xl font-medium leading-tight md:text-[2.1rem]">{rule.title}</h3>
                <p className="mt-3 max-w-sm leading-relaxed text-quiet">{rule.body}</p>
              </div>
            </Reveal>
          ))}
        </div>

        <div className="mt-20 grid gap-4 md:grid-cols-3">
          {FORMULAS.map((item, index) => (
            <Reveal key={item.label} delay={index * 0.08} className="relative rounded-[22px] border border-line bg-card/60 p-6">
              <p className="lab text-quiet">{item.label}</p>
              <p className="num mt-4 font-lab text-[15px] font-medium tracking-tight text-ink md:text-base">{item.formula}</p>
              <p className="mt-3 text-sm text-quiet">{item.note}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

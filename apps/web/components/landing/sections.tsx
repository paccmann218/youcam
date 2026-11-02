import Link from "next/link";
import type { ReactNode } from "react";
import { BRAND, Wordmark } from "../brand";
import { Icon, type IconName } from "../icons";
import { Face } from "../illustrations/Face";
import { Laptop } from "../illustrations/Laptop";
import { ClaimMini, ConfoundersMini, LightsMini } from "../illustrations/Mini";
import { Phone } from "../illustrations/Phone";
import { Watch } from "../illustrations/Watch";
import { ThemeToggle } from "../theme-toggle";
import { ButtonLink } from "../ui/button";
import { StatusPill } from "../ui/status";

function Section({
  id,
  kicker,
  title,
  lead,
  children,
  className = "",
  center = false,
}: {
  id?: string;
  kicker: string;
  title: ReactNode;
  lead?: ReactNode;
  children: ReactNode;
  className?: string;
  center?: boolean;
}) {
  return (
    <section id={id} className={`scroll-mt-24 px-4 py-20 md:px-6 md:py-28 ${className}`}>
      <div className="mx-auto max-w-6xl">
        <div className={center ? "mx-auto max-w-3xl text-center" : ""}>
          <p className="kicker text-clay">{kicker}</p>
          <h2 className="text-balance mt-3 font-serif text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl">{title}</h2>
          {lead ? <p className={`mt-4 text-lg leading-relaxed text-quiet ${center ? "" : "max-w-2xl"}`}>{lead}</p> : null}
        </div>
        <div className="mt-12">{children}</div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ nav */

export function Nav() {
  const links: [string, string][] = [
    ["#problem", "The problem"],
    ["#solution", "The solution"],
    ["#how", "How it works"],
    ["#buy", "Before you buy"],
  ];
  return (
    <header className="sticky top-0 z-40 px-3 pt-3 md:px-6">
      <nav className="glass mx-auto flex max-w-6xl items-center justify-between gap-3 rounded-full border border-line py-2 pl-4 pr-2 shadow-soft">
        <Link href="/" aria-label={`${BRAND} home`}>
          <Wordmark />
        </Link>
        <div className="hidden items-center gap-1 lg:flex">
          {links.map(([href, label]) => (
            <a key={href} href={href} className="rounded-full px-4 py-2 text-sm text-quiet transition hover:bg-ink/5 hover:text-ink">
              {label}
            </a>
          ))}
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <ButtonLink href="/today" size="sm" className="min-h-10 px-4">
            Open app
            <Icon name="arrow" size={16} />
          </ButtonLink>
        </div>
      </nav>
    </header>
  );
}

/* ------------------------------------------------------------------ hero */

function VerdictChip({ tone, icon, product, verdict, className }: { tone: "sage" | "amber" | "ink"; icon: IconName; product: string; verdict: string; className: string }) {
  const color = { sage: "bg-sage text-paper", amber: "bg-amber text-paper", ink: "bg-ink/70 text-paper" }[tone];
  const text = { sage: "text-sage", amber: "text-amber", ink: "text-quiet" }[tone];
  return (
    <div className={`glass absolute flex items-center gap-3 rounded-2xl border border-line py-2.5 pl-2.5 pr-4 shadow-lift ${className}`}>
      <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl ${color}`}>
        <Icon name={icon} size={18} strokeWidth={2.2} />
      </span>
      <span className="leading-tight">
        <span className="block text-[13px] font-medium text-ink">{product}</span>
        <span className={`block text-xs font-medium ${text}`}>{verdict}</span>
      </span>
    </div>
  );
}

function HeroVisual() {
  return (
    <figure className="relative mx-auto w-full max-w-[560px]">
      <div className="relative aspect-[5/6] sm:aspect-[1/1]">
        <div className="absolute inset-[6%] rounded-full bg-gradient-to-br from-peach/70 via-clay/10 to-sage/25 blur-3xl" aria-hidden="true" />
        <div className="absolute left-1/2 top-[2%] w-[46%] -translate-x-1/2 animate-float drop-shadow-2xl sm:w-[40%]">
          <Phone screen="verdict" />
        </div>
        <div className="absolute bottom-[6%] right-[4%] w-[25%] animate-float-slow drop-shadow-2xl [animation-delay:1.2s] sm:w-[22%]">
          <Watch screen="hands" count={3} ripple="loop" />
        </div>
        <VerdictChip tone="sage" icon="check" product="Niacinamide serum" verdict="Worth it · day 21" className="left-0 top-[16%] animate-float-slow [animation-delay:.4s]" />
        <VerdictChip tone="ink" icon="close" product="Vitamin C toner" verdict="Not worth it · day 28" className="left-[-2%] top-[46%] hidden animate-float sm:flex [animation-delay:1s]" />
        <VerdictChip tone="amber" icon="calendar" product="Retinol cream" verdict="Too early · ask on day 19" className="bottom-[18%] left-[2%] animate-float-slow [animation-delay:1.6s] sm:bottom-[14%]" />
      </div>
      <figcaption className="mt-2 text-center text-xs text-quiet">Example screens. Your real verdicts only appear once they are measured.</figcaption>
    </figure>
  );
}

export function Hero() {
  return (
    <section className="px-4 pb-16 pt-12 md:px-6 md:pb-24 md:pt-16">
      <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-[1.05fr_1fr]">
        <div className="animate-fade-up">
          <StatusPill tone="clay" live>
            For anyone who has bought a serum and wondered
          </StatusPill>
          <h1 className="text-balance mt-6 font-serif text-5xl font-medium leading-[1.02] tracking-tight sm:text-6xl lg:text-[4.6rem]">
            Is your skincare actually <em className="font-normal italic text-clay">worth it?</em>
          </h1>
          <p className="mt-6 max-w-xl text-lg leading-relaxed text-quiet md:text-xl">
            You can&apos;t tell from the mirror, so you keep buying. {BRAND} scans your skin each morning with your phone, tracks your sleep and stress with your
            Galaxy Watch, and gives you a straight answer: <span className="font-medium text-ink">worth it, not worth it, or too early to tell.</span>
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <ButtonLink href="/today" variant="accent" size="lg">
              Start your free test
              <Icon name="arrow" size={18} />
            </ButtonLink>
            <ButtonLink href="#how" variant="secondary" size="lg">
              See how it works
            </ButtonLink>
          </div>
          <p className="mt-8 text-sm text-quiet">
            Powered by <span className="font-medium text-ink">YouCam AI</span>: Skin Analysis · Skin Simulation · Makeup VTO · Facial Color Tones · Camera Kit
          </p>
        </div>
        <HeroVisual />
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ problem */

function ProblemCard({ n, art, title, children }: { n: number; art: ReactNode; title: string; children: ReactNode }) {
  return (
    <article className="flex flex-col rounded-3xl border border-line bg-card p-6 shadow-soft">
      <div className="dotgrid relative flex h-36 items-center justify-center rounded-2xl bg-paper/70">
        <span className="num absolute left-3 top-3 flex h-7 w-7 items-center justify-center rounded-full bg-rose/10 font-mono text-xs font-medium text-rose">{n}</span>
        {art}
      </div>
      <h3 className="mt-6 font-serif text-2xl leading-snug">{title}</h3>
      <p className="mt-2 leading-relaxed text-quiet">{children}</p>
    </article>
  );
}

export function Problem() {
  return (
    <Section
      id="problem"
      kicker="The problem"
      title="Your mirror can't tell you if it's working."
      lead="Skincare takes weeks to show results. Most of us judge it in days, by eye, and then buy the next bottle anyway."
    >
      <div className="grid gap-5 md:grid-cols-3">
        <ProblemCard n={1} art={<LightsMini className="h-28" />} title="Light lies">
          Bathroom bulb, window, phone flash. The same face looks different every morning, so a good skin day might just be good lighting.
        </ProblemCard>
        <ProblemCard n={2} art={<ConfoundersMini className="h-28" />} title="Life gets in the way">
          A short night, a stressful week or touching your face can change your skin more than any serum, and the newest product gets the blame.
        </ProblemCard>
        <ProblemCard n={3} art={<ClaimMini className="h-28" />} title="So you guess, and keep buying">
          You quit products that were working, keep ones that weren&apos;t, and trust whatever the next label promises.
        </ProblemCard>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ solution */

export function Solution() {
  const rows: [string, string][] = [
    ["Squinting in a different light every day", "A quick YouCam AI scan, same light, every morning"],
    ["Blaming the newest product for every breakout", "Your watch shows what else changed: sleep, stress, face touching"],
    ["Wondering “is it working?” for months", "Worth it, not worth it, or too early, plus the day you’ll know"],
    ["Trusting whatever the label promises", "Check the claim on your own face before you pay"],
  ];
  return (
    <Section id="solution" kicker="The solution" title={<>{BRAND} turns your guess into an answer.</>} className="bg-card/40">
      <div className="overflow-hidden rounded-4xl border border-line bg-card shadow-soft">
        <div className="grid grid-cols-2 border-b border-line">
          <div className="flex items-center gap-2 px-5 py-4 md:px-8">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-ink/5 text-quiet">
              <Icon name="close" size={14} strokeWidth={2.2} />
            </span>
            <span className="font-medium text-quiet">Without {BRAND}</span>
          </div>
          <div className="flex items-center gap-2 border-l border-line bg-clay/[0.05] px-5 py-4 md:px-8">
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay text-on-clay">
              <Icon name="check" size={14} strokeWidth={2.4} />
            </span>
            <span className="font-medium text-ink">With {BRAND}</span>
          </div>
        </div>
        {rows.map(([before, after]) => (
          <div key={before} className="grid grid-cols-2 border-b border-line last:border-b-0">
            <p className="px-5 py-5 text-[15px] leading-relaxed text-quiet line-through decoration-quiet/30 md:px-8 md:text-base">{before}</p>
            <p className="border-l border-line bg-clay/[0.05] px-5 py-5 text-[15px] font-medium leading-relaxed text-ink md:px-8 md:text-base">{after}</p>
          </div>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ how it works */

function Step({ n, device, title, art, children }: { n: number; device: string; title: string; art: ReactNode; children: ReactNode }) {
  return (
    <article className="relative flex flex-col overflow-hidden rounded-4xl border border-line bg-card shadow-soft">
      <div className="relative flex h-64 items-end justify-center overflow-hidden bg-gradient-to-b from-peach/35 to-transparent px-6 pt-6">
        <div className="dotgrid absolute inset-0 opacity-60" aria-hidden="true" />
        <span className="num absolute left-5 top-5 z-10 flex h-10 w-10 items-center justify-center rounded-full bg-ink font-mono text-sm font-medium text-paper shadow-soft">{n}</span>
        <div className="relative h-full w-full">{art}</div>
      </div>
      <div className="flex flex-1 flex-col p-6 md:p-7">
        <p className="kicker text-quiet">{device}</p>
        <h3 className="mt-2 font-serif text-3xl">{title}</h3>
        <p className="mt-3 leading-relaxed text-ink/80">{children}</p>
      </div>
    </article>
  );
}

export function HowItWorks() {
  return (
    <Section id="how" kicker="How it works" title="Three steps. Devices you already own." lead="Set it up once, then it takes a quick scan each morning.">
      <div className="grid gap-5 lg:grid-cols-3">
        <Step n={1} device="Your phone" title="Scan your face" art={<Phone screen="capture" className="mx-auto h-[118%]" />}>
          Take a quick scan each morning. YouCam AI scores pores, acne, redness and texture. Your first five scans teach {BRAND} what a normal day-to-day wobble
          looks like for your face.
        </Step>
        <Step n={2} device="Your Galaxy Watch" title="Wear your watch" art={<Watch screen="hands" count={3} ripple="loop" className="mx-auto h-full" />}>
          It tracks your sleep and stress, and buzzes when you touch your face, so {BRAND} knows what else changed besides your product.
        </Step>
        <Step n={3} device="Phone or laptop" title="Get your answer" art={<Laptop className="absolute bottom-0 left-1/2 w-full -translate-x-1/2" />}>
          {BRAND} only calls it when a change is bigger than your normal wobble: worth it, not worth it, or too early, with the day you&apos;ll know.
        </Step>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ before you buy */

export function BeforeYouBuy() {
  return (
    <section id="buy" className="scroll-mt-24 px-4 py-20 md:px-6 md:py-28">
      <div className="mx-auto grid max-w-6xl items-center gap-12 overflow-hidden rounded-[2.5rem] border border-line bg-card p-6 shadow-soft md:p-12 lg:grid-cols-2">
        <div>
          <p className="kicker text-clay">Before you buy</p>
          <h2 className="text-balance mt-3 font-serif text-4xl font-medium leading-[1.08] tracking-tight md:text-5xl">Try it on your face before you pay.</h2>
          <p className="mt-4 text-lg leading-relaxed text-quiet">
            <span className="font-medium text-ink">Makeup:</span> foundation, concealer, lip and blush shades are matched to your skin tone, then tried on your own photo, one at a
            time or the whole look together.
          </p>
          <p className="mt-3 text-lg leading-relaxed text-quiet">
            <span className="font-medium text-ink">Skincare:</span> type what the label promises, like “visibly smaller pores”. YouCam Skin Simulation renders that change on your
            photo, then Skin Analysis measures it.
          </p>
          <ul className="mt-6 space-y-3">
            {[
              ["rose", "SKIP", "Even if the claim is true, the change is too small for you to see."],
              ["sage", "TEST IT", "The change is big enough to be worth testing on your own skin."],
            ].map(([tone, label, text]) => (
              <li key={label} className="flex items-start gap-3">
                <span className={`mt-0.5 shrink-0 rounded-full px-2.5 py-1 font-mono text-[11px] font-semibold tracking-wider ${tone === "rose" ? "bg-rose/10 text-rose" : "bg-sage/10 text-sage"}`}>
                  {label}
                </span>
                <span className="leading-relaxed text-ink/85">{text}</span>
              </li>
            ))}
          </ul>
          <ButtonLink href="/shop" variant="secondary" className="mt-8">
            Open the shop
            <Icon name="arrow" size={16} />
          </ButtonLink>
        </div>
        <div className="relative mx-auto flex w-full max-w-md items-end justify-center gap-4">
          <div className="absolute inset-[10%] rounded-full bg-gradient-to-br from-rose/20 via-peach/40 to-transparent blur-3xl" aria-hidden="true" />
          <Phone screen="claim" className="relative w-[58%] drop-shadow-2xl" />
          <Watch screen="verdict" decision="skip" className="relative mb-6 w-[34%] drop-shadow-2xl" />
        </div>
      </div>
    </section>
  );
}

/* ------------------------------------------------------------------ features */

export function Features() {
  const items: [IconName, string, string][] = [
    ["scan", "Morning scan", "Every scan is compared with your normal wobble, so one good morning never fools you."],
    ["hands", "Hands off", "Your watch buzzes when you touch your face and counts it, live on your laptop."],
    ["breakout", "Breakout check", "After a breakout, see whether sleep, stress, touching or humidity explains it, or your product."],
    ["calendar", "Too-early countdown", "Ask early and it tells you so, with the earliest day an honest answer is possible."],
    ["retail", "Shop & try on", "Shades matched to your skin tone by YouCam, tried on together in one go, plus a one-tap test once you buy."],
    ["retail", "For brands", "How long a test would need to run to back up a claim, based on real scan noise."],
  ];
  return (
    <Section kicker="Everything inside" title="Small tools for the moments that matter." className="bg-card/40">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map(([icon, title, body]) => (
          <article key={title} className="rounded-3xl border border-line bg-card p-6 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
            <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-clay/10 text-clay">
              <Icon name={icon} size={20} />
            </span>
            <h3 className="mt-4 font-serif text-2xl">{title}</h3>
            <p className="mt-1.5 leading-relaxed text-quiet">{body}</p>
          </article>
        ))}
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ trust */

export function Trust() {
  const items: [IconName, string, string][] = [
    ["lab", "No made-up numbers", "If something hasn't been measured yet, the app says so instead of guessing."],
    ["scan", "The honest score", "YouCam gives a friendlier display score. WorthIt keeps the raw one."],
    ["protocol", "A personal test, not medicine", "Every sentence is checked so it never claims to cure, treat or diagnose."],
    ["privacy", "Your face, your data", "Consent comes first, and one button deletes your records."],
  ];
  return (
    <Section id="trust" kicker="Why you can trust it" title="Built to never oversell.">
      <div className="grid gap-5 lg:grid-cols-[1.2fr_1fr]">
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(([icon, title, body]) => (
            <article key={title} className="rounded-3xl border border-line bg-card p-6 shadow-soft">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-sage/10 text-sage">
                <Icon name={icon} size={20} />
              </span>
              <h3 className="mt-4 font-serif text-xl">{title}</h3>
              <p className="mt-1.5 text-[15px] leading-relaxed text-quiet">{body}</p>
            </article>
          ))}
        </div>
        <article className="flex flex-col rounded-3xl border border-line bg-card p-6 shadow-soft md:p-8">
          <p className="kicker text-clay">For the curious</p>
          <h3 className="mt-2 font-serif text-2xl">How a verdict is calculated</h3>
          <div className="mt-4 flex items-center gap-4">
            <Face variant="split" className="h-32 w-auto shrink-0" />
            <p className="text-sm leading-relaxed text-quiet">
              Testing on one side of your face cancels out sleep and stress, because both halves lived through the same night.
            </p>
          </div>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="rounded-2xl border border-line bg-paper/60 p-3">
              <dt className="text-quiet">Normal wobble, from 5 back-to-back scans</dt>
              <dd className="num mt-1 font-mono text-ink">MDC95 = 1.96 · √2 · SEM</dd>
            </div>
            <div className="rounded-2xl border border-line bg-paper/60 p-3">
              <dt className="text-quiet">“Worth it” only when the effect clears it</dt>
              <dd className="num mt-1 font-mono text-ink">P(effect &gt; MDC95) ≥ 0.95</dd>
            </div>
            <div className="rounded-2xl border border-line bg-paper/60 p-3">
              <dt className="text-quiet">Earliest honest day</dt>
              <dd className="mt-1 text-ink">Simulated tests from your own noise, updated every morning</dd>
            </div>
          </dl>
        </article>
      </div>
    </Section>
  );
}

/* ------------------------------------------------------------------ cta + footer */

export function FinalCta() {
  return (
    <section className="px-4 pb-20 md:px-6 md:pb-28">
      <div className="relative mx-auto max-w-6xl overflow-hidden rounded-[2.5rem] bg-ink px-6 py-16 text-paper shadow-lift md:px-16 md:py-20">
        <div className="absolute -right-24 -top-24 h-80 w-80 rounded-full bg-clay/40 blur-3xl" aria-hidden="true" />
        <div className="absolute -bottom-32 left-10 h-72 w-72 rounded-full bg-sage/30 blur-3xl" aria-hidden="true" />
        <div className="relative grid items-center gap-10 md:grid-cols-[1.4fr_1fr]">
          <div>
            <p className="kicker text-peach">Start tonight</p>
            <h2 className="text-balance mt-3 font-serif text-4xl font-medium leading-tight md:text-6xl">Stop paying for maybe.</h2>
            <p className="mt-4 max-w-lg text-lg leading-relaxed text-paper/70">Five quick baseline scans, your watch on overnight, then one scan each morning.</p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/today" className="inline-flex min-h-12 items-center gap-2 rounded-full bg-paper px-6 font-medium text-ink transition hover:bg-paper/90">
                Start your free test
                <Icon name="arrow" size={18} />
              </Link>
              <Link href="/shop" className="inline-flex min-h-12 items-center gap-2 rounded-full border border-paper/25 px-6 font-medium text-paper transition hover:bg-paper/10">
                Try on a shade first
              </Link>
            </div>
          </div>
          <div className="mx-auto w-48 md:w-56">
            <Watch screen="wake" strap="clay" />
          </div>
        </div>
      </div>
    </section>
  );
}

export function Footer() {
  return (
    <footer className="px-4 pb-12 md:px-6">
      <div className="mx-auto flex max-w-6xl flex-col gap-6 border-t border-line pt-8 md:flex-row md:items-center md:justify-between">
        <div>
          <Wordmark />
          <p className="mt-3 max-w-md text-sm text-quiet">{BRAND} is a personal test. It is not medical care, and it never calls itself a clinical trial.</p>
        </div>
        <div className="flex flex-col gap-2 text-sm text-quiet md:items-end">
          <p>Built with the YouCam API: Skin Analysis, Skin Simulation, Makeup VTO, Facial Color Tones and Camera Kit.</p>
          <div className="flex gap-4">
            <Link href="/today" className="hover:text-ink">
              Open app
            </Link>
            <Link href="/shop" className="hover:text-ink">
              Shop & try on
            </Link>
            <Link href="/privacy" className="hover:text-ink">
              Privacy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}

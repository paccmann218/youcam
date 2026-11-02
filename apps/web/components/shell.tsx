"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { BRAND, Wordmark } from "./brand";
import { Icon, type IconName } from "./icons";
import { Face } from "./illustrations/Face";
import { useProof } from "./provider";
import { ThemeToggle } from "./theme-toggle";
import { Button } from "./ui/button";
import { Callout } from "./ui/callout";
import { cx } from "./ui/cx";
import { StatusPill } from "./ui/status";

type NavItem = { href: string; label: string; icon: IconName };

const GROUPS: { title: string; items: NavItem[] }[] = [
  {
    title: "Every day",
    items: [
      { href: "/today", label: "Home", icon: "home" },
      { href: "/scan", label: "Scan my face", icon: "scan" },
      { href: "/hands", label: "Hands off", icon: "hands" },
    ],
  },
  {
    title: "Your product",
    items: [
      { href: "/protocol", label: "Set up product", icon: "protocol" },
      { href: "/trial", label: "Is it worth it?", icon: "trial" },
      { href: "/breakout", label: "Why did I break out?", icon: "breakout" },
      { href: "/concealer", label: "Cover-up shade", icon: "concealer" },
    ],
  },
  {
    title: "Shopping",
    items: [
      { href: "/shop", label: "Shop & try on", icon: "retail" },
      { href: "/claim", label: "Check any claim", icon: "claim" },
    ],
  },
  {
    title: "Advanced",
    items: [
      { href: "/lighting", label: "Light test", icon: "light" },
      { href: "/lab", label: "Lab numbers", icon: "lab" },
      { href: "/retail", label: "For brands", icon: "briefcase" },
    ],
  },
];

const TABS: NavItem[] = [
  { href: "/today", label: "Home", icon: "home" },
  { href: "/scan", label: "Scan", icon: "scan" },
  { href: "/trial", label: "Verdict", icon: "trial" },
  { href: "/shop", label: "Shop", icon: "retail" },
];

function StatusChips() {
  const { status, view } = useProof();
  if (!status) return null;
  return (
    <div className="flex flex-wrap gap-1.5">
      <StatusPill tone={status.youcam ? "sage" : "rose"} className="px-2.5 py-0.5 text-[11px]">
        YouCam {status.youcam ? "connected" : "key missing"}
      </StatusPill>
      <StatusPill tone={status.anthropic ? "sage" : "ink"} className="px-2.5 py-0.5 text-[11px]">
        phrasing {status.anthropic ? "on" : "templates"}
      </StatusPill>
      <StatusPill tone="ink" className="px-2.5 py-0.5 text-[11px]">
        store {status.supabase ? "supabase + local" : "local"}
      </StatusPill>
      {view?.demo ? (
        <Link href="/privacy#sample" title="Sample data is loaded. Manage it on the Privacy page.">
          <StatusPill tone="amber" className="px-2.5 py-0.5 text-[11px]">
            sample data
          </StatusPill>
        </Link>
      ) : null}
    </div>
  );
}

function NavLinks({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <div className="space-y-5">
      {GROUPS.map((group) => (
        <div key={group.title}>
          <p className="kicker px-3 pb-1.5 text-[10px] text-quiet/80">{group.title}</p>
          {group.items.map((item) => {
            const active = path === item.href;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                aria-current={active ? "page" : undefined}
                className={cx(
                  "flex items-center gap-3 rounded-2xl px-3 py-2 text-[15px] transition",
                  active ? "bg-clay/10 font-medium text-clay" : "text-ink/75 hover:bg-ink/5 hover:text-ink",
                )}
              >
                <Icon name={item.icon} size={18} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </div>
  );
}

function Loading() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 px-6" aria-busy="true" aria-live="polite">
      <Wordmark />
      <div className="flex items-center gap-2 text-sm text-quiet">
        <span className="h-2 w-2 animate-pulse-dot rounded-full bg-clay" />
        Opening the ledger
      </div>
      <div className="mt-4 grid w-full max-w-md gap-3">
        {[0, 1, 2].map((index) => (
          <div key={index} className="h-16 animate-pulse rounded-3xl bg-card/80" style={{ animationDelay: `${index * 120}ms` }} />
        ))}
      </div>
    </div>
  );
}

function Consent({ refresh }: { refresh: () => Promise<void> }) {
  const [busy, setBusy] = useState(false);
  const promises: [IconName, string][] = [
    ["camera", "A photograph of your face leaves this browser only to be scored."],
    ["heart", "Sleep, heart data and cycle stay optional."],
    ["privacy", "Nothing here is medical care. One button deletes your records."],
  ];
  return (
    <main className="flex min-h-screen items-center justify-center px-4 py-12">
      <div className="w-full max-w-3xl overflow-hidden rounded-[2.25rem] border border-line bg-card shadow-lift md:grid md:grid-cols-[0.9fr_1.1fr]">
        <div className="relative flex items-center justify-center bg-gradient-to-br from-peach/50 via-clay/10 to-sage/20 p-8">
          <div className="dotgrid absolute inset-0 opacity-50" aria-hidden="true" />
          <Face className="relative h-56 md:h-72" />
        </div>
        <div className="p-7 md:p-10">
          <StatusPill tone="clay">Personal test</StatusPill>
          <h1 className="mt-4 font-serif text-4xl font-medium tracking-tight md:text-5xl">Before your first scan</h1>
          <p className="mt-3 leading-relaxed text-quiet">{BRAND} tells you whether a skincare product is actually doing something for your skin. Three promises first:</p>
          <ul className="mt-6 space-y-4">
            {promises.map(([icon, text]) => (
              <li key={text} className="flex gap-3 leading-relaxed text-ink/85">
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-clay/10 text-clay">
                  <Icon name={icon} size={18} />
                </span>
                <span className="pt-1.5">{text}</span>
              </li>
            ))}
          </ul>
          <Button
            variant="accent"
            size="lg"
            className="mt-8 w-full"
            disabled={busy}
            onClick={async () => {
              setBusy(true);
              await fetch("/api/session", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ consent: true, tzOffsetMinutes: -new Date().getTimezoneOffset() }),
              });
              await refresh();
              setBusy(false);
            }}
          >
            {busy ? "Opening…" : "I agree. Keep the photos on this server."}
          </Button>
          <div className="mt-4 flex items-center justify-between text-sm">
            <Link href="/privacy" className="text-quiet underline decoration-line underline-offset-4 hover:text-ink">
              Read the shorter version
            </Link>
            <Link href="/" className="text-quiet hover:text-ink">
              About {BRAND}
            </Link>
          </div>
        </div>
      </div>
    </main>
  );
}

export function Shell({ children }: { children: React.ReactNode }) {
  const { view, ready, error, refresh } = useProof();
  const path = usePathname();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [path]);

  if (!ready) return <Loading />;
  if (error) {
    return (
      <main className="mx-auto max-w-lg px-6 py-20">
        <Callout kind="danger">{error}</Callout>
      </main>
    );
  }
  if (view && !view.user.consentAt && path !== "/privacy") return <Consent refresh={refresh} />;

  const inTabs = TABS.some((tab) => tab.href === path);

  return (
    <div className="mx-auto min-h-screen max-w-[1320px] md:grid md:grid-cols-[264px_1fr] md:gap-6 md:px-5 md:py-5">
      {/* desktop sidebar */}
      <aside className="hidden md:block">
        <div className="glass sticky top-5 flex max-h-[calc(100vh-2.5rem)] flex-col rounded-[2rem] border border-line p-4 shadow-soft">
          <div className="flex items-center justify-between px-2 pb-4 pt-1">
            <Link href="/today" aria-label={`${BRAND} home`}>
              <Wordmark />
            </Link>
            <ThemeToggle />
          </div>
          <nav aria-label="Sections" className="-mx-1 flex-1 overflow-y-auto px-1 pb-4">
            <NavLinks path={path} />
          </nav>
          <div className="space-y-3 border-t border-line px-2 pt-4">
            <StatusChips />
            <div className="flex items-center justify-between text-sm">
              <Link href="/privacy" className={cx("flex items-center gap-2 hover:text-ink", path === "/privacy" ? "text-clay" : "text-quiet")}>
                <Icon name="privacy" size={16} />
                Privacy
              </Link>
              <Link href="/" className="flex items-center gap-1.5 text-quiet hover:text-ink">
                About {BRAND}
              </Link>
            </div>
          </div>
        </div>
      </aside>

      {/* mobile top bar */}
      <header className="glass sticky top-0 z-30 flex items-center justify-between border-b border-line px-4 py-3 md:hidden">
        <Link href="/today" aria-label={`${BRAND} home`}>
          <Wordmark />
        </Link>
        <ThemeToggle />
      </header>

      <div className="min-w-0 px-4 pb-32 pt-6 md:px-2 md:pb-16 md:pt-4">{children}</div>

      {/* mobile bottom tabs */}
      <nav aria-label="Primary" className="glass safe-bottom fixed inset-x-0 bottom-0 z-40 border-t border-line px-2 pt-2 md:hidden">
        <div className="mx-auto grid max-w-md grid-cols-5">
          {TABS.map((tab) => {
            const active = path === tab.href;
            return (
              <Link
                key={tab.href}
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={cx("flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px]", active ? "text-clay" : "text-quiet")}
              >
                <span className={cx("flex h-8 w-12 items-center justify-center rounded-full transition", active && "bg-clay/10")}>
                  <Icon name={tab.icon} size={20} />
                </span>
                {tab.label}
              </Link>
            );
          })}
          <button
            type="button"
            onClick={() => setOpen(true)}
            aria-expanded={open}
            className={cx("flex flex-col items-center gap-1 rounded-2xl py-1.5 text-[11px]", !inTabs ? "text-clay" : "text-quiet")}
          >
            <span className={cx("flex h-8 w-12 items-center justify-center rounded-full", !inTabs && "bg-clay/10")}>
              <Icon name="more" size={20} />
            </span>
            More
          </button>
        </div>
      </nav>

      {/* mobile "more" sheet */}
      {open ? (
        <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="All sections">
          <button type="button" aria-label="Close" className="absolute inset-0 bg-ink/30 backdrop-blur-sm" onClick={() => setOpen(false)} />
          <div className="safe-bottom absolute inset-x-0 bottom-0 max-h-[82vh] overflow-y-auto rounded-t-[2rem] border-t border-line bg-card px-4 pb-4 pt-3 shadow-lift">
            <div className="mx-auto mb-3 h-1.5 w-10 rounded-full bg-line" />
            <div className="mb-3 flex items-center justify-between px-2">
              <p className="font-serif text-2xl">All sections</p>
              <button type="button" onClick={() => setOpen(false)} className="flex h-10 w-10 items-center justify-center rounded-full border border-line text-quiet" aria-label="Close sections">
                <Icon name="close" size={18} />
              </button>
            </div>
            <NavLinks path={path} onNavigate={() => setOpen(false)} />
            <div className="mt-5 space-y-3 border-t border-line px-2 pt-4">
              <StatusChips />
              <div className="flex justify-between text-sm text-quiet">
                <Link href="/privacy" onClick={() => setOpen(false)}>
                  Privacy
                </Link>
                <Link href="/">About {BRAND}</Link>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export function PageTitle({
  kicker,
  title,
  children,
  icon,
  aside,
}: {
  kicker: string;
  title: string;
  children?: React.ReactNode;
  icon?: IconName;
  aside?: React.ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 pb-2 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        <p className="kicker flex items-center gap-2 text-clay">
          {icon ? (
            <span className="flex h-7 w-7 items-center justify-center rounded-full bg-clay/10">
              <Icon name={icon} size={15} />
            </span>
          ) : null}
          {kicker}
        </p>
        <h1 className="text-balance mt-3 font-serif text-4xl font-medium leading-[1.05] tracking-tight md:text-5xl">{title}</h1>
        {children ? <div className="mt-3 max-w-2xl text-[15px] leading-relaxed text-quiet md:text-base">{children}</div> : null}
      </div>
      {aside ? <div className="shrink-0">{aside}</div> : null}
    </header>
  );
}

export function Stamp({ children, tone = "ink" }: { children: React.ReactNode; tone?: "ink" | "signal" | "moss" | "amber" }) {
  const map = { ink: "ink", signal: "rose", moss: "sage", amber: "amber" } as const;
  return <StatusPill tone={map[tone]}>{children}</StatusPill>;
}

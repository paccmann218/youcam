import type { ReactNode } from "react";
import type { Tone } from "./card";
import { cx } from "./cx";

const PILL: Record<Tone, string> = {
  ink: "border-ink/15 bg-ink/[0.05] text-ink",
  clay: "border-clay/25 bg-clay/10 text-clay",
  sage: "border-sage/25 bg-sage/10 text-sage",
  amber: "border-amber/25 bg-amber/10 text-amber",
  rose: "border-rose/25 bg-rose/10 text-rose",
};

const DOT: Record<Tone, string> = {
  ink: "bg-ink/60",
  clay: "bg-clay",
  sage: "bg-sage",
  amber: "bg-amber",
  rose: "bg-rose",
};

export function StatusPill({
  tone = "ink",
  children,
  live = false,
  dot = true,
  className,
}: {
  tone?: Tone;
  children: ReactNode;
  live?: boolean;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cx(
        "inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[12px] font-medium tracking-wide",
        PILL[tone],
        className,
      )}
    >
      {dot ? <span className={cx("h-1.5 w-1.5 rounded-full", DOT[tone], live && "animate-pulse-dot")} /> : null}
      {children}
    </span>
  );
}

export function verdictTone(kind: string | null | undefined): Tone {
  switch (kind) {
    case "working":
      return "sage";
    case "wrong_way":
      return "rose";
    case "no_effect":
      return "ink";
    case "too_early":
    case "unidentified":
      return "amber";
    default:
      return "ink";
  }
}

export function verdictLabel(kind: string | null | undefined): string {
  switch (kind) {
    case "working":
      return "Worth it";
    case "wrong_way":
      return "Making it worse";
    case "no_effect":
      return "Not worth it";
    case "too_early":
      return "Too early to tell";
    case "unidentified":
      return "Too early · finish setup";
    default:
      return "No scan yet";
  }
}

/** One plain sentence explaining what each verdict means. */
export function verdictMeaning(kind: string | null | undefined): string {
  switch (kind) {
    case "working":
      return "Your skin changed by more than its normal day-to-day wobble while you used it.";
    case "wrong_way":
      return "The concern looks worse, by more than your normal wobble, on the days you used it.";
    case "no_effect":
      return "No change beyond your normal wobble. You could stop paying for it.";
    case "too_early":
      return "Not enough mornings yet to tell a real change from normal wobble.";
    case "unidentified":
      return "WorthIt needs your baseline scans before it can judge anything.";
    default:
      return "Take your first scan to get started.";
  }
}

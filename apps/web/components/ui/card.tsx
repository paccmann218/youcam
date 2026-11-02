import type { HTMLAttributes } from "react";
import { cx } from "./cx";

export type Tone = "ink" | "clay" | "sage" | "amber" | "rose";

const TINTS: Record<Tone, string> = {
  ink: "",
  clay: "border-clay/25 bg-gradient-to-br from-clay/[0.07] to-transparent",
  sage: "border-sage/25 bg-gradient-to-br from-sage/[0.08] to-transparent",
  amber: "border-amber/25 bg-gradient-to-br from-amber/[0.08] to-transparent",
  rose: "border-rose/25 bg-gradient-to-br from-rose/[0.08] to-transparent",
};

export function Card({
  className,
  tone = "ink",
  padded = true,
  glow = false,
  ...rest
}: HTMLAttributes<HTMLDivElement> & { tone?: Tone; padded?: boolean; glow?: boolean }) {
  return (
    <div
      className={cx(
        "relative rounded-3xl border border-line bg-card shadow-soft",
        TINTS[tone],
        glow && "shadow-glow",
        padded && "p-5 md:p-6",
        className,
      )}
      {...rest}
    />
  );
}

export function CardLabel({ children, className, icon }: { children: React.ReactNode; className?: string; icon?: React.ReactNode }) {
  return (
    <p className={cx("kicker flex items-center gap-2 text-quiet", className)}>
      {icon}
      {children}
    </p>
  );
}

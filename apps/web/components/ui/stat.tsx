import type { ReactNode } from "react";
import { Card, type Tone } from "./card";
import { cx } from "./cx";

export function Stat({
  label,
  value,
  unit,
  hint,
  icon,
  tone = "ink",
  size = "md",
  className,
}: {
  label: string;
  value: ReactNode | null | undefined;
  unit?: string;
  hint?: ReactNode;
  icon?: ReactNode;
  tone?: Tone;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const empty = value === null || value === undefined || value === "";
  const sizes = { sm: "text-2xl", md: "text-4xl", lg: "text-5xl md:text-6xl" };
  return (
    <Card tone={tone} className={cx("flex flex-col", className)}>
      <p className="kicker flex items-center gap-2 text-quiet">
        {icon}
        {label}
      </p>
      {empty ? (
        <p className="mt-3 inline-flex w-fit items-center gap-2 rounded-full border border-dashed border-line px-3 py-1 text-sm text-quiet">
          not measured
        </p>
      ) : (
        <p className={cx("num mt-2 font-mono font-medium text-ink", sizes[size])}>
          {value}
          {unit ? <span className="ml-1 text-base font-normal text-quiet">{unit}</span> : null}
        </p>
      )}
      {hint ? <div className="mt-2 text-sm leading-relaxed text-quiet">{hint}</div> : null}
    </Card>
  );
}

import type { ReactNode } from "react";
import { Icon } from "../icons";
import { cx } from "./cx";

const STYLES = {
  info: { box: "border-line bg-card/80 text-ink", icon: "text-clay", name: "info" as const },
  warn: { box: "border-amber/30 bg-amber/[0.07] text-ink", icon: "text-amber", name: "alert" as const },
  danger: { box: "border-rose/30 bg-rose/[0.07] text-rose", icon: "text-rose", name: "alert" as const },
  success: { box: "border-sage/30 bg-sage/[0.07] text-ink", icon: "text-sage", name: "check" as const },
};

export function Callout({ kind = "info", children, className }: { kind?: keyof typeof STYLES; children: ReactNode; className?: string }) {
  const style = STYLES[kind];
  return (
    <div role={kind === "danger" ? "alert" : undefined} className={cx("flex items-start gap-3 rounded-2xl border px-4 py-3 text-sm leading-relaxed", style.box, className)}>
      <Icon name={style.name} size={18} className={cx("mt-0.5 shrink-0", style.icon)} />
      <div className="min-w-0">{children}</div>
    </div>
  );
}

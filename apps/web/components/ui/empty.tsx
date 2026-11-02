import type { ReactNode } from "react";
import { cx } from "./cx";

export function Empty({ art, title, children, className }: { art?: ReactNode; title: string; children?: ReactNode; className?: string }) {
  return (
    <div className={cx("flex flex-col items-center rounded-3xl border border-dashed border-line bg-card/40 px-6 py-10 text-center", className)}>
      {art ? <div className="mb-4 text-quiet">{art}</div> : null}
      <p className="font-serif text-xl text-ink">{title}</p>
      {children ? <div className="mt-2 max-w-sm text-sm leading-relaxed text-quiet">{children}</div> : null}
    </div>
  );
}

"use client";

import { cx } from "./cx";

export function Segmented<T extends string>({
  options,
  value,
  onChange,
  label,
  className,
}: {
  options: { value: T; label: string; hint?: string }[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  className?: string;
}) {
  return (
    <div role="radiogroup" aria-label={label} className={cx("inline-flex flex-wrap gap-1 rounded-full border border-line bg-card/80 p-1 shadow-soft", className)}>
      {options.map((option) => {
        const active = option.value === value;
        return (
          <button
            key={option.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(option.value)}
            className={cx(
              "min-h-9 rounded-full px-4 text-sm transition",
              active ? "bg-ink text-paper shadow-soft" : "text-quiet hover:text-ink",
            )}
          >
            {option.label}
            {option.hint ? <span className={cx("ml-1.5 text-xs", active ? "text-paper/70" : "text-quiet/80")}>{option.hint}</span> : null}
          </button>
        );
      })}
    </div>
  );
}

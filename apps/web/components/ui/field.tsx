import type { InputHTMLAttributes, ReactNode, SelectHTMLAttributes, TextareaHTMLAttributes } from "react";
import { Icon } from "../icons";
import { cx } from "./cx";

export const controlClass =
  "mt-1.5 block w-full rounded-2xl border border-line bg-elevated/70 px-4 py-3 text-[15px] text-ink shadow-[inset_0_1px_2px_rgb(var(--ink)/0.04)] outline-none transition placeholder:text-quiet/70 focus:border-clay/60 focus:ring-4 focus:ring-clay/10";

export function Field({ label, hint, children, className }: { label: string; hint?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <label className={cx("block text-sm font-medium text-ink", className)}>
      {label}
      {children}
      {hint ? <span className="mt-1.5 block text-xs font-normal text-quiet">{hint}</span> : null}
    </label>
  );
}

export function Input({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return <input className={cx(controlClass, className)} {...rest} />;
}

export function Textarea({ className, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return <textarea className={cx(controlClass, "resize-y", className)} {...rest} />;
}

export function Select({ className, children, ...rest }: SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <span className="relative block">
      <select className={cx(controlClass, "appearance-none pr-10", className)} {...rest}>
        {children}
      </select>
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-[30%] text-quiet"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
      >
        <path d="m6 9 6 6 6-6" />
      </svg>
    </span>
  );
}

/** A label-wrapped file input styled as a drop zone. The input keeps its name, so FormData is unchanged. */
export function FileDrop({
  label,
  hint,
  name,
  accept,
  capture,
  onFile,
  fileName,
}: {
  label: string;
  hint?: string;
  name?: string;
  accept?: string;
  capture?: "user" | "environment";
  onFile?: (file: File | null) => void;
  fileName?: string | null;
}) {
  return (
    <label className="group block cursor-pointer">
      <span className="text-sm font-medium text-ink">{label}</span>
      <span className="mt-1.5 flex items-center gap-4 rounded-2xl border border-dashed border-line bg-elevated/50 px-4 py-4 transition group-hover:border-clay/50 group-hover:bg-clay/[0.04]">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-clay/10 text-clay">
          <Icon name="upload" size={18} />
        </span>
        <span className="min-w-0">
          <span className="block truncate text-sm text-ink">{fileName || "Choose a photo"}</span>
          {hint ? <span className="block text-xs text-quiet">{hint}</span> : null}
        </span>
      </span>
      <input
        className="sr-only"
        type="file"
        name={name}
        accept={accept}
        capture={capture}
        onChange={(event) => onFile?.(event.target.files?.[0] ?? null)}
      />
    </label>
  );
}

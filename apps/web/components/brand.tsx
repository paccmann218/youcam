export const BRAND = "WorthIt";
export const TAGLINE = "Is your skincare actually worth it?";

/** The WorthIt logo: an ink disc with a clay check, plus the wordmark. */
export function Wordmark({ className = "", compact = false }: { className?: string; compact?: boolean }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className}`}>
      <span className="relative flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-clay shadow-soft">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="m5.5 12.5 4 4 9-9" />
        </svg>
      </span>
      {compact ? null : (
        <span className="font-serif text-[1.55rem] font-medium leading-none tracking-tight">
          Worth<span className="italic text-clay">It</span>
        </span>
      )}
    </span>
  );
}

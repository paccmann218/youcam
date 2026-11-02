import Link from "next/link";
import { Icon, type IconName } from "./icons";
import { buttonClass } from "./ui/button";
import { cx } from "./ui/cx";

export type SetupStep = {
  key: string;
  icon: IconName;
  title: string;
  detail: string;
  done: boolean;
  href: string;
  cta: string;
  optional?: boolean;
};

/** A numbered setup guide. The first unfinished step is highlighted and gets the big button. */
export function SetupSteps({ steps }: { steps: SetupStep[] }) {
  const current = steps.findIndex((step) => !step.done);
  const doneCount = steps.filter((step) => step.done).length;
  const next = current >= 0 ? steps[current] : null;

  return (
    <section className="rounded-4xl border border-line bg-card p-6 shadow-soft md:p-8">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="kicker text-clay">Your test, step by step</p>
          <h2 className="mt-2 font-serif text-3xl">{next ? `Next: ${next.title.toLowerCase()}` : "You're all set"}</h2>
        </div>
        <div className="flex items-center gap-3">
          <span className="num font-mono text-sm text-quiet">
            {doneCount} of {steps.length} done
          </span>
          <span className="flex gap-1" aria-hidden="true">
            {steps.map((step) => (
              <span key={step.key} className={cx("h-1.5 w-6 rounded-full", step.done ? "bg-sage" : "bg-line")} />
            ))}
          </span>
        </div>
      </div>

      {next ? (
        <div className="mt-6 flex flex-col gap-3 rounded-3xl bg-ink px-5 py-4 text-paper sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm leading-relaxed text-paper/80">
            <span className="font-medium text-paper">{next.title}.</span> {next.detail}
          </p>
          <Link href={next.href} className={buttonClass("accent", "md", "shrink-0")}>
            <Icon name={next.icon} size={17} />
            {next.cta}
          </Link>
        </div>
      ) : null}
      <ol className="mt-7 grid gap-3 md:grid-cols-5">
        {steps.map((step, index) => {
          const isCurrent = index === current;
          return (
            <li
              key={step.key}
              className={cx(
                "relative flex gap-3 rounded-3xl border p-4 transition md:flex-col",
                step.done && "border-sage/25 bg-sage/[0.06]",
                isCurrent && "border-clay/40 bg-clay/[0.06] shadow-glow",
                !step.done && !isCurrent && "border-line bg-paper/50",
              )}
            >
              <span
                className={cx(
                  "flex h-10 w-10 shrink-0 items-center justify-center rounded-full",
                  step.done ? "bg-sage text-paper" : isCurrent ? "bg-clay text-on-clay" : "bg-ink/5 text-quiet",
                )}
              >
                {step.done ? <Icon name="check" size={18} strokeWidth={2.4} /> : <Icon name={step.icon} size={18} />}
              </span>
              <div className="min-w-0">
                <p className="num font-mono text-[11px] uppercase tracking-wider text-quiet">
                  Step {index + 1}
                  {step.optional ? " · recommended" : ""}
                </p>
                <p className={cx("mt-0.5 font-medium leading-snug", step.done ? "text-ink/70" : "text-ink")}>{step.title}</p>
                <p className="mt-1 text-sm leading-snug text-quiet">{step.detail}</p>
                {!step.done && !isCurrent ? (
                  <Link href={step.href} className="mt-2 inline-flex items-center gap-1 text-sm text-clay hover:underline">
                    {step.cta}
                    <Icon name="arrow" size={13} />
                  </Link>
                ) : null}
              </div>
            </li>
          );
        })}
      </ol>

    </section>
  );
}

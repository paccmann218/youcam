import Link from "next/link";
import type { ButtonHTMLAttributes, ReactNode } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "accent" | "secondary" | "ghost" | "danger";
export type ButtonSize = "sm" | "md" | "lg";

const VARIANTS: Record<ButtonVariant, string> = {
  primary: "bg-ink text-paper shadow-soft hover:bg-ink/90",
  accent: "bg-clay text-on-clay shadow-glow hover:brightness-105",
  secondary: "border border-line bg-card text-ink shadow-soft hover:border-ink/30",
  ghost: "text-quiet hover:bg-ink/5 hover:text-ink",
  danger: "border border-rose/40 bg-rose/5 text-rose hover:bg-rose/10",
};

const SIZES: Record<ButtonSize, string> = {
  sm: "min-h-9 px-3.5 text-sm gap-1.5",
  md: "min-h-11 px-5 text-[15px] gap-2",
  lg: "min-h-12 px-6 text-base gap-2.5",
};

export function buttonClass(variant: ButtonVariant = "primary", size: ButtonSize = "md", extra?: string) {
  return cx(
    "inline-flex select-none items-center justify-center rounded-full font-medium transition duration-150 active:scale-[0.98] disabled:pointer-events-none disabled:opacity-50",
    VARIANTS[variant],
    SIZES[size],
    extra,
  );
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  ...rest
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant; size?: ButtonSize }) {
  return <button className={buttonClass(variant, size, className)} {...rest} />;
}

export function ButtonLink({
  href,
  variant = "primary",
  size = "md",
  className,
  children,
}: {
  href: string;
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link href={href} className={buttonClass(variant, size, className)}>
      {children}
    </Link>
  );
}

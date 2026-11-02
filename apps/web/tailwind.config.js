/** @type {import('tailwindcss').Config} */
const token = (name) => `rgb(var(--${name}) / <alpha-value>)`;

module.exports = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        paper: token("paper"),
        card: token("card"),
        elevated: token("elevated"),
        ink: token("ink"),
        quiet: token("quiet"),
        line: token("line"),
        clay: token("clay"),
        peach: token("peach"),
        sage: token("sage"),
        amber: token("amber"),
        rose: token("rose"),
        screen: token("screen"),
        "screen-ink": token("screen-ink"),
        "on-clay": token("on-clay"),
        "series-a": token("series-a"),
        "series-b": token("series-b"),
        // Aliases kept so older class names keep rendering in the new palette.
        signal: token("clay"),
        moss: token("sage"),
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: ["var(--font-sans)", "Helvetica Neue", "Arial", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "monospace"],
      },
      borderRadius: {
        "4xl": "2rem",
      },
      boxShadow: {
        stamp: "inset 0 0 0 1px currentColor",
        soft: "0 1px 2px rgb(var(--ink) / 0.04), 0 8px 24px -12px rgb(var(--ink) / 0.12)",
        lift: "0 2px 4px rgb(var(--ink) / 0.05), 0 24px 48px -20px rgb(var(--ink) / 0.25)",
        glow: "0 0 0 1px rgb(var(--clay) / 0.18), 0 18px 48px -18px rgb(var(--clay) / 0.45)",
      },
      keyframes: {
        float: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-dot": {
          "0%": { boxShadow: "0 0 0 0 rgb(var(--clay) / 0.5)" },
          "70%": { boxShadow: "0 0 0 8px rgb(var(--clay) / 0)" },
          "100%": { boxShadow: "0 0 0 0 rgb(var(--clay) / 0)" },
        },
        "fade-up": {
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        pop: {
          "0%": { transform: "scale(1)" },
          "40%": { transform: "scale(1.08)" },
          "100%": { transform: "scale(1)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "float-slow": "float 8s ease-in-out infinite",
        "pulse-dot": "pulse-dot 1.8s ease-out infinite",
        "fade-up": "fade-up .5s ease-out both",
        pop: "pop .45s ease-out",
      },
    },
  },
  plugins: [],
};

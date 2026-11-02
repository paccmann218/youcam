import { Bodoni_Moda, Martian_Mono } from "next/font/google";
import { LandingRuntime } from "@/components/landing/runtime";
import "./landing.css";

// The landing page has its own voice: a high-contrast didone for the editorial
// headlines, and a wide mono for everything that reads like a lab label.
const display = Bodoni_Moda({
  subsets: ["latin"],
  variable: "--font-display",
  style: ["normal", "italic"],
  axes: ["opsz"],
  display: "swap",
});

const lab = Martian_Mono({
  subsets: ["latin"],
  variable: "--font-lab",
  axes: ["wdth"],
  display: "swap",
});

export default function SiteLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${display.variable} ${lab.variable} landing`}>
      <LandingRuntime>{children}</LandingRuntime>
    </div>
  );
}

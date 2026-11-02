import { BeforeYouBuy } from "@/components/landing/claim";
import { Finale } from "@/components/landing/finale";
import { Hero } from "@/components/landing/hero";
import { Nav } from "@/components/landing/nav";
import { Story } from "@/components/landing/story";
import { Ticker } from "@/components/landing/ticker";
import { Verdicts } from "@/components/landing/verdicts";
import { Wobble } from "@/components/landing/wobble";

// Light and dark bands alternate: hero (light) · story (dark) · wobble (light) · verdicts (dark) · buy (light) · ticker + finale (dark).
export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Story />
        <Wobble />
        <Verdicts />
        <BeforeYouBuy />
      </main>
      <Ticker />
      <Finale />
    </>
  );
}

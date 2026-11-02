import { BeforeYouBuy } from "@/components/landing/claim";
import { Finale } from "@/components/landing/finale";
import { Hero } from "@/components/landing/hero";
import { Instruments } from "@/components/landing/instruments";
import { MirrorSection } from "@/components/landing/mirror";
import { Nav } from "@/components/landing/nav";
import { Ticker } from "@/components/landing/ticker";
import { Verdicts } from "@/components/landing/verdicts";
import { Wobble } from "@/components/landing/wobble";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Ticker />
        <MirrorSection />
        <Wobble />
        <Verdicts />
        <BeforeYouBuy />
        <Instruments />
      </main>
      <Finale />
    </>
  );
}

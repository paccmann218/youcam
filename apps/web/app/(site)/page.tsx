import { BeforeYouBuy, Features, FinalCta, Footer, Hero, HowItWorks, Nav, Problem, Solution, Trust } from "@/components/landing/sections";

export default function LandingPage() {
  return (
    <>
      <Nav />
      <main>
        <Hero />
        <Problem />
        <Solution />
        <HowItWorks />
        <BeforeYouBuy />
        <Features />
        <Trust />
        <FinalCta />
      </main>
      <Footer />
    </>
  );
}

import { SiteHeader } from "./components/SiteHeader";
import { Hero } from "./components/hero/Hero";
import { KeyLegend } from "./components/sections/KeyLegend";
import { HowItWorks } from "./components/sections/HowItWorks";
import { Workflows } from "./components/sections/Workflows";
import { UnderTheHood } from "./components/sections/UnderTheHood";
import { Austin } from "./components/sections/Austin";
import { Closing } from "./components/sections/Closing";
import { SiteFooter } from "./components/SiteFooter";

export default function App() {
  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>
      <span id="top" />
      <SiteHeader />
      <main id="main">
        <Hero />
        <KeyLegend />
        <HowItWorks />
        <Workflows />
        <UnderTheHood />
        <Austin />
        <Closing />
      </main>
      <SiteFooter />
    </>
  );
}

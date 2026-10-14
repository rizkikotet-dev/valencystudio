import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { StatsStrip } from "@/components/site/stats-strip";
import { HowItWorks } from "@/components/site/how-it-works";
import { Features } from "@/components/site/features";
import { AssetTypes } from "@/components/site/asset-types";
import { DownloadSection } from "@/components/site/download";
import { Changelog } from "@/components/site/changelog";
import { Faq } from "@/components/site/faq";
import { Cta } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <Navbar />
      <main className="flex-1">
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <Features />
        <AssetTypes />
        <DownloadSection />
        <Changelog />
        <Faq />
        <Cta />
      </main>
      <Footer />
    </div>
  );
}

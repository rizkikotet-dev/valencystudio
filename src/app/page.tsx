import { Navbar } from "@/components/site/navbar";
import { Hero } from "@/components/site/hero";
import { StatsStrip } from "@/components/site/stats-strip";
import { HowItWorks } from "@/components/site/how-it-works";
import { Features } from "@/components/site/features";
import { Comparison } from "@/components/site/comparison";
import { AssetTypes } from "@/components/site/asset-types";
import { DownloadSection } from "@/components/site/download";
import { Changelog } from "@/components/site/changelog";
import { Faq } from "@/components/site/faq";
import { Cta } from "@/components/site/cta";
import { Footer } from "@/components/site/footer";
import { CommandPalette } from "@/components/site/command-palette";
import { BackToTop } from "@/components/site/back-to-top";

const REPO = "https://github.com/valency-studio/valencystudio-spoofer";

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "ValencyStudio — Spoofer",
  applicationCategory: "DeveloperApplication",
  operatingSystem: "Windows, macOS, Linux",
  softwareVersion: "3.0.2",
  description:
    "A desktop asset replacement tool for Roblox Studio. Preview, replace, and push animations, sounds, decals, meshes, and videos across an entire place without manually editing instances.",
  url: REPO,
  license: `${REPO}/blob/main/LICENSE`,
  author: {
    "@type": "Organization",
    name: "valency-studio",
    url: "https://github.com/valency-studio",
  },
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
};

export default function Home() {
  return (
    <div className="flex min-h-svh flex-col">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <Navbar />
      <main className="flex-1">
        <Hero />
        <StatsStrip />
        <HowItWorks />
        <Features />
        <Comparison />
        <AssetTypes />
        <DownloadSection />
        <Changelog />
        <Faq />
        <Cta />
      </main>
      <Footer />
      <CommandPalette />
      <BackToTop />
    </div>
  );
}

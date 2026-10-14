"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { BUG_REPORT_URL, DISCORD_URL, FEATURE_REQUEST_URL, RELEASES_URL, REPO_URL } from "@/hooks/use-site-data";

const FAQS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Is ValencyStudio — Spoofer free?",
    a: (
      <>
        Yes. The project is open source under the{" "}
        <a className="text-primary underline underline-offset-2 hover:no-underline" href={REPO_URL} target="_blank" rel="noopener noreferrer">
          GPL-3.0 license
        </a>
        . You can grab prebuilt binaries from the{" "}
        <a className="text-primary underline underline-offset-2 hover:no-underline" href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
          releases page
        </a>{" "}
        or compile it yourself from source.
      </>
    ),
  },
  {
    q: "Why does my antivirus flag the installer?",
    a: "Windows Defender and other antivirus software may flag unsigned builds — ValencyStudio — Spoofer is not currently code signed. The builds can be independently verified by compiling the project directly from source. Nothing is hidden in the repository.",
  },
  {
    q: "Which platforms are supported?",
    a: (
      <>
        Windows (<code className="font-mono text-xs">x64-setup.exe</code>), macOS (
        <code className="font-mono text-xs">x64.dmg</code>), and Linux (
        <code className="font-mono text-xs">amd64.AppImage</code>). The Roblox Studio plugin,{" "}
        <code className="font-mono text-xs">ValencyStudioSpoofer.rbxmx</code>, is included with
        every release and is synced into your local Studio plugins directory automatically when
        the app starts.
      </>
    ),
  },
  {
    q: "Does it modify my place file?",
    a: "No manual place-file editing is required. The desktop app connects to a running Roblox Studio session through the companion Luau plugin and performs replacements live. Discovery, previews, profiles, and replacement configuration live in the app; the plugin handles Studio-side operations while your place is running.",
  },
  {
    q: "Which asset types can be replaced?",
    a: "Animations, sounds, decals, meshes, and videos. Before applying a replacement you can preview R6 and R15 animations and listen to audio assets, so you know exactly what you are pushing into the place.",
  },
  {
    q: "How do I report a bug or request a feature?",
    a: (
      <>
        Use the GitHub issue templates —{" "}
        <a className="text-primary underline underline-offset-2 hover:no-underline" href={BUG_REPORT_URL} target="_blank" rel="noopener noreferrer">
          report a bug
        </a>{" "}
        or{" "}
        <a className="text-primary underline underline-offset-2 hover:no-underline" href={FEATURE_REQUEST_URL} target="_blank" rel="noopener noreferrer">
          request a feature
        </a>{" "}
        — or join the{" "}
        <a className="text-primary underline underline-offset-2 hover:no-underline" href={DISCORD_URL} target="_blank" rel="noopener noreferrer">
          Discord community
        </a>
        . Maintainers respond on both channels.
      </>
    ),
  },
];

export function Faq() {
  return (
    <section id="faq" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_1.4fr] gap-10 lg:gap-16">
          <SectionHeading
            index="06"
            eyebrow="FAQ"
            title="Questions, answered honestly"
            description="Straight answers — including the awkward ones about unsigned builds."
            className="lg:sticky lg:top-24 self-start"
          />

          <Reveal>
            <Accordion type="single" collapsible className="w-full">
              {FAQS.map((faq, i) => (
                <AccordionItem key={faq.q} value={`item-${i}`} className="border-border">
                  <AccordionTrigger className="text-left font-display text-[15px] font-medium tracking-tight hover:text-primary hover:no-underline py-5">
                    {faq.q}
                  </AccordionTrigger>
                  <AccordionContent className="text-sm leading-relaxed text-muted-foreground pb-5">
                    {faq.a}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </Reveal>
        </div>
      </div>
    </section>
  );
}

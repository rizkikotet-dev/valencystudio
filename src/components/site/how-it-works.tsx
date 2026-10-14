"use client";

import { PlugZap, ScanLine, MonitorCheck } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

const STEPS = [
  {
    icon: PlugZap,
    title: "Install the app",
    body: "Download the desktop app for your platform. On first launch it automatically syncs the bundled Studio plugin into your local Roblox Studio plugins directory.",
    snippet: "ValencyStudioSpoofer.rbxmx → Studio/plugins",
  },
  {
    icon: MonitorCheck,
    title: "Connect to Studio",
    body: "Open a place in Roblox Studio and enable the plugin. The desktop app discovers the running session and keeps itself synchronized with the Studio side.",
    snippet: "desktop app ⇄ Luau plugin ⇄ Studio session",
  },
  {
    icon: ScanLine,
    title: "Scan & replace",
    body: "Run a full place scan, preview every match — R6/R15 animations and audio included — then push replacements while the place is still running.",
    snippet: "1,284 instances · 96 matches · applied live",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="01"
          eyebrow="How it works"
          title="Three steps from install to replacement"
          description="The desktop app handles discovery, previews, profiles, and configuration. The companion Luau plugin performs the Studio-side operations — connected over a local bridge."
        />

        <div className="relative mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="absolute top-[52px] left-[12%] right-[12%] hidden md:block h-px bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.12} className="relative">
              <div className="group flex h-full flex-col gap-4 rounded-lg border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_12px_40px_-16px_rgba(234,88,12,0.25)]">
                <div className="flex items-center justify-between">
                  <div className="flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                    <step.icon className="size-5" />
                  </div>
                  <span className="font-mono text-xs text-muted-foreground/60">
                    0{i + 1}
                  </span>
                </div>
                <h3 className="font-display text-lg font-semibold tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                  {step.body}
                </p>
                <div className="rounded-md border bg-surface px-3 py-2 font-mono text-[11px] text-muted-foreground/90 truncate">
                  <span className="text-primary select-none" aria-hidden>
                    ${" "}
                  </span>
                  {step.snippet}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

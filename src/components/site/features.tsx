"use client";

import {
  KeyRound,
  ListTree,
  MonitorPlay,
  PlugZap,
  Replace,
  ShieldCheck,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";

const FEATURES = [
  {
    icon: Replace,
    title: "Full-place replacement",
    body: "Replace animations, sounds, decals, meshes, and videos across a complete place scan — applied in real time while Studio is open.",
  },
  {
    icon: MonitorPlay,
    title: "Live preview",
    body: "Watch R6 and R15 animations and listen to audio assets before you commit a replacement. What you hear and see is what gets applied.",
  },
  {
    icon: KeyRound,
    title: "Profiles",
    body: "Manage Roblox users and groups with isolated profile data. Credentials stay in your operating system's secure storage — never in plain files.",
  },
  {
    icon: ListTree,
    title: "Place browser",
    body: "Explore the asset tree, inspect instance properties, locate references, and copy asset IDs with a click. The whole place, navigable.",
  },
  {
    icon: PlugZap,
    title: "Plugin sync",
    body: "The bundled Studio plugin is synchronized into supported plugin directories automatically on every launch. No manual installs, no version drift.",
  },
  {
    icon: ShieldCheck,
    title: "No place-file surgery",
    body: "The app works against the running session through the plugin bridge — no need to manually search instances or modify place files.",
  },
];

export function Features() {
  return (
    <section id="features" className="relative py-20 sm:py-28 border-t bg-surface/30">
      <div aria-hidden className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent_100%)] opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="02"
          eyebrow="Features"
          title="Built for the way you actually ship places"
          description="Discovery, previews, profiles, and replacement configuration live in the desktop app. Studio-side execution happens in the plugin. Everything stays in sync."
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.title} delay={(i % 3) * 0.1}>
              <article className="group relative flex h-full flex-col gap-4 rounded-lg border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_16px_48px_-20px_rgba(234,88,12,0.3)] hover:-translate-y-0.5 corner-ticks">
                <div className="flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <feature.icon className="size-[18px]" />
                </div>
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {feature.title}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {feature.body}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

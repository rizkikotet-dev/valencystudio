"use client";

import { Check, X } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { cn } from "@/lib/utils";

const ROWS: { manual: string; valency: string }[] = [
  {
    manual: "Hunt through the Explorer tree and open every instance to find asset IDs",
    valency: "One full place scan discovers every animation, sound, decal, mesh, and video",
  },
  {
    manual: "Copy-paste new IDs into dozens of properties, one instance at a time",
    valency: "Pick the replacement once — apply it to every match in the place",
  },
  {
    manual: "Swap blind and hope the new asset looks right in game",
    valency: "Preview R6/R15 animations and listen to audio before committing",
  },
  {
    manual: "Reconfigure everything from scratch after each reupload",
    valency: "Profiles keep Roblox users and groups isolated with saved settings",
  },
  {
    manual: "Missed references surface later, in playtests — or in production",
    valency: "The place browser locates references and lets you copy any asset ID",
  },
];

export function Comparison() {
  return (
    <section id="comparison" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="03"
          eyebrow="Comparison"
          title="Manual work vs. one pass"
          description="The same replacement job, two ways. Everything on the right maps to a real feature — nothing invented."
        />

        <Reveal className="mt-12 sm:mt-16">
          <div className="overflow-hidden rounded-lg border bg-card">
            {/* Header row */}
            <div className="grid grid-cols-1 md:grid-cols-2 border-b bg-surface/60">
              <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4 border-b md:border-b-0 md:border-r border-border">
                <span className="flex size-6 items-center justify-center rounded-full border border-border bg-background">
                  <X className="size-3.5 text-muted-foreground" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
                  Doing it by hand
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary">
                  <Check className="size-3.5 text-primary-foreground" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  With ValencyStudio — Spoofer
                </span>
              </div>
            </div>

            {/* Rows */}
            <ul>
              {ROWS.map((row, i) => (
                <li
                  key={i}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 border-b border-border last:border-b-0",
                    i % 2 === 1 && "bg-surface/30"
                  )}
                >
                  <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b md:border-b-0 md:border-r border-border">
                    <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {row.manual}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 px-5 sm:px-6 py-4">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {row.valency}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

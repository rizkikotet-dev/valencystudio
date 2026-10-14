"use client";

import { Check, X } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { useLocale } from "@/hooks/use-locale";
import { cn } from "@/lib/utils";

const ROWS = [
  { manualKey: "comparison.r1Manual", valencyKey: "comparison.r1Valency" },
  { manualKey: "comparison.r2Manual", valencyKey: "comparison.r2Valency" },
  { manualKey: "comparison.r3Manual", valencyKey: "comparison.r3Valency" },
  { manualKey: "comparison.r4Manual", valencyKey: "comparison.r4Valency" },
  { manualKey: "comparison.r5Manual", valencyKey: "comparison.r5Valency" },
] as const;

export function Comparison() {
  const { t } = useLocale();

  return (
    <section id="comparison" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="03"
          eyebrow={t("comparison.eyebrow")}
          title={t("comparison.title")}
          description={t("comparison.description")}
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
                  {t("comparison.manualHeader")}
                </span>
              </div>
              <div className="flex items-center gap-2.5 px-5 sm:px-6 py-4">
                <span className="flex size-6 items-center justify-center rounded-full bg-primary">
                  <Check className="size-3.5 text-primary-foreground" />
                </span>
                <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-primary">
                  {t("comparison.valencyHeader")}
                </span>
              </div>
            </div>

            {/* Rows */}
            <ul>
              {ROWS.map((row, i) => (
                <li
                  key={row.manualKey}
                  className={cn(
                    "grid grid-cols-1 md:grid-cols-2 border-b border-border last:border-b-0",
                    i % 2 === 1 && "bg-surface/30"
                  )}
                >
                  <div className="flex items-start gap-3 px-5 sm:px-6 py-4 border-b md:border-b-0 md:border-r border-border">
                    <X className="mt-0.5 size-4 shrink-0 text-muted-foreground/50" />
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {t(row.manualKey)}
                    </p>
                  </div>
                  <div className="flex items-start gap-3 px-5 sm:px-6 py-4">
                    <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                    <p className="text-sm leading-relaxed text-foreground/90">
                      {t(row.valencyKey)}
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

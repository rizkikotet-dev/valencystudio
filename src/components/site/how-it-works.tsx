"use client";

import { PlugZap, ScanLine, MonitorCheck } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { useLocale } from "@/hooks/use-locale";

const STEPS = [
  {
    icon: PlugZap,
    titleKey: "hiw.step1Title",
    bodyKey: "hiw.step1Body",
    snippetKey: "hiw.step1Snippet",
  },
  {
    icon: MonitorCheck,
    titleKey: "hiw.step2Title",
    bodyKey: "hiw.step2Body",
    snippetKey: "hiw.step2Snippet",
  },
  {
    icon: ScanLine,
    titleKey: "hiw.step3Title",
    bodyKey: "hiw.step3Body",
    snippetKey: "hiw.step3Snippet",
  },
] as const;

export function HowItWorks() {
  const { t } = useLocale();

  return (
    <section id="how-it-works" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="01"
          eyebrow={t("nav.howItWorks")}
          title={t("hiw.title")}
          description={t("hiw.description")}
        />

        <div className="relative mt-12 sm:mt-16 grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Connector line (desktop) */}
          <div
            aria-hidden
            className="absolute top-[52px] left-[12%] right-[12%] hidden md:block h-px bg-gradient-to-r from-primary/5 via-primary/40 to-primary/5"
          />

          {STEPS.map((step, i) => (
            <Reveal key={step.titleKey} delay={i * 0.12} className="relative">
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
                  {t(step.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground flex-1">
                  {t(step.bodyKey)}
                </p>
                <div className="rounded-md border bg-surface px-3 py-2 font-mono text-[11px] text-muted-foreground/90 truncate">
                  <span className="text-primary select-none" aria-hidden>
                    ${" "}
                  </span>
                  {t(step.snippetKey)}
                </div>
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

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
import { useLocale } from "@/hooks/use-locale";

const FEATURES = [
  { icon: Replace, titleKey: "features.f1Title", bodyKey: "features.f1Body" },
  { icon: MonitorPlay, titleKey: "features.f2Title", bodyKey: "features.f2Body" },
  { icon: KeyRound, titleKey: "features.f3Title", bodyKey: "features.f3Body" },
  { icon: ListTree, titleKey: "features.f4Title", bodyKey: "features.f4Body" },
  { icon: PlugZap, titleKey: "features.f5Title", bodyKey: "features.f5Body" },
  { icon: ShieldCheck, titleKey: "features.f6Title", bodyKey: "features.f6Body" },
] as const;

export function Features() {
  const { t } = useLocale();

  return (
    <section id="features" className="relative py-20 sm:py-28 border-t bg-surface/30">
      <div aria-hidden className="absolute inset-0 bg-dots [mask-image:radial-gradient(ellipse_60%_60%_at_50%_40%,black,transparent_100%)] opacity-40" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="02"
          eyebrow={t("nav.features")}
          title={t("features.title")}
          description={t("features.description")}
        />

        <div className="mt-12 sm:mt-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {FEATURES.map((feature, i) => (
            <Reveal key={feature.titleKey} delay={(i % 3) * 0.1}>
              <article className="group relative flex h-full flex-col gap-4 rounded-lg border bg-card p-6 transition-all duration-300 hover:border-primary/40 hover:shadow-[0_16px_48px_-20px_rgba(234,88,12,0.3)] hover:-translate-y-0.5 corner-ticks">
                <div className="flex size-10 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary transition-transform duration-300 group-hover:scale-105">
                  <feature.icon className="size-[18px]" />
                </div>
                <h3 className="font-display text-base font-semibold tracking-tight">
                  {t(feature.titleKey)}
                </h3>
                <p className="text-sm leading-relaxed text-muted-foreground">
                  {t(feature.bodyKey)}
                </p>
              </article>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}

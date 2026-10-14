"use client";

import {
  Box,
  Clapperboard,
  Image as ImageIcon,
  PersonStanding,
  Volume2,
} from "lucide-react";
import { useLocale } from "@/hooks/use-locale";

const TYPES = [
  { icon: PersonStanding, labelKey: "assets.animations" },
  { icon: Volume2, labelKey: "assets.sounds" },
  { icon: ImageIcon, labelKey: "assets.decals" },
  { icon: Box, labelKey: "assets.meshes" },
  { icon: Clapperboard, labelKey: "assets.videos" },
] as const;

function MarqueeList() {
  const { t } = useLocale();

  return (
    <ul className="flex shrink-0 items-center" aria-hidden>
      {TYPES.map(({ icon: Icon, labelKey }) => (
        <li
          key={labelKey}
          className="mx-6 flex items-center gap-2.5 font-display text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          <Icon className="size-4 text-primary" aria-hidden />
          {t(labelKey)}
        </li>
      ))}
    </ul>
  );
}

export function AssetTypes() {
  const { t } = useLocale();

  return (
    <section
      aria-label={t("a11y.supportedAssetTypes")}
      className="marquee-hover-pause relative border-y py-8 overflow-hidden bg-background"
    >
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent"
      />
      <div
        className="flex w-max animate-marquee motion-reduce:animate-none cursor-default"
        title={t("assets.hoverToPause")}
      >
        <MarqueeList />
        <MarqueeList />
        <MarqueeList />
        <MarqueeList />
      </div>
      <span className="sr-only">{t("assets.srOnly")}</span>
    </section>
  );
}

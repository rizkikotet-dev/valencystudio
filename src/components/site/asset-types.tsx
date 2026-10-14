"use client";

import {
  Box,
  Clapperboard,
  Image as ImageIcon,
  PersonStanding,
  Volume2,
} from "lucide-react";

const TYPES = [
  { icon: PersonStanding, label: "Animations" },
  { icon: Volume2, label: "Sounds" },
  { icon: ImageIcon, label: "Decals" },
  { icon: Box, label: "Meshes" },
  { icon: Clapperboard, label: "Videos" },
];

function MarqueeList() {
  return (
    <ul className="flex shrink-0 items-center" aria-hidden>
      {TYPES.map(({ icon: Icon, label }) => (
        <li
          key={label}
          className="mx-6 flex items-center gap-2.5 font-display text-sm font-medium uppercase tracking-[0.24em] text-muted-foreground"
        >
          <Icon className="size-4 text-primary" aria-hidden />
          {label}
        </li>
      ))}
    </ul>
  );
}

export function AssetTypes() {
  return (
    <section aria-label="Supported asset types" className="relative border-y py-8 overflow-hidden bg-background">
      <div
        aria-hidden
        className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent"
      />
      <div
        aria-hidden
        className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent"
      />
      <div className="flex w-max animate-marquee motion-reduce:animate-none">
        <MarqueeList />
        <MarqueeList />
        <MarqueeList />
        <MarqueeList />
      </div>
      <span className="sr-only">
        Supports animations, sounds, decals, meshes, and videos.
      </span>
    </section>
  );
}

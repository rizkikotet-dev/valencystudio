"use client";

import Image from "next/image";
import { ArrowUpRight, Download, Github } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StudioMock } from "@/components/site/studio-mock";
import { Reveal } from "@/components/site/reveal";
import { usePlatform } from "@/hooks/use-platform";
import { RELEASES_URL, REPO_URL, useStats } from "@/hooks/use-site-data";

const TECH_STACK = ["Tauri 2", "Rust", "React 19", "Luau"] as const;

export function Hero() {
  const platform = usePlatform();
  const { stats } = useStats();

  const detectedAsset = platform
    ? stats.release.assets.find((a) => a.platform === platform)
    : undefined;

  const downloadHref = detectedAsset?.url ?? RELEASES_URL;
  const downloadLabel = platform
    ? `Download for ${platform === "macos" ? "macOS" : platform[0].toUpperCase() + platform.slice(1)}`
    : "Download latest release";

  return (
    <section id="top" className="relative overflow-hidden">
      {/* Background layers */}
      <div aria-hidden className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_75%_60%_at_50%_0%,black_35%,transparent_100%)]" />
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-primary/60 to-transparent" />

      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 pt-14 sm:pt-20 pb-16 sm:pb-24">
        <div className="flex flex-col items-center text-center gap-5">
          {/* Eyebrow */}
          <Reveal>
            <a
              href={stats.release.url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex items-center gap-2.5 rounded-full border bg-card/70 px-3.5 py-1.5 text-xs backdrop-blur transition-colors hover:border-primary/40"
            >
              <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" aria-hidden />
              <span className="font-mono tracking-wide text-muted-foreground">
                {stats.release.tag} · latest release
              </span>
              <span className="hidden sm:inline text-border" aria-hidden>
                |
              </span>
              <span className="hidden sm:inline font-mono tracking-wide text-muted-foreground">
                open source · GPL-3.0
              </span>
              <ArrowUpRight className="size-3 text-muted-foreground transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
            </a>
          </Reveal>

          {/* Headline */}
          <Reveal delay={0.08}>
            <h1 className="font-display text-4xl sm:text-6xl lg:text-[4.5rem] font-semibold tracking-[-0.03em] leading-[1.04] text-balance max-w-4xl">
              Every asset in your place,{" "}
              <span className="text-primary">found and replaced</span> in one pass.
            </h1>
          </Reveal>

          {/* Subhead */}
          <Reveal delay={0.16}>
            <p className="max-w-2xl text-muted-foreground text-base sm:text-lg leading-relaxed">
              ValencyStudio — Spoofer connects to a running Roblox Studio session, scans the
              entire place, and lets you preview and replace animations, sounds, decals, meshes,
              and videos live — without hunting through instances or editing place files.
            </p>
          </Reveal>

          {/* CTAs */}
          <Reveal delay={0.24} className="flex flex-col sm:flex-row items-center gap-3">
            <Button asChild size="lg" className="h-12 px-6 text-[15px] font-medium gap-2.5 shadow-lg shadow-primary/25">
              <a
                href={downloadHref}
                target="_blank"
                rel="noopener noreferrer"
                data-analytics="hero-download"
              >
                <Download className="size-[18px]" />
                {downloadLabel}
              </a>
            </Button>
            <Button asChild size="lg" variant="outline" className="h-12 px-6 text-[15px] gap-2.5 bg-background/60 backdrop-blur">
              <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                <Github className="size-[18px]" />
                View source
              </a>
            </Button>
          </Reveal>

          {/* Microcopy */}
          <Reveal delay={0.3}>
            <p className="font-mono text-[11px] tracking-wide text-muted-foreground/80">
              Windows · macOS · Linux — free &amp; open source, GPL-3.0
            </p>
          </Reveal>

          {/* Tech chips */}
          <Reveal delay={0.36}>
            <ul className="mt-2 flex flex-wrap items-center justify-center gap-2" aria-label="Technology stack">
              {TECH_STACK.map((tech) => (
                <li
                  key={tech}
                  className="rounded-md border bg-card/60 px-2.5 py-1 font-mono text-[11px] text-muted-foreground backdrop-blur"
                >
                  {tech}
                </li>
              ))}
            </ul>
          </Reveal>
        </div>

        {/* Product mock */}
        <Reveal delay={0.2} y={36} className="mt-14 sm:mt-20">
          <div className="mx-auto max-w-4xl">
            <StudioMock />
            <p className="mt-4 text-center font-mono text-[11px] text-muted-foreground/70">
              ValencyStudio — Spoofer running against a live Roblox Studio session
            </p>
          </div>
        </Reveal>
      </div>
    </section>
  );
}

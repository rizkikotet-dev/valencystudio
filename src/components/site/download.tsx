"use client";

import { useState } from "react";
import {
  Apple,
  AppWindow,
  ArrowUpRight,
  Check,
  Copy,
  Download as DownloadIcon,
  Loader2,
  ShieldAlert,
  Terminal,
} from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { usePlatform, PLATFORM_META } from "@/hooks/use-platform";
import {
  postDownload,
  RELEASES_URL,
  REPO_URL,
  useStats,
  type Platform,
} from "@/hooks/use-site-data";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const BUILD_STEPS = [
  "git clone https://github.com/valency-studio/valencystudio-spoofer.git",
  "cd valencystudio-spoofer",
  "bun install",
  "bun run tauri:dev",
];

function Quickstart() {
  const [copied, setCopied] = useState(false);

  async function copyAll() {
    const text = BUILD_STEPS.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success("Copied to clipboard", {
        description: "Paste it in your terminal to build from source.",
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Couldn't access the clipboard.");
    }
  }

  return (
    <div className="overflow-hidden rounded-lg border bg-[oklch(0.13_0.004_65)] shadow-inner">
      <div className="flex items-center gap-2 border-b border-white/5 bg-white/[0.03] px-4 py-2.5">
        <span className="flex items-center gap-1.5" aria-hidden>
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-white/10" />
          <span className="size-2.5 rounded-full bg-primary/70" />
        </span>
        <span className="ml-1 font-mono text-[11px] text-white/40">
          build from source — requires Rust + Bun + Node.js 20
        </span>
        <button
          type="button"
          onClick={copyAll}
          aria-label="Copy build commands"
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/60 transition-colors hover:text-white hover:border-primary/40"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <div className="px-4 py-4 font-mono text-[12px] leading-[1.9]">
        {BUILD_STEPS.map((step, i) => (
          <div key={step} className="flex items-baseline gap-3">
            <span className="select-none text-white/25 tabular-nums">{String(i + 1).padStart(2, "0")}</span>
            <span className="text-white/85 break-all">
              <span className="text-primary select-none" aria-hidden>
                ${" "}
              </span>
              {step}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

const PLATFORM_ICONS: Record<Platform, React.ComponentType<{ className?: string }>> = {
  windows: AppWindow,
  macos: Apple,
  linux: Terminal,
};

function DownloadCard({
  platform,
  detected,
  assetName,
  href,
  onDownload,
}: {
  platform: Platform;
  detected: boolean;
  assetName: string;
  href: string;
  onDownload: (platform: Platform, href: string) => void;
}) {
  const Icon = PLATFORM_ICONS[platform];
  const meta = PLATFORM_META[platform];

  return (
    <article
      className={cn(
        "relative flex flex-col gap-5 rounded-lg border bg-card p-6 transition-all duration-300",
        detected
          ? "border-primary/50 shadow-[0_16px_48px_-20px_rgba(234,88,12,0.35)]"
          : "hover:border-foreground/20"
      )}
    >
      {detected ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
          Detected
        </span>
      ) : null}

      <div className="flex items-center justify-between">
        <div className="flex size-11 items-center justify-center rounded-md border border-primary/25 bg-primary/10 text-primary">
          <Icon className="size-5" />
        </div>
        <span className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {meta.label}
        </span>
      </div>

      <div>
        <h3 className="font-display text-lg font-semibold tracking-tight">
          {meta.label} build
        </h3>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all leading-relaxed">
          {assetName}
        </p>
      </div>

      <Button
        className="mt-auto w-full gap-2"
        variant={detected ? "default" : "outline"}
        onClick={() => onDownload(platform, href)}
      >
        <DownloadIcon className="size-4" />
        Download {meta.fileExtension}
      </Button>
    </article>
  );
}

export function DownloadSection() {
  const { stats } = useStats();
  const platform = usePlatform();
  const [pending, setPending] = useState<Platform | null>(null);

  function assetNameFor(p: Platform): string {
    const found = stats.release.assets.find((a) => a.platform === p);
    if (found?.name) return found.name;
    const tag = stats.release.tag.replace(/^v/, "");
    return `ValencyStudio - Spoofer_${tag}_${PLATFORM_META[p].fileExtension}`;
  }

  function hrefFor(p: Platform): string {
    return stats.release.assets.find((a) => a.platform === p)?.url ?? RELEASES_URL;
  }

  function handleDownload(p: Platform, href: string) {
    setPending(p);
    void postDownload(p).finally(() => setPending(null));
    window.open(href, "_blank", "noopener,noreferrer");
    toast.success(`Opening the ${PLATFORM_META[p].label} download…`, {
      description: "Every release ships with the Studio plugin included.",
    });
  }

  return (
    <section id="download" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow="Download"
          title="Get ValencyStudio — Spoofer"
          description="Free and open source under GPL-3.0. Download the latest build for your platform — the Roblox Studio plugin (ValencyStudioSpoofer.rbxmx) is included with every release and syncs itself on first launch."
        />

        <Reveal className="mt-12 sm:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
              <DownloadCard
                key={p}
                platform={p}
                detected={platform === p}
                assetName={assetNameFor(p)}
                href={hrefFor(p)}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </Reveal>

        {/* Transparency note — straight from the README */}
        <Reveal delay={0.1} className="mt-6">
          <aside
            aria-label="Build transparency note"
            className="flex flex-col sm:flex-row gap-4 rounded-lg border bg-surface/60 p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold tracking-tight">
                Unsigned builds — read before installing
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                Windows Defender and other antivirus software may flag unsigned builds.
                ValencyStudio — Spoofer is not currently code signed. Builds can be independently
                verified by compiling the project from source.
              </p>
            </div>
            <div className="flex flex-col sm:justify-center gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  Compile from source
                  <ArrowUpRight className="size-3.5" />
                </a>
              </Button>
              <Button asChild variant="ghost" size="sm" className="gap-1.5 text-muted-foreground">
                <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
                  {pending ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <ArrowUpRight className="size-3.5" />
                  )}
                  All releases
                </a>
              </Button>
            </div>
          </aside>
        </Reveal>

        {/* Build from source */}
        <Reveal delay={0.14} className="mt-6">
          <Quickstart />
        </Reveal>
      </div>
    </section>
  );
}

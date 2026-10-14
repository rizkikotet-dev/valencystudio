"use client";

import { useState } from "react";
import { motion, useReducedMotion } from "framer-motion";
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
import { useLocale } from "@/hooks/use-locale";
import { formatNumber } from "@/lib/i18n";
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
  const { t } = useLocale();

  async function copyAll() {
    const text = BUILD_STEPS.join("\n");
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      toast.success(t("toast.copiedToClipboard"), {
        description: t("toast.pasteToBuild"),
      });
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error(t("toast.clipboardError"));
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
          {t("download.buildFromSourceNote")}
        </span>
        <button
          type="button"
          onClick={copyAll}
          aria-label={t("a11y.copyBuildCommands")}
          className="ml-auto flex items-center gap-1.5 rounded-md border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-white/60 transition-colors hover:text-white hover:border-primary/40"
        >
          {copied ? <Check className="size-3 text-emerald-400" /> : <Copy className="size-3" />}
          {copied ? t("common.copied") : t("common.copy")}
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

/* Bar segment colors per platform — ember, neutral, green (matches site accents) */
const PLATFORM_BAR: Record<Platform, string> = {
  windows: "bg-primary",
  macos: "bg-foreground/40",
  linux: "bg-emerald-500/80",
};

const PLATFORM_DOT: Record<Platform, string> = {
  windows: "bg-primary",
  macos: "bg-foreground/50",
  linux: "bg-emerald-500",
};

/**
 * Stacked per-platform download split for the latest release.
 * Renders only with live GitHub data and a non-zero total — never guesses.
 */
function PlatformSplit() {
  const { stats } = useStats();
  const { locale, t } = useLocale();
  const reduceMotion = useReducedMotion();

  if (stats.source !== "github") return null;

  const rows = (Object.keys(PLATFORM_META) as Platform[]).map((p) => ({
    platform: p,
    label: PLATFORM_META[p].label,
    downloads: stats.release.assets.find((a) => a.platform === p)?.downloads ?? 0,
  }));
  const total = rows.reduce((sum, r) => sum + r.downloads, 0);
  if (total <= 0) return null;

  return (
    <Reveal delay={0.06} className="mt-6">
      <div className="rounded-lg border bg-card/50 p-5 sm:p-6">
        <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
          <div>
            <h3 className="font-display text-sm font-semibold tracking-tight">
              {t("download.splitTitle")}
            </h3>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
              {t("download.splitHint", { tag: stats.release.tag })}
            </p>
          </div>
          <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
            {t("download.splitTotal", { count: formatNumber(total, locale) })}
          </p>
        </div>

        <div
          role="img"
          aria-label={t("a11y.downloadSplit")}
          className="mt-5"
        >
          <div className="flex h-3 w-full gap-px overflow-hidden rounded-full bg-surface">
            {rows.map((r) => {
              const pct = (r.downloads / total) * 100;
              if (pct <= 0) return null;
              return (
                <motion.div
                  key={r.platform}
                  initial={reduceMotion ? false : { scaleX: 0 }}
                  whileInView={{ scaleX: 1 }}
                  viewport={{ once: true, margin: "-40px" }}
                  transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className={cn("h-full origin-left", PLATFORM_BAR[r.platform])}
                  style={{ width: `${pct}%` }}
                />
              );
            })}
          </div>

          <dl className="mt-4 flex flex-wrap gap-x-6 gap-y-2">
            {rows.map((r) => (
              <div key={r.platform} className="flex items-center gap-2">
                <span
                  aria-hidden
                  className={cn("size-2 rounded-full", PLATFORM_DOT[r.platform])}
                />
                <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                  {r.label}
                </dt>
                <dd className="font-mono text-[11px] tabular-nums text-foreground/90">
                  {formatNumber(r.downloads, locale)}
                  <span className="ml-1 text-muted-foreground/75">
                    {Math.round((r.downloads / total) * 100)}%
                  </span>
                </dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </Reveal>
  );
}

function DownloadCard({
  platform,
  detected,
  assetName,
  assetDownloads,
  live,
  href,
  onDownload,
}: {
  platform: Platform;
  detected: boolean;
  assetName: string;
  assetDownloads: number;
  live: boolean;
  href: string;
  onDownload: (platform: Platform, href: string) => void;
}) {
  const Icon = PLATFORM_ICONS[platform];
  const meta = PLATFORM_META[platform];
  const { locale, t } = useLocale();

  return (
    <article
      className={cn(
        "relative flex flex-col gap-5 rounded-lg border bg-card p-6 card-hover-glow",
        detected && "border-primary/50 shadow-[0_16px_48px_-20px_rgba(234,88,12,0.35)]"
      )}
    >
      {detected ? (
        <span className="absolute -top-2.5 left-5 rounded-full bg-primary px-2.5 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.18em] text-primary-foreground">
          {t("download.detected")}
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
          {t("download.platformBuild", { platform: meta.label })}
        </h3>
        <p className="mt-1 font-mono text-[11px] text-muted-foreground break-all leading-relaxed">
          {assetName}
        </p>
        {live && assetDownloads > 0 ? (
          <p className="mt-2 inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
            <DownloadIcon className="size-3 text-primary/70" aria-hidden />
            {t("download.assetDownloads", { count: formatNumber(assetDownloads, locale) })}
          </p>
        ) : null}
      </div>

      <Button
        className="mt-auto w-full gap-2"
        variant={detected ? "default" : "outline"}
        onClick={() => onDownload(platform, href)}
      >
        <DownloadIcon className="size-4" />
        {t("download.downloadFile", { ext: meta.fileExtension })}
      </Button>
    </article>
  );
}

export function DownloadSection() {
  const { stats } = useStats();
  const platform = usePlatform();
  const { t } = useLocale();
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

  function downloadsFor(p: Platform): number {
    return stats.release.assets.find((a) => a.platform === p)?.downloads ?? 0;
  }

  function handleDownload(p: Platform, href: string) {
    setPending(p);
    void postDownload(p).finally(() => setPending(null));
    window.open(href, "_blank", "noopener,noreferrer");
    toast.success(t("toast.openingDownload", { platform: PLATFORM_META[p].label }), {
      description: t("toast.releaseIncludesPlugin"),
    });
  }

  return (
    <section id="download" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="04"
          eyebrow={t("nav.download")}
          title={t("download.title")}
          description={t("download.description")}
        />

        <Reveal className="mt-12 sm:mt-16">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {(Object.keys(PLATFORM_META) as Platform[]).map((p) => (
              <DownloadCard
                key={p}
                platform={p}
                detected={platform === p}
                assetName={assetNameFor(p)}
                assetDownloads={downloadsFor(p)}
                live={stats.source === "github"}
                href={hrefFor(p)}
                onDownload={handleDownload}
              />
            ))}
          </div>
        </Reveal>

        <PlatformSplit />

        {/* Transparency note — straight from the README */}
        <Reveal delay={0.1} className="mt-6">
          <aside
            aria-label={t("a11y.transparencyNote")}
            className="flex flex-col sm:flex-row gap-4 rounded-lg border bg-surface/60 p-5"
          >
            <div className="flex size-10 shrink-0 items-center justify-center rounded-md border border-amber-500/40 bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="size-5" />
            </div>
            <div className="flex-1">
              <h3 className="font-display text-sm font-semibold tracking-tight">
                {t("download.unsignedTitle")}
              </h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {t("download.unsignedBody")}
              </p>
            </div>
            <div className="flex flex-col sm:justify-center gap-2 shrink-0">
              <Button asChild variant="outline" size="sm" className="gap-1.5">
                <a href={REPO_URL} target="_blank" rel="noopener noreferrer">
                  {t("download.compileFromSource")}
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
                  {t("download.allReleases")}
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

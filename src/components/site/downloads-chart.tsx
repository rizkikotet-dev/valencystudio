"use client";

import { motion, useReducedMotion } from "framer-motion";
import { useChangelog, type Platform } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { PLATFORM_META } from "@/hooks/use-platform";
import { formatNumber } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/**
 * Segment colors per platform — kept in sync with PlatformSplit (download.tsx):
 * ember / neutral / green, bottom → top inside each bar.
 */
const SEGMENT_BG: Record<Platform, string> = {
  windows: "bg-primary",
  macos: "bg-foreground/40",
  linux: "bg-emerald-500/80",
};

const SEGMENT_DOT: Record<Platform, string> = {
  windows: "bg-primary",
  macos: "bg-foreground/50",
  linux: "bg-emerald-500",
};

const PLATFORMS: Platform[] = ["windows", "macos", "linux"];

/**
 * Minimal CSS bar chart: all-time asset downloads per release,
 * oldest → newest (time flows left to right). Bars stack per-platform
 * whenever every release carries the breakdown — otherwise they render
 * as a single ember gradient. Renders whenever real per-release numbers
 * exist — live GitHub data or the last-good cache.
 */
export function DownloadsChart() {
  const { releases, stale } = useChangelog();
  const { locale, t } = useLocale();
  const reduceMotion = useReducedMotion();

  const data = [...releases].reverse(); // oldest first
  const max = Math.max(...data.map((r) => r.downloads), 0);

  // Render whenever we have real per-release numbers (live or last-good cache).
  if (max <= 0) return null;

  const total = data.reduce((sum, r) => sum + r.downloads, 0);
  const stacked = data.every((r) => r.downloads <= 0 || r.platforms != null);

  return (
    <div className="mt-10 rounded-lg border bg-card/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {t("changelog.chartTitle")}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {stale
            ? t("changelog.cachedNote")
            : stacked
              ? `${t("changelog.chartSubtitle")} · ${t("changelog.byPlatform")}`
              : t("changelog.chartSubtitle")}
        </p>
      </div>

      <div
        role="img"
        aria-label={`${t("changelog.chartTitle")} — ${formatNumber(total, locale)} ${t("changelog.downloadsUnit")}`}
        className="mt-6 flex items-end gap-1.5 sm:gap-3"
      >
        {data.map((release, i) => {
          const isZero = release.downloads <= 0;
          const pct = isZero ? 0 : Math.max((release.downloads / max) * 100, 8);

          return (
            <div
              key={release.tag}
              title={`${release.tag} — ${formatNumber(release.downloads, locale)} ${t("changelog.downloadsUnit")}`}
              className="flex min-w-0 flex-1 flex-col items-center gap-2"
            >
              <span
                className={
                  isZero
                    ? "font-mono text-[9px] tabular-nums text-muted-foreground/65"
                    : "font-mono text-[9px] font-semibold tabular-nums text-foreground/90 sm:text-[10px]"
                }
              >
                {formatNumber(release.downloads, locale)}
              </span>

              <div className="flex h-28 w-full items-end sm:h-36" aria-hidden>
                {isZero ? (
                  <div className="h-[3px] w-full rounded-t-sm bg-border/70" />
                ) : (
                  <motion.div
                    initial={reduceMotion ? false : { height: "0%" }}
                    whileInView={{ height: `${pct}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="flex w-full flex-col-reverse overflow-hidden rounded-t-sm transition-[filter] hover:brightness-110"
                  >
                    {stacked && release.platforms ? (
                      (() => {
                        // Bar height encodes ALL-asset downloads; the color
                        // split shows the relative installer share so segments
                        // always fill the bar (installers ≠ all assets —
                        // zips/checksums are excluded from the breakdown).
                        const installerSum = PLATFORMS.reduce(
                          (sum, p) => sum + (release.platforms?.[p] ?? 0),
                          0,
                        );
                        return PLATFORMS.map((p) => {
                          const share = release.platforms?.[p] ?? 0;
                          if (share <= 0 || installerSum <= 0) return null;
                          return (
                            <div
                              key={p}
                              className={cn("w-full", SEGMENT_BG[p])}
                              style={{
                                height: `${(share / installerSum) * 100}%`,
                              }}
                            />
                          );
                        });
                      })()
                    ) : (
                      <div className="h-full w-full bg-gradient-to-t from-primary/30 via-primary/55 to-primary" />
                    )}
                  </motion.div>
                )}
              </div>

              <span className="max-w-full truncate font-mono text-[8px] tabular-nums text-muted-foreground sm:text-[9px]">
                {release.tag}
              </span>
            </div>
          );
        })}
      </div>

      {stacked ? (
        <dl className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-1.5 border-t border-border/60 pt-3">
          {PLATFORMS.map((p) => (
            <div key={p} className="flex items-center gap-1.5">
              <span aria-hidden className={cn("size-2 rounded-full", SEGMENT_DOT[p])} />
              <dt className="font-mono text-[10px] uppercase tracking-[0.14em] text-muted-foreground">
                {PLATFORM_META[p].label}
              </dt>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );
}

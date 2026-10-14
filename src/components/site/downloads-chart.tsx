"use client";

import { motion } from "framer-motion";
import { useChangelog } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { formatNumber } from "@/lib/i18n";

/**
 * Minimal CSS bar chart: all-time asset downloads per release,
 * oldest → newest (time flows left to right). Renders whenever real
 * per-release numbers exist — live GitHub data or the last-good cache.
 */
export function DownloadsChart() {
  const { releases, stale } = useChangelog();
  const { locale, t } = useLocale();

  const data = [...releases].reverse(); // oldest first
  const max = Math.max(...data.map((r) => r.downloads), 0);

  // Render whenever we have real per-release numbers (live or last-good cache).
  if (max <= 0) return null;

  const total = data.reduce((sum, r) => sum + r.downloads, 0);

  return (
    <div className="mt-10 rounded-lg border bg-card/50 p-5 sm:p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
        <h3 className="font-display text-sm font-semibold tracking-tight">
          {t("changelog.chartTitle")}
        </h3>
        <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-muted-foreground">
          {stale ? t("changelog.cachedNote") : t("changelog.chartSubtitle")}
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
                    ? "font-mono text-[9px] tabular-nums text-muted-foreground/50"
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
                    initial={{ height: "0%" }}
                    whileInView={{ height: `${pct}%` }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.7, delay: i * 0.06, ease: [0.16, 1, 0.3, 1] }}
                    className="w-full rounded-t-sm bg-gradient-to-t from-primary/30 via-primary/55 to-primary transition-[filter] hover:brightness-110"
                  />
                )}
              </div>

              <span className="max-w-full truncate font-mono text-[8px] tabular-nums text-muted-foreground sm:text-[9px]">
                {release.tag}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

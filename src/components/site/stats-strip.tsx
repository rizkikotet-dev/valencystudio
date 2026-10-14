"use client";

import { useEffect, useRef } from "react";
import { animate, useReducedMotion } from "framer-motion";
import { formatDistanceToNowStrict } from "date-fns";
import { enUS, id as dateFnsId } from "date-fns/locale";
import { useStats } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { formatDate, formatNumber, type Locale } from "@/lib/i18n";
import { cn } from "@/lib/utils";

function CountUp({ value, locale }: { value: number; locale: Locale }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);
  const reduceMotion = useReducedMotion();

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    // Respect prefers-reduced-motion: paint the final value directly.
    if (reduceMotion) {
      node.textContent = formatNumber(value, locale);
      prev.current = value;
      return;
    }
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = formatNumber(Math.round(v), locale);
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value, locale, reduceMotion]);

  return <span ref={ref} className="tabular-nums">{formatNumber(value, locale)}</span>;
}

interface CellProps {
  label: string;
  children: React.ReactNode;
  sub?: React.ReactNode;
  live?: boolean;
  className?: string;
}

function Cell({ label, children, sub, live, className }: CellProps) {
  const { t } = useLocale();

  return (
    <div
      className={cn(
        "relative flex flex-col gap-1.5 px-6 py-7 sm:px-8 transition-colors duration-300 hover:bg-accent/40",
        className
      )}
    >
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {live ? (
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" title={t("footer.liveFromApi")} />
        ) : null}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{children}</div>
      {sub ? <div className="font-mono text-[11px] text-muted-foreground/80">{sub}</div> : null}
    </div>
  );
}

export function StatsStrip() {
  const { stats } = useStats();
  const { locale, t } = useLocale();

  const releaseDate = stats.release.publishedAt
    ? formatDate(stats.release.publishedAt, locale)
    : t("stats.recent");

  const downloads = stats.totals.downloads;
  const commit = stats.lastCommit;
  const commitAgo = commit
    ? formatDistanceToNowStrict(new Date(commit.date), {
        addSuffix: true,
        locale: locale === "id" ? dateFnsId : enUS,
      })
    : null;

  return (
    <section aria-label={t("a11y.projectStats")} className="relative border-y bg-surface/40">
      {/* Subtle engineering hatch — fades toward the bottom */}
      <div aria-hidden className="pointer-events-none absolute inset-0 bg-hatch opacity-60 [mask-image:linear-gradient(to_bottom,black,transparent)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 divide-y sm:divide-y-0 lg:divide-x divide-border border-x">
          <Cell label={t("stats.latestRelease")} sub={releaseDate} live={stats.source === "github"}>
            <span className="font-mono text-xl sm:text-2xl">{stats.release.tag}</span>
          </Cell>
          <Cell
            label={t("stats.downloads")}
            sub={downloads !== null ? t("stats.viaGithubReleases") : t("stats.countingFromGithub")}
            live={stats.source === "github"}
          >
            {downloads !== null ? (
              <CountUp value={downloads} locale={locale} />
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </Cell>
          <Cell
            label={t("stats.lastCommit")}
            sub={
              commit ? (
                <span className="block truncate" title={commit.message}>
                  <span className="text-primary">{commit.sha.slice(0, 7)}</span> {t("stats.onMain")}
                </span>
              ) : (
                t("stats.fetchingFromGithub")
              )
            }
            live={!!commit}
          >
            {commitAgo ? (
              <span className="font-mono text-lg sm:text-xl">{commitAgo}</span>
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </Cell>
          <Cell label={t("stats.assetTypes")} sub={t("stats.assetTypesList")}>
            5
          </Cell>
          <Cell label={t("stats.license")} sub={t("stats.freeOss")}>
            GPL-3.0
          </Cell>
        </div>
      </div>
    </section>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import { ArrowUpRight, Check, Download, Link2, Tag } from "lucide-react";
import { toast } from "sonner";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { DownloadsChart } from "@/components/site/downloads-chart";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangelog } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { formatDate, formatNumber } from "@/lib/i18n";

async function writeClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }
  // Legacy path for non-secure contexts (http previews, older browsers).
  const area = document.createElement("textarea");
  area.value = text;
  area.setAttribute("readonly", "");
  area.style.position = "fixed";
  area.style.opacity = "0";
  document.body.appendChild(area);
  area.select();
  document.execCommand("copy");
  area.remove();
}

function CopyLinkButton({ url }: { url: string }) {
  const { t } = useLocale();
  const [copied, setCopied] = useState(false);
  const timer = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (timer.current !== null) window.clearTimeout(timer.current);
    };
  }, []);

  const copy = async () => {
    try {
      await writeClipboard(url);
      setCopied(true);
      toast.success(t("changelog.linkCopied"));
      if (timer.current !== null) window.clearTimeout(timer.current);
      timer.current = window.setTimeout(() => setCopied(false), 1600);
    } catch {
      toast.error(t("changelog.copyFailed"));
    }
  };

  return (
    <button
      type="button"
      onClick={copy}
      aria-label={t("a11y.copyReleaseLink")}
      className={
        "group inline-flex items-center gap-1 font-mono text-[11px] transition-colors " +
        (copied ? "text-primary" : "text-muted-foreground hover:text-primary")
      }
    >
      {copied ? <Check className="size-3" aria-hidden /> : <Link2 className="size-3 transition-transform group-hover:-translate-y-px" aria-hidden />}
      {t("changelog.copyLink")}
    </button>
  );
}

export function Changelog() {
  const { releases, isLoading, isFetching } = useChangelog();
  const { locale, t } = useLocale();
  const loading = isLoading || (isFetching && releases.length === 0);

  return (
    <section id="changelog" className="relative py-20 sm:py-28 border-t bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="05"
          eyebrow={t("nav.changelog")}
          title={t("changelog.title")}
          description={t("changelog.description")}
        />

        <Reveal className="mt-12 sm:mt-16">
          <ol className="relative flex flex-col">
            {/* Vertical rail */}
            <div
              aria-hidden
              className="absolute left-[7px] top-3 bottom-3 w-px bg-gradient-to-b from-primary/50 via-border to-transparent"
            />

            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <li key={i} className="relative flex gap-5 pb-8 pl-8">
                    <Skeleton className="absolute left-0 top-1.5 size-[15px] rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-5 w-28" />
                      <Skeleton className="h-4 w-3/4" />
                    </div>
                  </li>
                ))
              : releases.map((release, i) => (
                  <li key={release.tag} className="group/li relative flex gap-5 pb-8 pl-8 last:pb-0">
                    {/* Node */}
                    <span
                      aria-hidden
                      className={
                        i === 0
                          ? "absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-primary bg-primary/25 shadow-[0_0_0_4px_rgba(234,88,12,0.12)] transition-shadow duration-300"
                          : "absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-border bg-background transition-colors duration-300 hover:border-primary/60 group-hover/li:border-primary/60"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="font-mono text-sm font-semibold tracking-tight">
                          {release.tag}
                        </h3>
                        {i === 0 ? (
                          <span className="rounded-full bg-primary/15 border border-primary/40 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                            {t("changelog.latest")}
                          </span>
                        ) : null}
                        {release.publishedAt ? (
                          <span className="font-mono text-[11px] text-muted-foreground">
                            {formatDate(release.publishedAt, locale)}
                          </span>
                        ) : null}
                        {release.downloads > 0 ? (
                          <span className="inline-flex items-center gap-1 font-mono text-[11px] tabular-nums text-muted-foreground/80">
                            <Download className="size-3" aria-hidden />
                            {formatNumber(release.downloads, locale)}
                          </span>
                        ) : null}
                      </div>
                      {release.notes ? (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {release.notes}
                        </p>
                      ) : null}
                      <div className="mt-2.5 flex flex-wrap items-center gap-x-2.5 gap-y-1">
                        <a
                          href={release.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
                        >
                          <Tag className="size-3" />
                          {t("changelog.viewRelease")}
                          <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
                        </a>
                        <span aria-hidden className="font-mono text-[11px] text-muted-foreground/40 select-none">
                          ·
                        </span>
                        <CopyLinkButton url={release.url} />
                      </div>
                    </div>
                  </li>
                ))}
            </ol>
        </Reveal>

        <Reveal delay={0.08}>
          <DownloadsChart />
        </Reveal>
      </div>
    </section>
  );
}

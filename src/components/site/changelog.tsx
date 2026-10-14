"use client";

import { ArrowUpRight, Tag } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Skeleton } from "@/components/ui/skeleton";
import { useChangelog } from "@/hooks/use-site-data";

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

export function Changelog() {
  const { releases, isLoading, isFetching } = useChangelog();
  const loading = isLoading || (isFetching && releases.length === 0);

  return (
    <section id="changelog" className="relative py-20 sm:py-28 border-t bg-surface/30">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="05"
          eyebrow="Changelog"
          title="Release history"
          description="Pulled live from GitHub releases. The Studio plugin ships inside every desktop release, so one download always matches one plugin version."
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
                  <li key={release.tag} className="relative flex gap-5 pb-8 pl-8 last:pb-0">
                    {/* Node */}
                    <span
                      aria-hidden
                      className={
                        i === 0
                          ? "absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-primary bg-primary/25"
                          : "absolute left-0 top-1.5 size-[15px] rounded-full border-2 border-border bg-background"
                      }
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                        <h3 className="font-mono text-sm font-semibold tracking-tight">
                          {release.tag}
                        </h3>
                        {i === 0 ? (
                          <span className="rounded-full bg-primary/15 border border-primary/40 px-2 py-0.5 font-mono text-[9px] font-semibold uppercase tracking-[0.16em] text-primary">
                            Latest
                          </span>
                        ) : null}
                        <span className="font-mono text-[11px] text-muted-foreground">
                          {formatDate(release.publishedAt)}
                        </span>
                      </div>
                      {release.notes ? (
                        <p className="mt-2 max-w-2xl text-sm leading-relaxed text-muted-foreground whitespace-pre-line">
                          {release.notes}
                        </p>
                      ) : null}
                      <a
                        href={release.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group mt-2.5 inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
                      >
                        <Tag className="size-3" />
                        View release
                        <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
                      </a>
                    </div>
                  </li>
                ))}
            </ol>
        </Reveal>
      </div>
    </section>
  );
}

"use client";

import Image from "next/image";
import { ArrowUpRight, GitFork, Users } from "lucide-react";
import { SectionHeading } from "@/components/site/section-heading";
import { Reveal } from "@/components/site/reveal";
import { Button } from "@/components/ui/button";
import { useContributors } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { formatNumber } from "@/lib/i18n";

const REPO = "https://github.com/valency-studio/valencystudio-spoofer";
const CONTRIBUTORS_URL = `${REPO}/graphs/contributors`;
const FORK_URL = `${REPO}/fork`;

export function Contributors() {
  const { contributorsData } = useContributors();
  const { contributors, totalCommits, source } = contributorsData;
  const { locale, t } = useLocale();

  const live = source === "github" && contributors.length > 0;

  return (
    <section id="community" className="relative py-20 sm:py-28">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <SectionHeading
          index="06"
          eyebrow={t("contributors.eyebrow")}
          title={t("contributors.title")}
          description={t("contributors.description")}
        />

        {live ? (
          <>
            <div
              aria-label={t("a11y.contributors")}
              className="mt-12 sm:mt-16 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-4"
            >
              {contributors.map((contributor, i) => (
                <Reveal key={contributor.login} delay={i * 0.04}>
                  <a
                    href={contributor.profileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex h-full flex-col items-center gap-3 rounded-lg border bg-card p-4 card-hover-glow"
                  >
                    <Image
                      src={contributor.avatarUrl}
                      alt={`@${contributor.login} avatar`}
                      width={56}
                      height={56}
                      unoptimized
                      className="size-14 rounded-full ring-1 ring-foreground/10"
                    />
                    <div className="text-center">
                      <p className="font-mono text-sm font-semibold tracking-tight">
                        {contributor.login}
                      </p>
                      <p className="mt-0.5 font-mono text-[11px] tabular-nums text-muted-foreground">
                        {t("contributors.contributions", {
                          count: formatNumber(contributor.contributions, locale),
                        })}
                      </p>
                    </div>
                  </a>
                </Reveal>
              ))}
            </div>

            <Reveal delay={0.08}>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {t("contributors.people", {
                      count: formatNumber(contributors.length, locale),
                    })}
                  </span>
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/60 px-2.5 py-0.5 font-mono text-[10px] tabular-nums text-muted-foreground">
                    {t("contributors.commitsTotal", {
                      count: formatNumber(totalCommits, locale),
                    })}
                  </span>
                </div>
                <a
                  href={CONTRIBUTORS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="group inline-flex items-center gap-1 font-mono text-[11px] text-muted-foreground transition-colors hover:text-primary"
                >
                  {t("contributors.viewAll")}
                  <ArrowUpRight className="size-3 transition-transform group-hover:translate-x-px group-hover:-translate-y-px" />
                </a>
              </div>
            </Reveal>
          </>
        ) : (
          <Reveal className="mt-12 sm:mt-16">
            <div className="rounded-lg border bg-card/50 p-8 text-center">
              <div className="mx-auto flex size-11 items-center justify-center rounded-md border border-primary/30 bg-primary/10 text-primary">
                <Users className="size-5" />
              </div>
              <h3 className="mt-4 font-display text-lg font-semibold tracking-tight">
                {t("contributors.fallbackTitle")}
              </h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-muted-foreground">
                {t("contributors.fallbackBody")}
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
                <Button asChild className="gap-2">
                  <a href={FORK_URL} target="_blank" rel="noopener noreferrer">
                    <GitFork className="size-4" />
                    {t("contributors.becomeOne")}
                  </a>
                </Button>
                <Button asChild variant="outline" className="gap-2">
                  <a
                    href={CONTRIBUTORS_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {t("contributors.viewAll")}
                    <ArrowUpRight className="size-4" />
                  </a>
                </Button>
              </div>
              <p className="mt-5 font-mono text-[11px] text-muted-foreground/70">
                {t("contributors.readmeHint")}
              </p>
            </div>
          </Reveal>
        )}
      </div>
    </section>
  );
}

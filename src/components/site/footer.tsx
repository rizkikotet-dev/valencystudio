"use client";

import Image from "next/image";
import { Braces, Github, MessageCircle, Radio, Rss } from "lucide-react";
import { DISCORD_URL, REPO_URL, RELEASES_URL, useStats } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { formatDate } from "@/lib/i18n";

const RESOURCE_LINKS = [
  { href: REPO_URL, labelKey: "footer.linkRepo" },
  { href: RELEASES_URL, labelKey: "footer.linkReleases" },
  {
    href: `${REPO_URL}/issues/new?template=bug_report.md`,
    labelKey: "footer.linkBug",
  },
  {
    href: `${REPO_URL}/issues/new?template=feature_request.md`,
    labelKey: "footer.linkFeature",
  },
  { href: DISCORD_URL, labelKey: "footer.linkDiscord" },
  { href: "/feed.xml", labelKey: "footer.linkRss", icon: Rss },
  { href: "/feed.json", labelKey: "footer.linkJson", icon: Braces },
] as const;

const SITE_LINKS = [
  { href: "#how-it-works", labelKey: "nav.howItWorks" },
  { href: "#features", labelKey: "nav.features" },
  { href: "#download", labelKey: "nav.download" },
  { href: "#changelog", labelKey: "nav.changelog" },
  { href: "#faq", labelKey: "nav.faq" },
] as const;

export function Footer() {
  const { stats } = useStats();
  const { locale, t } = useLocale();
  const releaseDate = stats.release.publishedAt
    ? formatDate(stats.release.publishedAt, locale)
    : null;

  return (
    <footer className="mt-auto border-t bg-surface/40 pb-[env(safe-area-inset-bottom)]">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-12 sm:py-14">
        <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
          {/* Brand */}
          <div className="flex flex-col gap-4">
            <a href="#top" className="flex items-center gap-2.5">
              <Image
                src="/app-icon.png"
                alt="ValencyStudio — Spoofer icon"
                width={30}
                height={30}
                className="rounded-md ring-1 ring-foreground/10"
              />
              <span className="flex items-baseline gap-2">
                <span className="font-display text-[15px] font-semibold tracking-tight">
                  ValencyStudio
                </span>
                <span className="rounded border border-primary/40 bg-primary/10 px-1.5 py-px font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-primary">
                  Spoofer
                </span>
              </span>
            </a>
            <p className="max-w-sm text-sm leading-relaxed text-muted-foreground">
              {t("footer.description")}
            </p>
            <p className="font-mono text-[11px] text-muted-foreground/70">
              Tauri 2 · Rust · React 19 · Luau
            </p>
            <div className="flex items-center gap-2">
              <a
                href={REPO_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="GitHub"
                className="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                <Github className="size-4" />
              </a>
              <a
                href={DISCORD_URL}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Discord"
                className="flex size-9 items-center justify-center rounded-md border text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
              >
                <MessageCircle className="size-4" />
              </a>
            </div>
          </div>

          {/* Resources */}
          <nav aria-label={t("footer.resources")}>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.resources")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    target={"icon" in link && Boolean(link.icon) ? undefined : "_blank"}
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {"icon" in link && Boolean(link.icon) ? (
                      <link.icon className="size-3.5 text-primary/70" aria-hidden />
                    ) : null}
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Site */}
          <nav aria-label={t("footer.explore")}>
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              {t("footer.explore")}
            </h3>
            <ul className="mt-4 space-y-2.5">
              {SITE_LINKS.map((link) => (
                <li key={link.labelKey}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {t(link.labelKey)}
                  </a>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        {/* Legal */}
        <div className="mt-12 flex flex-col gap-3 border-t pt-6">
          <div className="flex flex-wrap items-center gap-2 font-mono text-[10px] text-muted-foreground/70">
            <Radio className={"size-3 " + (stats.source === "github" ? "text-emerald-500" : "text-muted-foreground/50")} />
            <span>
              {stats.source === "github" ? t("footer.liveFromApi") : t("footer.cachedData")}
              {releaseDate
                ? ` · ${t("footer.releaseMeta", { tag: stats.release.tag, date: releaseDate })}`
                : ""}
            </span>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <p className="font-mono text-[11px] text-muted-foreground/80">
            © 2026 valency-studio · GPL-3.0 ·{" "}
            <a
              href={`${REPO_URL}/blob/main/LICENSE`}
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-2 hover:text-foreground"
            >
              {t("stats.license")}
            </a>
          </p>
          <p className="max-w-md font-mono text-[10px] leading-relaxed text-muted-foreground/60 sm:text-right">
            {t("footer.disclaimer")}
          </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

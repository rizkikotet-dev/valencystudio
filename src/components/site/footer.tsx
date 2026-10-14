"use client";

import Image from "next/image";
import { Github, MessageCircle, Radio } from "lucide-react";
import { DISCORD_URL, REPO_URL, RELEASES_URL, useStats } from "@/hooks/use-site-data";

const RESOURCE_LINKS = [
  { href: REPO_URL, label: "GitHub repository" },
  { href: RELEASES_URL, label: "Releases" },
  {
    href: `${REPO_URL}/issues/new?template=bug_report.md`,
    label: "Report a bug",
  },
  {
    href: `${REPO_URL}/issues/new?template=feature_request.md`,
    label: "Request a feature",
  },
  { href: DISCORD_URL, label: "Discord community" },
];

const SITE_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#download", label: "Download" },
  { href: "#changelog", label: "Changelog" },
  { href: "#faq", label: "FAQ" },
];

export function Footer() {
  const { stats } = useStats();
  const releaseDate = stats.release.publishedAt
    ? new Date(stats.release.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
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
              A desktop asset replacement tool for Roblox Studio. Preview, replace, and push
              assets across an entire place — without manually editing instances.
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
          <nav aria-label="Resources">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Resources
            </h3>
            <ul className="mt-4 space-y-2.5">
              {RESOURCE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          {/* Site */}
          <nav aria-label="Site">
            <h3 className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
              Explore
            </h3>
            <ul className="mt-4 space-y-2.5">
              {SITE_LINKS.map((link) => (
                <li key={link.label}>
                  <a
                    href={link.href}
                    className="text-sm text-muted-foreground transition-colors hover:text-foreground"
                  >
                    {link.label}
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
              {stats.source === "github" ? "Live from GitHub API" : "Serving cached data — refreshes automatically"}
              {releaseDate ? ` · release ${stats.release.tag} · ${releaseDate}` : ""}
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
              License
            </a>
          </p>
          <p className="max-w-md font-mono text-[10px] leading-relaxed text-muted-foreground/60 sm:text-right">
            Not affiliated with or endorsed by Roblox Corporation. “Roblox” and “Roblox Studio”
            are trademarks of Roblox Corporation.
          </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

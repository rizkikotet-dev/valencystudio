"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { motion, useScroll } from "framer-motion";
import {
  Download,
  Github,
  Globe,
  Menu,
  Moon,
  Search,
  Star,
  Sun,
  X,
} from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RELEASES_URL, useStats } from "@/hooks/use-site-data";
import { useLocale } from "@/hooks/use-locale";
import { OPEN_COMMAND_EVENT } from "@/components/site/command-palette";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#how-it-works", labelKey: "nav.howItWorks" },
  { href: "#features", labelKey: "nav.features" },
  { href: "#download", labelKey: "nav.download" },
  { href: "#changelog", labelKey: "nav.changelog" },
  { href: "#faq", labelKey: "nav.faq" },
] as const;

/**
 * Bilingual static aria-label — deliberately NOT translated at runtime so the
 * value is identical during SSR, hydration, and both locales (hydration-safe).
 */
const SWITCH_LANGUAGE_ARIA = "Switch language · Ganti bahasa";

function LocaleSwitcher({ className }: { className?: string }) {
  const { locale, setLocale } = useLocale();

  return (
    <div
      role="group"
      aria-label={SWITCH_LANGUAGE_ARIA}
      className={cn(
        "flex h-9 items-center rounded-md border bg-card/50 p-1",
        className
      )}
    >
      {(["en", "id"] as const).map((l) => {
        const active = locale === l;
        return (
          <button
            key={l}
            type="button"
            aria-pressed={active}
            onClick={() => setLocale(l)}
            className={cn(
              "flex h-full items-center rounded-[5px] px-2.5 font-mono text-[11px] font-medium uppercase tracking-wider transition-colors",
              active
                ? "bg-primary/15 text-primary ring-1 ring-inset ring-primary/40"
                : "text-muted-foreground hover:text-foreground hover:bg-accent"
            )}
          >
            {l}
          </button>
        );
      })}
    </div>
  );
}

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLocale();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label={t("a11y.toggleTheme")}
      onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
      className="size-9 text-muted-foreground hover:text-foreground"
    >
      {/* CSS-driven so SSR and client markup always match */}
      <Sun className="hidden size-4 dark:block" />
      <Moon className="block size-4 dark:hidden" />
    </Button>
  );
}

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);
  const { stats } = useStats();
  const { t } = useLocale();
  const { scrollYProgress } = useScroll();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const openPalette = () => window.dispatchEvent(new CustomEvent(OPEN_COMMAND_EVENT));

  return (
    <>
      {/* Reading progress hairline */}
      <motion.div
        aria-hidden
        style={{ scaleX: scrollYProgress }}
        className="fixed top-0 left-0 right-0 z-[60] h-[2px] origin-left bg-gradient-to-r from-primary/60 via-primary to-primary/60"
      />
      <header
        className={cn(
          "sticky top-0 z-50 border-b transition-all duration-300",
          scrolled
            ? "bg-background/85 backdrop-blur-md border-border"
            : "bg-transparent border-transparent"
        )}
      >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 sm:gap-5 px-4 sm:px-6">
        {/* Brand */}
        <a href="#top" className="flex items-center gap-2.5 shrink-0 group">
          <Image
            src="/app-icon.png"
            alt="ValencyStudio — Spoofer icon"
            width={28}
            height={28}
            className="rounded-md ring-1 ring-foreground/10"
          />
          <span className="flex items-baseline gap-2">
            <span className="font-display text-[15px] font-semibold tracking-tight">
              ValencyStudio
            </span>
            <span className="hidden sm:inline-block rounded border border-primary/40 bg-primary/10 px-1.5 py-px font-mono text-[9px] font-medium uppercase tracking-[0.18em] text-primary">
              Spoofer
            </span>
          </span>
        </a>

        {/* Desktop links */}
        <nav aria-label={t("a11y.primaryNav")} className="ml-2 hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="relative whitespace-nowrap rounded-md px-2.5 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent after:absolute after:inset-x-2.5 after:bottom-1 after:h-px after:origin-left after:scale-x-0 after:bg-primary/70 after:transition-transform after:duration-300 hover:after:scale-x-100"
            >
              {t(link.labelKey)}
            </a>
          ))}
        </nav>

        {/* Command palette trigger (desktop) */}
        <button
          type="button"
          onClick={openPalette}
          aria-label={t("a11y.openPalette")}
          className="hidden xl:flex h-9 items-center gap-2 rounded-md border bg-card/50 px-3 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent hover:border-primary/30 w-40"
        >
          <Search className="size-3.5" />
          <span className="text-[13px]">{t("nav.search")}</span>
          <kbd className="ml-auto rounded border bg-surface px-1.5 font-mono text-[9px]">
            ⌘K
          </kbd>
        </button>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            aria-label={t("footer.linkRepo")}
          >
            <Github className="size-4" />
            <Star className="size-3.5 text-muted-foreground/70" />
            <span className="font-mono text-xs tabular-nums">{stats.github.stars}</span>
          </a>
          <LocaleSwitcher className="hidden sm:flex" />
          <ThemeToggle />
          <Button asChild size="sm" className="h-9 gap-2 font-medium">
            <a href="#download">
              <Download className="size-4" />
              <span className="hidden sm:inline">{t("nav.download")}</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            aria-label={open ? t("a11y.closeMenu") : t("a11y.openMenu")}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-5" /> : <Menu className="size-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile menu */}
      {open ? (
        <nav
          aria-label={t("a11y.mobileNav")}
          className="lg:hidden border-t bg-background/95 backdrop-blur-md"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                openPalette();
              }}
              className="flex items-center gap-2.5 rounded-md px-2 py-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-accent border-b border-border/50"
            >
              <Search className="size-4" />
              {t("nav.searchDots")}
              <kbd className="ml-auto rounded border bg-surface px-1.5 font-mono text-[9px]">
                ⌘K
              </kbd>
            </button>
            {/* Language row */}
            <div className="flex items-center gap-2.5 rounded-md px-2 py-2 border-b border-border/50">
              <Globe className="size-4 text-muted-foreground" />
              <span className="text-[15px] text-muted-foreground">
                Language / Bahasa
              </span>
              <LocaleSwitcher className="ml-auto h-8" />
            </div>
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-accent border-b border-border/50 last:border-0"
              >
                {t(link.labelKey)}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
      </header>
    </>
  );
}

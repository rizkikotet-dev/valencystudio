"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Download, Github, Menu, Moon, Star, Sun, X } from "lucide-react";
import { useTheme } from "next-themes";
import { Button } from "@/components/ui/button";
import { RELEASES_URL, useStats } from "@/hooks/use-site-data";
import { cn } from "@/lib/utils";

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#features", label: "Features" },
  { href: "#download", label: "Download" },
  { href: "#changelog", label: "Changelog" },
  { href: "#faq", label: "FAQ" },
];

function ThemeToggle() {
  const { resolvedTheme, setTheme } = useTheme();

  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Toggle theme"
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

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header
      className={cn(
        "sticky top-0 z-50 border-b transition-all duration-300",
        scrolled
          ? "bg-background/85 backdrop-blur-md border-border"
          : "bg-transparent border-transparent"
      )}
    >
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-6 px-4 sm:px-6">
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
        <nav aria-label="Primary" className="ml-2 hidden lg:flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="rounded-md px-3 py-2 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Right cluster */}
        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:flex h-9 items-center gap-2 rounded-md border px-3 text-sm text-muted-foreground transition-colors hover:text-foreground hover:bg-accent"
            aria-label="GitHub repository"
          >
            <Github className="size-4" />
            <Star className="size-3.5 text-muted-foreground/70" />
            <span className="font-mono text-xs tabular-nums">{stats.github.stars}</span>
          </a>
          <ThemeToggle />
          <Button asChild size="sm" className="h-9 gap-2 font-medium">
            <a href="#download">
              <Download className="size-4" />
              <span className="hidden xs:inline sm:inline">Download</span>
            </a>
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 lg:hidden"
            aria-label={open ? "Close menu" : "Open menu"}
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
          aria-label="Mobile"
          className="lg:hidden border-t bg-background/95 backdrop-blur-md"
        >
          <div className="mx-auto max-w-6xl px-4 sm:px-6 py-3 flex flex-col">
            {NAV_LINKS.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className="rounded-md px-2 py-3 text-[15px] text-muted-foreground hover:text-foreground hover:bg-accent border-b border-border/50 last:border-0"
              >
                {link.label}
              </a>
            ))}
          </div>
        </nav>
      ) : null}
    </header>
  );
}

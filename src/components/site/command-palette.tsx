"use client";

import { useCallback, useEffect, useState } from "react";
import {
  ArrowRight,
  Bug,
  Download,
  Github,
  ListTree,
  MessageCircle,
  MonitorPlay,
  Moon,
  Replace,
  Search,
  Sun,
  Tags,
  HelpCircle,
} from "lucide-react";
import { useTheme } from "next-themes";
import {
  CommandDialog,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "@/components/ui/command";
import { usePlatform } from "@/hooks/use-platform";
import { useLocale } from "@/hooks/use-locale";
import {
  BUG_REPORT_URL,
  DISCORD_URL,
  FEATURE_REQUEST_URL,
  REPO_URL,
  useStats,
  postDownload,
  RELEASES_URL,
} from "@/hooks/use-site-data";

export const OPEN_COMMAND_EVENT = "vs:open-command";

const SECTIONS = [
  { id: "#how-it-works", labelKey: "nav.howItWorks", icon: ListTree },
  { id: "#features", labelKey: "nav.features", icon: MonitorPlay },
  { id: "#comparison", labelKey: "palette.comparison", icon: Replace },
  { id: "#download", labelKey: "nav.download", icon: Download },
  { id: "#changelog", labelKey: "nav.changelog", icon: Tags },
  { id: "#faq", labelKey: "nav.faq", icon: HelpCircle },
] as const;

export function CommandPalette() {
  const [open, setOpen] = useState(false);
  const { resolvedTheme, setTheme } = useTheme();
  const { t } = useLocale();
  const platform = usePlatform();
  const { stats } = useStats();

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    const onOpenEvent = () => setOpen(true);
    document.addEventListener("keydown", onKey);
    window.addEventListener(OPEN_COMMAND_EVENT, onOpenEvent);
    return () => {
      document.removeEventListener("keydown", onKey);
      window.removeEventListener(OPEN_COMMAND_EVENT, onOpenEvent);
    };
  }, []);

  const run = useCallback((fn: () => void) => {
    setOpen(false);
    // Let the dialog unmount before scrolling/opening targets.
    window.setTimeout(fn, 60);
  }, []);

  const goTo = useCallback(
    (id: string) => {
      run(() => {
        document.querySelector(id)?.scrollIntoView({ behavior: "smooth" });
        window.history.replaceState(null, "", id);
      });
    },
    [run]
  );

  const download = useCallback(() => {
    const asset = platform
      ? stats.release.assets.find((a) => a.platform === platform)
      : undefined;
    const href = asset?.url ?? RELEASES_URL;
    if (platform) void postDownload(platform);
    run(() => window.open(href, "_blank", "noopener,noreferrer"));
  }, [platform, stats.release.assets, run]);

  const platformLabel =
    platform === "macos"
      ? "macOS"
      : platform
        ? platform[0].toUpperCase() + platform.slice(1)
        : null;

  const downloadLabel = t("hero.downloadFor", {
    platform: platformLabel ?? t("palette.yourPlatform"),
  });

  const themeItemLabel = t("palette.switchTheme", {
    theme: resolvedTheme === "dark" ? t("palette.themeLight") : t("palette.themeDark"),
  });

  return (
    <CommandDialog
      open={open}
      onOpenChange={setOpen}
      title="ValencyStudio — Spoofer"
      description={t("palette.description")}
      className="sm:max-w-xl"
    >
      <CommandInput placeholder={t("palette.placeholder")} />
      <CommandList>
        <CommandEmpty>{t("palette.noResults")}</CommandEmpty>
        <CommandGroup heading={t("palette.navigate")}>
          {SECTIONS.map((section) => (
            <CommandItem
              key={section.id}
              value={t(section.labelKey)}
              onSelect={() => goTo(section.id)}
            >
              <section.icon className="text-muted-foreground" />
              <span>{t(section.labelKey)}</span>
              <ArrowRight className="ml-auto text-muted-foreground/50" />
            </CommandItem>
          ))}
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("palette.actions")}>
          <CommandItem
            value={downloadLabel}
            onSelect={download}
          >
            <Download className="text-muted-foreground" />
            <span>{downloadLabel}</span>
            <span className="ml-auto font-mono text-[10px] text-muted-foreground/60">
              {stats.release.tag}
            </span>
          </CommandItem>
          <CommandItem
            value={t("cta.starOnGithub")}
            onSelect={() =>
              run(() => window.open(REPO_URL, "_blank", "noopener,noreferrer"))
            }
          >
            <Github className="text-muted-foreground" />
            <span>{t("cta.starOnGithub")}</span>
          </CommandItem>
          <CommandItem
            value={t("cta.joinDiscord")}
            onSelect={() =>
              run(() => window.open(DISCORD_URL, "_blank", "noopener,noreferrer"))
            }
          >
            <MessageCircle className="text-muted-foreground" />
            <span>{t("cta.joinDiscord")}</span>
          </CommandItem>
          <CommandItem
            value={t("footer.linkBug")}
            onSelect={() =>
              run(() => window.open(BUG_REPORT_URL, "_blank", "noopener,noreferrer"))
            }
          >
            <Bug className="text-muted-foreground" />
            <span>{t("footer.linkBug")}</span>
          </CommandItem>
          <CommandItem
            value={t("footer.linkFeature")}
            onSelect={() =>
              run(() =>
                window.open(FEATURE_REQUEST_URL, "_blank", "noopener,noreferrer")
              )
            }
          >
            <ArrowRight className="text-muted-foreground" />
            <span>{t("footer.linkFeature")}</span>
          </CommandItem>
        </CommandGroup>
        <CommandSeparator />
        <CommandGroup heading={t("palette.preferences")}>
          <CommandItem
            value={themeItemLabel}
            onSelect={() => run(() => setTheme(resolvedTheme === "dark" ? "light" : "dark"))}
          >
            {resolvedTheme === "dark" ? (
              <Sun className="text-muted-foreground" />
            ) : (
              <Moon className="text-muted-foreground" />
            )}
            <span>{themeItemLabel}</span>
          </CommandItem>
        </CommandGroup>
      </CommandList>
      <div className="flex items-center gap-4 border-t bg-surface/50 px-4 py-2.5 font-mono text-[10px] text-muted-foreground/80">
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border bg-background px-1.5 py-0.5">↑↓</kbd> {t("palette.hintNavigate")}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border bg-background px-1.5 py-0.5">↵</kbd> {t("palette.hintSelect")}
        </span>
        <span className="flex items-center gap-1.5">
          <kbd className="rounded border bg-background px-1.5 py-0.5">esc</kbd> {t("palette.hintClose")}
        </span>
        <span className="ml-auto flex items-center gap-1 text-primary/80">
          <Search className="size-3" />
          vs-spoofer
        </span>
      </div>
    </CommandDialog>
  );
}

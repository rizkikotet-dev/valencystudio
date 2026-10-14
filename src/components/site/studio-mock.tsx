"use client";

import { useEffect, useState } from "react";
import {
  Box,
  Clapperboard,
  FolderOpen,
  Image as ImageIcon,
  PersonStanding,
  RefreshCw,
  ScanLine,
  Search,
  Volume2,
} from "lucide-react";
import { useLocale } from "@/hooks/use-locale";
import { useStats } from "@/hooks/use-site-data";
import { formatNumber } from "@/lib/i18n";
import { cn } from "@/lib/utils";

/* ------------------------------------------------------------------ */
/* Data for the mock UI                                                */
/* ------------------------------------------------------------------ */

type AssetType = "Animation" | "Sound" | "Decal" | "Mesh" | "Video";

const TYPE_ICON: Record<AssetType, React.ComponentType<{ className?: string }>> = {
  Animation: PersonStanding,
  Sound: Volume2,
  Decal: ImageIcon,
  Mesh: Box,
  Video: Clapperboard,
};

const TYPE_KEY: Record<AssetType, string> = {
  Animation: "type.animation",
  Sound: "type.sound",
  Decal: "type.decal",
  Mesh: "type.mesh",
  Video: "type.video",
};

interface QueueRow {
  type: AssetType;
  current: string;
  next: string;
  status: "Applied" | "Queued" | "Pending";
}

const QUEUE: QueueRow[] = [
  { type: "Animation", current: "9120344712", next: "11830248103", status: "Applied" },
  { type: "Sound", current: "1846203321", next: "19054438521", status: "Applied" },
  { type: "Decal", current: "7712904450", next: "14410203922", status: "Queued" },
  { type: "Mesh", current: "5591023834", next: "99034187233", status: "Pending" },
  { type: "Video", current: "6619042310", next: "11092834710", status: "Queued" },
  { type: "Animation", current: "3301927481", next: "14020559912", status: "Applied" },
];

const STATUS_KEY: Record<QueueRow["status"], string> = {
  Applied: "mock.statusApplied",
  Queued: "mock.statusQueued",
  Pending: "mock.statusPending",
};

interface TreeNode {
  name: string;
  type?: AssetType;
  children?: TreeNode[];
}

const TREE: TreeNode[] = [
  {
    name: "Workspace",
    children: [
      {
        name: "Lobby",
        children: [
          { name: "AmbientLoop", type: "Sound" },
          { name: "BillboardDecal", type: "Decal" },
        ],
      },
      {
        name: "NPCs",
        children: [
          { name: "Guard_Walk", type: "Animation" },
          { name: "Guard_Idle", type: "Animation" },
        ],
      },
      {
        name: "Props",
        children: [
          { name: "Crate_Mesh", type: "Mesh" },
          { name: "Screen_Video", type: "Video" },
        ],
      },
    ],
  },
];

const STATUS_STYLE: Record<QueueRow["status"], string> = {
  Applied: "text-emerald-500 dark:text-emerald-400",
  Queued: "text-primary",
  Pending: "text-muted-foreground",
};

function TypeIcon({ type, className }: { type: AssetType; className?: string }) {
  const Icon = TYPE_ICON[type];
  return <Icon className={className} />;
}

function TreeBranch({ nodes, depth = 0 }: { nodes: TreeNode[]; depth?: number }) {
  const [openRoot, setOpenRoot] = useState(true);
  const { t } = useLocale();

  return (
    <ul className={cn("space-y-0.5", depth === 0 && "space-y-1")}>
      {nodes.map((node) => {
        const isFolder = !!node.children;
        const isRootOpen = openRoot;
        return (
          <li key={node.name}>
            <div
              className={cn(
                "flex items-center gap-1.5 rounded-sm px-1.5 py-[3px] font-mono text-[11px] leading-none",
                isFolder
                  ? "text-foreground/80"
                  : "text-muted-foreground hover:text-foreground"
              )}
              style={{ paddingLeft: `${depth * 12 + 6}px` }}
            >
              {isFolder ? (
                <>
                  {depth === 0 ? (
                    <button
                      type="button"
                      aria-label={t("a11y.toggleNode", { name: node.name })}
                      onClick={() => setOpenRoot((v) => !v)}
                      className="shrink-0 text-muted-foreground/60 hover:text-foreground"
                      tabIndex={-1}
                    >
                      <FolderOpen
                        className={cn(
                          "size-3 transition-transform",
                          !isRootOpen && "-rotate-90"
                        )}
                      />
                    </button>
                  ) : (
                    <FolderOpen className="size-3 shrink-0 opacity-60" />
                  )}
                  <span>{node.name}</span>
                </>
              ) : (
                <>
                  <span className="w-3 shrink-0" />
                  <TypeIcon type={node.type as AssetType} className="size-3 shrink-0 opacity-70" />
                  <span className="truncate">{node.name}</span>
                  <span className="ml-auto shrink-0 text-[9px] uppercase tracking-wider opacity-50">
                    {t(TYPE_KEY[node.type as AssetType])}
                  </span>
                </>
              )}
            </div>
            {node.children && (depth > 0 || isRootOpen) ? (
              <TreeBranch nodes={node.children} depth={depth + 1} />
            ) : null}
          </li>
        );
      })}
    </ul>
  );
}

/* ------------------------------------------------------------------ */
/* The mock window                                                     */
/* ------------------------------------------------------------------ */

export function StudioMock() {
  const [activeRow, setActiveRow] = useState(0);
  const [scanned, setScanned] = useState(1240);
  const { locale, t } = useLocale();
  const { stats } = useStats();

  // Cycle the "scanning" highlight through the queue rows.
  useEffect(() => {
    const id = window.setInterval(() => {
      setActiveRow((i) => (i + 1) % QUEUE.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, []);

  // Slowly tick the instance counter up, then reset — feels alive.
  useEffect(() => {
    const id = window.setInterval(() => {
      setScanned((n) => (n >= 1284 ? 1240 : n + 4));
    }, 480);
    return () => window.clearInterval(id);
  }, []);

  return (
    <div className="relative">
      {/* Ambient glow behind the window */}
      <div
        aria-hidden
        className="absolute -inset-x-8 -top-10 -bottom-14 bg-primary/15 blur-3xl rounded-full pointer-events-none"
      />

      <div className="relative rounded-xl border bg-card shadow-[0_24px_80px_-24px_rgba(0,0,0,0.55)] overflow-hidden ring-1 ring-foreground/5">
        {/* Title bar */}
        <div className="flex items-center gap-3 border-b bg-surface px-4 py-2.5">
          <div className="flex items-center gap-1.5" aria-hidden>
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-foreground/15" />
            <span className="size-2.5 rounded-full bg-primary/70" />
          </div>
          <div className="flex-1 text-center font-mono text-[11px] text-muted-foreground truncate">
            ValencyStudio — Spoofer <span className="opacity-50">· {stats.release.tag}</span>
          </div>
          <div className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[10px] tracking-wider">
            <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" />
            <span className="text-emerald-600 dark:text-emerald-400">{t("mock.studioConnected")}</span>
          </div>
        </div>

        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-2 border-b bg-background/60 px-4 py-2.5">
          <div className="flex min-w-40 flex-1 items-center gap-2 rounded-md border bg-card px-2.5 py-1.5 text-muted-foreground">
            <Search className="size-3.5 shrink-0" />
            <span className="font-mono text-[11px]">{t("mock.searchAssets")}</span>
            <kbd className="ml-auto hidden sm:block rounded border bg-surface px-1.5 font-mono text-[9px] text-muted-foreground">
              Ctrl K
            </kbd>
          </div>
          <span className="flex items-center gap-1.5 rounded-md bg-primary px-3 py-1.5 font-mono text-[11px] font-medium text-primary-foreground">
            <ScanLine className="size-3.5" />
            {t("mock.scanPlace")}
          </span>
          <span className="flex items-center gap-1.5 rounded-md border px-3 py-1.5 font-mono text-[11px] text-foreground/80">
            <RefreshCw className="size-3.5" />
            {t("mock.replaceAll")}
          </span>
        </div>

        {/* Body: tree + queue */}
        <div className="grid grid-cols-1 md:grid-cols-[220px_1fr]">
          {/* Asset tree */}
          <div className="hidden md:block border-r bg-surface/60 py-3 min-h-[280px]">
            <div className="px-3 pb-2 font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("mock.placeBrowser")}
            </div>
            <TreeBranch nodes={TREE} />
          </div>

          {/* Replacement queue */}
          <div className="relative overflow-hidden">
            {/* sweeping scan line */}
            <div
              aria-hidden
              className="absolute left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-primary/60 to-transparent animate-scan-line pointer-events-none z-10"
            />
            <div className="grid grid-cols-[74px_1fr_1fr_84px] gap-2 border-b bg-surface/40 px-4 py-2 font-mono text-[9.5px] uppercase tracking-[0.14em] text-muted-foreground">
              <span>{t("mock.type")}</span>
              <span>{t("mock.currentId")}</span>
              <span className="hidden sm:block">{t("mock.newId")}</span>
              <span className="text-right">{t("mock.status")}</span>
            </div>
            <ul className="py-1">
              {QUEUE.map((row, i) => (
                <li
                  key={row.current}
                  className={cn(
                    "grid grid-cols-[74px_1fr_1fr_84px] items-center gap-2 px-4 py-2 font-mono text-[11px] transition-colors duration-300",
                    i === activeRow && "bg-primary/10"
                  )}
                >
                  <span className="flex items-center gap-1.5 text-foreground/85">
                    <TypeIcon
                      type={row.type}
                      className={cn("size-3.5", i === activeRow ? "text-primary" : "opacity-60")}
                    />
                    <span className="hidden xl:inline text-[10px] text-muted-foreground">
                      {t(TYPE_KEY[row.type])}
                    </span>
                  </span>
                  <span className="text-muted-foreground truncate">
                    <span className="opacity-40">rbxassetid://</span>
                    {row.current}
                  </span>
                  <span className="hidden sm:flex items-center gap-1.5 truncate text-foreground/90">
                    <span aria-hidden className="text-primary">→</span>
                    <span className="truncate">
                      <span className="opacity-40">rbxassetid://</span>
                      {row.next}
                    </span>
                  </span>
                  <span
                    className={cn(
                      "text-right text-[10px] uppercase tracking-wider",
                      STATUS_STYLE[row.status]
                    )}
                  >
                    {t(STATUS_KEY[row.status])}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Status bar */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t bg-surface px-4 py-2 font-mono text-[10px] text-muted-foreground">
          <span className="tabular-nums">
            {t("mock.instancesScanned", { count: formatNumber(scanned, locale) })}
          </span>
          <span className="opacity-40" aria-hidden>
            ·
          </span>
          <span>{t("mock.assetsMatched", { count: 96 })}</span>
          <span className="opacity-40" aria-hidden>
            ·
          </span>
          <span>{t("mock.scanTook", { time: "2.3s" })}</span>
          <span className="ml-auto hidden sm:flex items-center gap-1.5">
            <span className="size-1.5 rounded-full bg-primary animate-pulse-dot" />
            {t("mock.bridgeActive")}
          </span>
        </div>
      </div>
    </div>
  );
}

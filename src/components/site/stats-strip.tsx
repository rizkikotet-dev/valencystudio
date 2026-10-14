"use client";

import { useEffect, useRef } from "react";
import { animate } from "framer-motion";
import { useStats } from "@/hooks/use-site-data";
import { cn } from "@/lib/utils";

function CountUp({ value }: { value: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const prev = useRef(0);

  useEffect(() => {
    const node = ref.current;
    if (!node) return;
    const controls = animate(prev.current, value, {
      duration: 0.9,
      ease: "easeOut",
      onUpdate: (v) => {
        node.textContent = Math.round(v).toLocaleString("en-US");
      },
    });
    prev.current = value;
    return () => controls.stop();
  }, [value]);

  return <span ref={ref} className="tabular-nums">{value.toLocaleString("en-US")}</span>;
}

interface CellProps {
  label: string;
  children: React.ReactNode;
  sub?: string;
  live?: boolean;
  className?: string;
}

function Cell({ label, children, sub, live, className }: CellProps) {
  return (
    <div className={cn("relative flex flex-col gap-1.5 px-6 py-7 sm:px-8", className)}>
      <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
        {live ? (
          <span className="size-1.5 rounded-full bg-emerald-500 animate-pulse-dot" title="Live from GitHub API" />
        ) : null}
      </div>
      <div className="font-display text-2xl sm:text-3xl font-semibold tracking-tight">{children}</div>
      {sub ? <div className="font-mono text-[11px] text-muted-foreground/80">{sub}</div> : null}
    </div>
  );
}

export function StatsStrip() {
  const { stats } = useStats();

  const releaseDate = stats.release.publishedAt
    ? new Date(stats.release.publishedAt).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "recent";

  const downloads = stats.totals.downloads;

  return (
    <section aria-label="Project stats" className="relative border-y bg-surface/40">
      <div className="mx-auto max-w-6xl px-4 sm:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 lg:divide-x divide-border border-x">
          <Cell label="Latest release" sub={releaseDate} live={stats.source === "github"}>
            <span className="font-mono text-xl sm:text-2xl">{stats.release.tag}</span>
          </Cell>
          <Cell
            label="Downloads"
            sub={downloads !== null ? "via GitHub releases" : "counting from GitHub…"}
            live={stats.source === "github"}
          >
            {downloads !== null ? (
              <CountUp value={downloads} />
            ) : (
              <span className="text-muted-foreground/50">—</span>
            )}
          </Cell>
          <Cell label="Asset types" sub="Animations · Sounds · Decals · Meshes · Videos">
            5
          </Cell>
          <Cell label="License" sub="Free and open source">
            GPL-3.0
          </Cell>
        </div>
      </div>
    </section>
  );
}

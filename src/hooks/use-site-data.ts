"use client";

import { useQuery } from "@tanstack/react-query";

/* ------------------------------------------------------------------ */
/* Types (mirror the API contract — see worklog.md)                    */
/* ------------------------------------------------------------------ */

export type Platform = "windows" | "macos" | "linux";

export interface ReleaseAsset {
  platform: Platform;
  name: string;
  url: string;
  downloads: number;
}

export interface StatsResponse {
  github: { stars: number; forks: number; watchers: number; openIssues: number };
  release: {
    tag: string;
    name: string;
    publishedAt: string | null;
    url: string;
    assets: ReleaseAsset[];
  };
  totals: { downloads: number | null };
  lastCommit: { sha: string; date: string; message: string } | null;
  site: { downloadClicks: number; subscribers: number };
  source: "github" | "fallback";
}

export interface ChangelogRelease {
  tag: string;
  name: string;
  publishedAt: string | null;
  url: string;
  notes: string;
}

export interface ChangelogResponse {
  releases: ChangelogRelease[];
  source: "github" | "fallback";
}

/* ------------------------------------------------------------------ */
/* Fallback data (used until the API responds / if it fails)           */
/* ------------------------------------------------------------------ */

export const REPO_URL = "https://github.com/valency-studio/valencystudio-spoofer";
export const RELEASES_URL = `${REPO_URL}/releases/latest`;
export const DISCORD_URL = "https://discord.gg/6RHuXU9DCv";
export const BUG_REPORT_URL = `${REPO_URL}/issues/new?template=bug_report.md`;
export const FEATURE_REQUEST_URL = `${REPO_URL}/issues/new?template=feature_request.md`;

export const FALLBACK_STATS: StatsResponse = {
  github: { stars: 1, forks: 0, watchers: 1, openIssues: 0 },
  release: {
    tag: "v3.0.2",
    name: "ValencyStudio - Spoofer v3.0.2",
    publishedAt: "2026-10-13T15:45:26Z",
    url: `${REPO_URL}/releases/tag/v3.0.2`,
    assets: [
      {
        platform: "windows",
        name: "ValencyStudio - Spoofer_3.0.2_x64-setup.exe",
        url: RELEASES_URL,
        downloads: 0,
      },
      {
        platform: "macos",
        name: "ValencyStudio - Spoofer_3.0.2_x64.dmg",
        url: RELEASES_URL,
        downloads: 0,
      },
      {
        platform: "linux",
        name: "ValencyStudio - Spoofer_3.0.2_amd64.AppImage",
        url: RELEASES_URL,
        downloads: 0,
      },
    ],
  },
  totals: { downloads: null },
  lastCommit: null,
  site: { downloadClicks: 0, subscribers: 0 },
  source: "fallback",
};

export const FALLBACK_CHANGELOG: ChangelogResponse = {
  releases: [
    {
      tag: "v3.0.2",
      name: "ValencyStudio - Spoofer v3.0.2",
      publishedAt: "2026-10-13",
      url: `${REPO_URL}/releases/tag/v3.0.2`,
      notes: "See the release page for the full changelog.",
    },
    {
      tag: "v3.0.1",
      name: "ValencyStudio - Spoofer v3.0.1",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v3.0.1`,
      notes: "See the release page for the full changelog.",
    },
    {
      tag: "v2.5.0",
      name: "ValencyStudio - Spoofer v2.5.0",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v2.5.0`,
      notes: "See the release page for the full changelog.",
    },
    {
      tag: "v2.4.0",
      name: "ValencyStudio - Spoofer v2.4.0",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v2.4.0`,
      notes: "See the release page for the full changelog.",
    },
  ],
  source: "fallback",
};

/* ------------------------------------------------------------------ */
/* Query hooks                                                         */
/* ------------------------------------------------------------------ */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Request failed: ${res.status}`);
  return res.json() as Promise<T>;
}

export function useStats() {
  const query = useQuery<StatsResponse>({
    queryKey: ["stats"],
    queryFn: () => fetchJson<StatsResponse>("/api/stats"),
    refetchInterval: 60_000,
  });
  return { ...query, stats: query.data ?? FALLBACK_STATS };
}

export function useChangelog() {
  const query = useQuery<ChangelogResponse>({
    queryKey: ["changelog"],
    queryFn: () => fetchJson<ChangelogResponse>("/api/changelog"),
    refetchInterval: 120_000,
  });
  return { ...query, releases: query.data?.releases ?? FALLBACK_CHANGELOG.releases };
}

export async function postSubscribe(
  email: string
): Promise<{ ok: boolean; subscribers?: number; error?: string }> {
  try {
    const res = await fetch("/api/subscribe", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
    const data = (await res.json()) as {
      ok: boolean;
      subscribers?: number;
      error?: string;
    };
    return data;
  } catch {
    return { ok: false, error: "Network error. Please try again." };
  }
}

export async function postDownload(platform: Platform): Promise<boolean> {
  try {
    const res = await fetch("/api/downloads", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ platform }),
    });
    return res.ok;
  } catch {
    return false;
  }
}

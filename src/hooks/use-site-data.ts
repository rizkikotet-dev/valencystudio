"use client";

import { useQuery } from "@tanstack/react-query";
import type { ContributorsResult } from "@/lib/github";

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

/** Installer asset in a changelog release (mirrors the API contract). */
export interface ChangelogAsset {
  platform: Platform;
  name: string;
  url: string;
  /** File size in bytes (0 when unknown — e.g. fallback data). */
  size: number;
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
  downloads: number;
  /** Per-platform asset breakdown (installers only). Absent on fallback data. */
  platforms?: { windows: number; macos: number; linux: number };
  /** Installer assets with size (bytes) for direct downloads. Absent on older cached shapes. */
  assets?: ChangelogAsset[];
}

export interface ChangelogResponse {
  releases: ChangelogRelease[];
  source: "github" | "fallback";
  /** True when served from the client-side last-good cache during a GitHub rate-limit window. */
  stale?: boolean;
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
      downloads: 0,
      assets: [
        {
          platform: "windows",
          name: "ValencyStudio - Spoofer_3.0.2_x64-setup.exe",
          url: RELEASES_URL,
          size: 0,
          downloads: 0,
        },
        {
          platform: "macos",
          name: "ValencyStudio - Spoofer_3.0.2_x64.dmg",
          url: RELEASES_URL,
          size: 0,
          downloads: 0,
        },
        {
          platform: "linux",
          name: "ValencyStudio - Spoofer_3.0.2_amd64.AppImage",
          url: RELEASES_URL,
          size: 0,
          downloads: 0,
        },
      ],
    },
    {
      tag: "v3.0.1",
      name: "ValencyStudio - Spoofer v3.0.1",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v3.0.1`,
      notes: "See the release page for the full changelog.",
      downloads: 0,
      assets: [],
    },
    {
      tag: "v2.5.0",
      name: "ValencyStudio - Spoofer v2.5.0",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v2.5.0`,
      notes: "See the release page for the full changelog.",
      downloads: 0,
      assets: [],
    },
    {
      tag: "v2.4.0",
      name: "ValencyStudio - Spoofer v2.4.0",
      publishedAt: null,
      url: `${REPO_URL}/releases/tag/v2.4.0`,
      notes: "See the release page for the full changelog.",
      downloads: 0,
      assets: [],
    },
  ],
  source: "fallback",
};

export const FALLBACK_CONTRIBUTORS: ContributorsResult = {
  contributors: [],
  totalCommits: 0,
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

export function useContributors() {
  const query = useQuery<ContributorsResult>({
    queryKey: ["contributors"],
    queryFn: () => fetchJson<ContributorsResult>("/api/contributors"),
    refetchInterval: 300_000,
  });
  return { ...query, contributorsData: query.data ?? FALLBACK_CONTRIBUTORS };
}

export function useChangelog() {
  const query = useQuery<ChangelogResponse>({
    queryKey: ["changelog"],
    queryFn: fetchChangelog,
    refetchInterval: 120_000,
  });
  return {
    ...query,
    releases: query.data?.releases ?? FALLBACK_CHANGELOG.releases,
    stale: query.data?.stale ?? false,
  };
}

/*
 * Release history is immutable historical data, so the last good live
 * response is persisted client-side. During GitHub rate-limit windows the
 * site keeps showing the synced releases (flagged `stale`) instead of
 * dropping the downloads chart until the window resets.
 */
const CHANGELOG_CACHE_KEY = "vs-changelog-cache";
const CHANGELOG_CACHE_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

function readChangelogCache(): ChangelogResponse | null {
  try {
    const raw = window.localStorage.getItem(CHANGELOG_CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { fetchedAt: number; releases: ChangelogRelease[] };
    if (
      typeof parsed?.fetchedAt !== "number" ||
      !Array.isArray(parsed?.releases) ||
      Date.now() - parsed.fetchedAt > CHANGELOG_CACHE_MAX_AGE_MS ||
      !parsed.releases.some((r) => (r?.downloads ?? 0) > 0)
    ) {
      return null;
    }
    return { releases: parsed.releases, source: "github", stale: true };
  } catch {
    return null;
  }
}

async function fetchChangelog(): Promise<ChangelogResponse> {
  try {
    const res = await fetch("/api/changelog");
    if (res.ok) {
      const data = (await res.json()) as ChangelogResponse;
      if (data.source === "github" && data.releases.length > 0) {
        try {
          window.localStorage.setItem(
            CHANGELOG_CACHE_KEY,
            JSON.stringify({ fetchedAt: Date.now(), releases: data.releases })
          );
        } catch {
          /* storage unavailable — live data still renders */
        }
        return data;
      }
    }
  } catch {
    /* network error — fall through to cache/fallback */
  }
  return readChangelogCache() ?? FALLBACK_CHANGELOG;
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

/**
 * Server-only GitHub client for the ValencyStudio - Spoofer repository.
 *
 * - Simple module-level in-memory cache (Map + expiry timestamps, 10 min TTL).
 * - Every exported function is fail-safe: on network / rate-limit / parse
 *   errors it returns hardcoded fallback data instead of throwing.
 */

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type DataSource = "github" | "fallback";

export type AssetPlatform = "windows" | "macos" | "linux";

export interface RepoStats {
  stars: number;
  forks: number;
  watchers: number;
  openIssues: number;
  source: DataSource;
}

export interface ReleaseAsset {
  platform: AssetPlatform;
  name: string;
  url: string;
  downloads: number;
}

export interface ReleaseInfo {
  tag: string;
  name: string;
  publishedAt: string | null;
  url: string;
  assets: ReleaseAsset[];
  source: DataSource;
}

export interface ChangelogRelease {
  tag: string;
  name: string;
  publishedAt: string | null;
  url: string;
  notes: string;
}

export interface ReleasesResult {
  releases: ChangelogRelease[];
  source: DataSource;
}

/** Raw GitHub API shapes (only the fields we consume). */
interface GhRepo {
  stargazers_count?: number;
  forks_count?: number;
  watchers_count?: number;
  subscribers_count?: number;
  open_issues_count?: number;
}

interface GhAsset {
  name?: string;
  browser_download_url?: string;
  download_count?: number;
}

interface GhRelease {
  tag_name?: string;
  name?: string | null;
  published_at?: string | null;
  html_url?: string;
  body?: string | null;
  draft?: boolean;
  prerelease?: boolean;
  assets?: GhAsset[];
}

/* ------------------------------------------------------------------ */
/* Constants & fallback data                                           */
/* ------------------------------------------------------------------ */

const OWNER = "valency-studio";
const REPO = "valencystudio-spoofer";
const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
const RELEASES_PAGE_URL = `https://github.com/${OWNER}/${REPO}/releases`;

const CACHE_TTL_MS = 10 * 60 * 1000; // 10 minutes
const REQUEST_TIMEOUT_MS = 8000; // 8 seconds
const NOTES_MAX_LENGTH = 400;

const FALLBACK_TAG = "v3.0.2";
const FALLBACK_NAME = "ValencyStudio - Spoofer v3.0.2";
const FALLBACK_RELEASE_URL = `https://github.com/${OWNER}/${REPO}/releases/tag/${FALLBACK_TAG}`;
const FALLBACK_LATEST_URL = `https://github.com/${OWNER}/${REPO}/releases/latest`;
const FALLBACK_PUBLISHED_AT: string | null = null;

const FALLBACK_STATS = {
  stars: 1,
  forks: 0,
  watchers: 1,
  openIssues: 0,
} as const;

const FALLBACK_ASSETS: ReleaseAsset[] = [
  {
    platform: "windows",
    name: "ValencyStudio - Spoofer_3.0.2_x64-setup.exe",
    url: FALLBACK_LATEST_URL,
    downloads: 0,
  },
  {
    platform: "macos",
    name: "ValencyStudio - Spoofer_3.0.2_x64.dmg",
    url: FALLBACK_LATEST_URL,
    downloads: 0,
  },
  {
    platform: "linux",
    name: "ValencyStudio - Spoofer_3.0.2_amd64.AppImage",
    url: FALLBACK_LATEST_URL,
    downloads: 0,
  },
];

/* ------------------------------------------------------------------ */
/* In-memory cache                                                     */
/* ------------------------------------------------------------------ */

interface CacheEntry {
  value: unknown;
  expiresAt: number;
}

const cache = new Map<string, CacheEntry>();

function getCached<T>(key: string): T | null {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(key);
    return null;
  }
  return entry.value as T;
}

function setCached<T>(key: string, value: T): void {
  cache.set(key, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

const CACHE_KEYS = {
  repoStats: "repo-stats",
  latestRelease: "latest-release",
  releases: "releases",
  totalDownloads: "total-downloads",
} as const;

/* ------------------------------------------------------------------ */
/* Low-level fetch helper                                              */
/* ------------------------------------------------------------------ */

async function ghFetch<T>(path: string): Promise<T> {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    // GitHub requires a User-Agent on all API requests.
    "User-Agent": "valencystudio-spoofer-launch-site/1.0",
    "X-GitHub-Api-Version": "2022-11-28",
  };

  // Optional: raise the rate limit if a token is available in the env.
  if (process.env.GITHUB_TOKEN) {
    headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  }

  const res = await fetch(`${API_BASE}${path}`, {
    headers,
    cache: "no-store",
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
  });

  if (!res.ok) {
    throw new Error(`GitHub API responded ${res.status} for ${path}`);
  }

  return (await res.json()) as T;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */

/** Classify a release asset filename into a supported platform. */
function classifyAsset(name: string): AssetPlatform | null {
  const lower = name.toLowerCase();
  if (lower.endsWith(".exe")) return "windows";
  if (lower.endsWith(".dmg")) return "macos";
  if (lower.endsWith(".appimage")) return "linux";
  // Ignore everything else (.rbxmx, .zip, checksums, source archives, ...).
  return null;
}

function mapAssets(assets: GhAsset[] | undefined): ReleaseAsset[] {
  if (!Array.isArray(assets)) return [];
  const mapped: ReleaseAsset[] = [];
  for (const asset of assets) {
    const name = asset.name ?? "";
    const platform = classifyAsset(name);
    if (!platform) continue;
    mapped.push({
      platform,
      name,
      url: asset.browser_download_url ?? RELEASES_PAGE_URL,
      downloads: typeof asset.download_count === "number" ? asset.download_count : 0,
    });
  }
  return mapped;
}

/**
 * Strip GitHub-flavored markdown down to plain text:
 * removes images, link syntax (keeping the label), heading hashes,
 * backticks, emphasis markers and `>` quote markers, then collapses
 * all whitespace runs into single spaces.
 */
export function stripMarkdownToPlainText(markdown: string): string {
  if (!markdown) return "";
  return markdown
    .replace(/<!--[\s\S]*?-->/g, " ") // HTML comments
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ") // images → removed entirely
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1") // [label](url) → label
    .replace(/^[ \t]{0,3}#{1,6}[ \t]+/gm, "") // heading hashes
    .replace(/^[ \t]{0,3}>[ \t]?/gm, "") // blockquote markers
    .replace(/`{1,3}([^`]*)`{1,3}/g, "$1") // backticks (keep content)
    .replace(/(\*\*|__)(.*?)\1/g, "$2") // bold
    .replace(/(\*|_)([^*_\n]+)\1/g, "$2") // italic
    .replace(/<[^>]+>/g, " ") // stray HTML tags
    .replace(/\s+/g, " ") // collapse all whitespace
    .trim();
}

/** Cap notes at ~400 characters, breaking on the cap with an ellipsis. */
function capNotes(text: string): string {
  if (text.length <= NOTES_MAX_LENGTH) return text;
  return `${text.slice(0, NOTES_MAX_LENGTH).trimEnd()}…`;
}

/* ------------------------------------------------------------------ */
/* Public API                                                          */
/* ------------------------------------------------------------------ */

/** Repo star/fork/watcher/issue counts. Fallbacks on any failure. */
export async function fetchRepoStats(): Promise<RepoStats> {
  const cached = getCached<RepoStats>(CACHE_KEYS.repoStats);
  if (cached) return cached;

  try {
    const data = await ghFetch<GhRepo>("");
    const stats: RepoStats = {
      stars: data.stargazers_count ?? 0,
      forks: data.forks_count ?? 0,
      watchers: data.subscribers_count ?? data.watchers_count ?? 0,
      openIssues: data.open_issues_count ?? 0,
      source: "github",
    };
    setCached(CACHE_KEYS.repoStats, stats);
    return stats;
  } catch {
    return { ...FALLBACK_STATS, source: "fallback" };
  }
}

/** Latest (non-draft, non-prerelease per GitHub semantics) release. */
export async function fetchLatestRelease(): Promise<ReleaseInfo> {
  const cached = getCached<ReleaseInfo>(CACHE_KEYS.latestRelease);
  if (cached) return cached;

  try {
    const data = await ghFetch<GhRelease>("/releases/latest");
    const tag = data.tag_name ?? FALLBACK_TAG;
    const release: ReleaseInfo = {
      tag,
      name: data.name ?? `ValencyStudio - Spoofer ${tag}`,
      publishedAt: data.published_at ?? FALLBACK_PUBLISHED_AT,
      url: data.html_url ?? FALLBACK_RELEASE_URL,
      assets: mapAssets(data.assets),
      source: "github",
    };
    setCached(CACHE_KEYS.latestRelease, release);
    return release;
  } catch {
    return {
      tag: FALLBACK_TAG,
      name: FALLBACK_NAME,
      publishedAt: FALLBACK_PUBLISHED_AT,
      url: FALLBACK_RELEASE_URL,
      assets: FALLBACK_ASSETS.map((asset) => ({ ...asset })),
      source: "fallback",
    };
  }
}

/** Latest 8 releases with markdown-free release notes. */
export async function fetchReleases(): Promise<ReleasesResult> {
  const cached = getCached<ReleasesResult>(CACHE_KEYS.releases);
  if (cached) return cached;

  try {
    const data = await ghFetch<GhRelease[]>("/releases?per_page=8");
    const list = Array.isArray(data) ? data : [];
    const releases: ChangelogRelease[] = list.map((release) => {
      const tag = release.tag_name ?? "";
      return {
        tag,
        name: release.name ?? (tag ? `ValencyStudio - Spoofer ${tag}` : "Release"),
        publishedAt: release.published_at ?? null,
        url: release.html_url ?? `${RELEASES_PAGE_URL}/tag/${tag}`,
        notes: capNotes(stripMarkdownToPlainText(release.body ?? "")),
      };
    });
    const result: ReleasesResult = { releases, source: "github" };
    setCached(CACHE_KEYS.releases, result);
    return result;
  } catch {
    // Route layer substitutes its own hardcoded changelog for this case.
    return { releases: [], source: "fallback" };
  }
}

/** Sum of every asset's download_count across all releases (null on failure). */
export async function fetchTotalDownloads(): Promise<number | null> {
  const cached = getCached<number>(CACHE_KEYS.totalDownloads);
  if (cached !== null) return cached;

  try {
    const data = await ghFetch<GhRelease[]>("/releases?per_page=100");
    const list = Array.isArray(data) ? data : [];
    const total = list.reduce(
      (sum, release) =>
        sum +
        (Array.isArray(release.assets) ? release.assets : []).reduce(
          (assetSum, asset) => assetSum + (typeof asset.download_count === "number" ? asset.download_count : 0),
          0,
        ),
      0,
    );
    setCached(CACHE_KEYS.totalDownloads, total);
    return total;
  } catch {
    return null;
  }
}

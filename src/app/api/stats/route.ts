import { NextResponse } from "next/server";
import { fetchLatestRelease, fetchRepoStats, fetchTotalDownloads } from "@/lib/github";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const [repoStats, latestRelease, totalDownloads] = await Promise.all([
    fetchRepoStats(),
    fetchLatestRelease(),
    fetchTotalDownloads(),
  ]);

  // Site counters — never let a DB hiccup break the whole payload.
  let downloadClicks = 0;
  let subscribers = 0;
  try {
    const [clickCount, subscriberCount] = await db.$transaction([
      db.downloadEvent.count(),
      db.subscriber.count(),
    ]);
    downloadClicks = clickCount;
    subscribers = subscriberCount;
  } catch {
    // Keep zeros; stats from GitHub are still returned below.
  }

  const source =
    repoStats.source === "github" && latestRelease.source === "github" && totalDownloads !== null
      ? "github"
      : "fallback";

  return NextResponse.json({
    github: {
      stars: repoStats.stars,
      forks: repoStats.forks,
      watchers: repoStats.watchers,
      openIssues: repoStats.openIssues,
    },
    release: {
      tag: latestRelease.tag,
      name: latestRelease.name,
      publishedAt: latestRelease.publishedAt,
      url: latestRelease.url,
      assets: latestRelease.assets,
    },
    totals: {
      downloads: totalDownloads,
    },
    site: {
      downloadClicks,
      subscribers,
    },
    source,
  });
}

import type { MetadataRoute } from "next";
import { SITE_URL } from "@/lib/site";
import { FALLBACK_RELEASES, fetchReleases } from "@/lib/github";

/**
 * The home page's content changes when a new release ships — so the sitemap's
 * lastModified tracks the most recent release date rather than "now" (stable
 * across crawls). fetchReleases() is fail-safe and returns [] instead of
 * throwing when GitHub is unreachable, so the hardcoded changelog is the
 * fallback pool; "now" is the last resort.
 */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  let lastModified = new Date();

  try {
    const { releases } = await fetchReleases();
    const pool = releases.length > 0 ? releases : FALLBACK_RELEASES;
    const dates = pool
      .map((release) => release.publishedAt)
      .filter((date): date is string => Boolean(date))
      .sort();
    const latest = dates.at(-1);
    if (latest) {
      lastModified = new Date(latest);
    }
  } catch {
    // fetchReleases() is fail-safe; this is purely defensive.
  }

  return [
    {
      url: SITE_URL,
      lastModified,
      changeFrequency: "weekly",
      priority: 1,
    },
  ];
}

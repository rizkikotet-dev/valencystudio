import { NextResponse } from "next/server";
import { fetchReleases, FALLBACK_RELEASES } from "@/lib/github";
import { SITE_NAME, SITE_URL } from "@/lib/site";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_URL = "https://github.com/valency-studio/valencystudio-spoofer";

/**
 * JSON Feed 1.1 feed of the latest releases — the machine-readable sibling of
 * /feed.xml. Same fallback semantics: when GitHub is unreachable the known
 * FALLBACK_RELEASES list is served so the feed never 500s.
 * Content-Type application/feed+json is the type recommended by the spec.
 */
export async function GET() {
  const result = await fetchReleases();
  const releases =
    result.source === "github" && result.releases.length > 0
      ? result.releases
      : FALLBACK_RELEASES;

  const feed = {
    version: "https://jsonfeed.org/version/1.1",
    title: `${SITE_NAME} releases`,
    home_page_url: REPO_URL,
    feed_url: `${SITE_URL}/feed.json`,
    description:
      "New releases of ValencyStudio — Spoofer, the desktop asset replacement tool for Roblox Studio. The Studio plugin ships inside every desktop release.",
    language: "en",
    items: releases.map((release) => ({
      id: release.url,
      url: release.url,
      title: `${release.tag} — ${release.name}`,
      content_text: release.notes || `Release ${release.tag}`,
      ...(release.publishedAt ? { date_published: release.publishedAt } : {}),
    })),
  };

  return NextResponse.json(feed, {
    headers: {
      "Content-Type": "application/feed+json; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "X-Robots-Tag": "noindex",
    },
  });
}

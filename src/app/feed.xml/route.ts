import { NextResponse } from "next/server";
import { fetchReleases, FALLBACK_RELEASES } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const REPO_URL = "https://github.com/valency-studio/valencystudio-spoofer";

function escapeXml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function rfc822(iso: string | null): string {
  const d = iso ? new Date(iso) : null;
  return d && !Number.isNaN(d.getTime()) ? d.toUTCString() : "";
}

/**
 * RSS 2.0 feed of the latest releases — consumed by feed readers and
 * autodiscovered via the <link rel="alternate"> in the document head.
 * Falls back to the known release list when GitHub is unreachable.
 */
export async function GET() {
  const result = await fetchReleases();
  const releases =
    result.source === "github" && result.releases.length > 0
      ? result.releases
      : FALLBACK_RELEASES;

  const items = releases
    .map((release) => {
      const pubDate = rfc822(release.publishedAt);
      return [
        "    <item>",
        `      <title>${escapeXml(`${release.tag} — ${release.name}`)}</title>`,
        `      <link>${escapeXml(release.url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(release.url)}</guid>`,
        pubDate ? `      <pubDate>${pubDate}</pubDate>` : null,
        `      <description>${escapeXml(release.notes || `Release ${release.tag}`)}</description>`,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>ValencyStudio — Spoofer releases</title>
    <link>${escapeXml(REPO_URL)}</link>
    <description>New releases of ValencyStudio — Spoofer, the desktop asset replacement tool for Roblox Studio. The Studio plugin ships inside every desktop release.</description>
    <language>en</language>
    <lastBuildDate>${rfc822(releases[0]?.publishedAt ?? null) || new Date().toUTCString()}</lastBuildDate>
    <generator>ValencyStudio launch site</generator>
${items}
  </channel>
</rss>`;

  return new NextResponse(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, max-age=600",
      "X-Robots-Tag": "noindex",
    },
  });
}

import { NextResponse } from "next/server";
import { fetchReleases } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Hardcoded changelog used when GitHub is rate-limited / unreachable. */
const FALLBACK_RELEASES = [
  {
    tag: "v3.0.2",
    name: "ValencyStudio - Spoofer v3.0.2",
    publishedAt: "2026-10-13",
    url: "https://github.com/valency-studio/valencystudio-spoofer/releases/tag/v3.0.2",
    notes: "See the release page for the full changelog.",
  },
  {
    tag: "v3.0.1",
    name: "ValencyStudio - Spoofer v3.0.1",
    publishedAt: null,
    url: "https://github.com/valency-studio/valencystudio-spoofer/releases/tag/v3.0.1",
    notes: "See the release page for the full changelog.",
  },
  {
    tag: "v2.5.0",
    name: "ValencyStudio - Spoofer v2.5.0",
    publishedAt: null,
    url: "https://github.com/valency-studio/valencystudio-spoofer/releases/tag/v2.5.0",
    notes: "See the release page for the full changelog.",
  },
  {
    tag: "v2.4.0",
    name: "ValencyStudio - Spoofer v2.4.0",
    publishedAt: null,
    url: "https://github.com/valency-studio/valencystudio-spoofer/releases/tag/v2.4.0",
    notes: "See the release page for the full changelog.",
  },
] as const;

export async function GET() {
  const result = await fetchReleases();

  if (result.source === "fallback" || result.releases.length === 0) {
    return NextResponse.json({ releases: FALLBACK_RELEASES, source: "fallback" });
  }

  return NextResponse.json({ releases: result.releases, source: "github" });
}

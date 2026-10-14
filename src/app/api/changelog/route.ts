import { NextResponse } from "next/server";
import { fetchReleases, FALLBACK_RELEASES } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await fetchReleases();

  if (result.source === "fallback" || result.releases.length === 0) {
    return NextResponse.json({ releases: FALLBACK_RELEASES, source: "fallback" });
  }

  return NextResponse.json({ releases: result.releases, source: "github" });
}

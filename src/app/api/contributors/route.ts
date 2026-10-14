import { NextResponse } from "next/server";
import { getContributors } from "@/lib/github";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/contributors
 * Top contributors for valency-studio/valencystudio-spoofer.
 * Fail-safe: `{ contributors: [], totalCommits: 0, source: "fallback" }`
 * whenever GitHub is rate-limited / unreachable (never throws).
 */
export async function GET() {
  const result = await getContributors();
  return NextResponse.json(result);
}

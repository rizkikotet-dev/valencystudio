import { NextRequest, NextResponse } from "next/server";
import { getOperationStatus, getAssetModerationStatus } from "@/lib/roblox-api";

export const runtime = "nodejs";
export const maxDuration = 30;

/** GET /api/roblox/status?apiKey=xxx&operationId=yyy
 *    → polls operation completion, returns { phase, operationDone, assetId }
 * GET /api/roblox/status?apiKey=xxx&assetId=yyy
 *    → checks moderation status, returns { phase, moderationState, moderationReason }
 */
export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const apiKey = url.searchParams.get("apiKey");
    const operationId = url.searchParams.get("operationId");
    const assetId = url.searchParams.get("assetId");

    if (!apiKey) {
      return NextResponse.json({ ok: false, error: "apiKey wajib diisi" }, { status: 400 });
    }
    if (!operationId && !assetId) {
      return NextResponse.json({ ok: false, error: "operationId atau assetId wajib diisi" }, { status: 400 });
    }

    // Phase 1: Poll operation status (if operationId provided)
    if (operationId) {
      const result = await getOperationStatus(apiKey, operationId);
      return NextResponse.json(result, { status: result.ok ? 200 : 400 });
    }

    // Phase 2: Check moderation status (if assetId provided)
    const result = await getAssetModerationStatus(apiKey, assetId!);
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

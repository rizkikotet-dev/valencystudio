import { NextRequest, NextResponse } from "next/server";
import { verifyRobloxApiKey } from "@/lib/roblox-api";

export const runtime = "nodejs";

/** POST /api/roblox/verify
 * Body: { apiKey: string, userId: number }
 * Verifies a Roblox Open Cloud API key and returns the public user profile.
 */
export async function POST(req: NextRequest) {
  try {
    const { apiKey, userId } = await req.json();
    if (!apiKey) return NextResponse.json({ ok: false, error: "API Key wajib diisi" }, { status: 400 });
    if (!userId) return NextResponse.json({ ok: false, error: "User ID Roblox wajib diisi" }, { status: 400 });
    const result = await verifyRobloxApiKey(apiKey, Number(userId));
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

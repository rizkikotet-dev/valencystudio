import { NextRequest, NextResponse } from "next/server";
import { verifyRobloxCookie } from "@/lib/roblox-api";

export const runtime = "nodejs";

/** POST /api/roblox/verify
 * Body: { cookie: string }
 * Verifies a .ROBLOSECURITY cookie and returns the user info + csrf token.
 */
export async function POST(req: NextRequest) {
  try {
    const { cookie } = await req.json();
    if (!cookie) {
      return NextResponse.json({ ok: false, error: "Cookie wajib diisi" }, { status: 400 });
    }
    const result = await verifyRobloxCookie(cookie.trim());
    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

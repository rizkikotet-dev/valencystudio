import { NextRequest, NextResponse } from "next/server";
import { uploadAudioToRoblox } from "@/lib/roblox-api";
import { readAudioFile } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST /api/roblox/upload
 * Body: {
 *   cookie: string,
 *   csrfToken?: string,
 *   fileName: string,        // processed file name in processed dir
 *   assetName: string,
 *   description?: string,
 *   groupId?: number,
 * }
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { cookie, csrfToken, fileName, assetName, description, groupId } = body;

    if (!cookie) return NextResponse.json({ ok: false, error: "Cookie Roblox wajib diisi" }, { status: 400 });
    if (!fileName) return NextResponse.json({ ok: false, error: "fileName wajib diisi" }, { status: 400 });
    if (!assetName) return NextResponse.json({ ok: false, error: "assetName wajib diisi" }, { status: 400 });

    const buf = await readAudioFile(fileName, "processed");
    if (!buf) {
      return NextResponse.json({ ok: false, error: "File audio yang diproses tidak ditemukan. Proses ulang audio terlebih dahulu." }, { status: 404 });
    }

    const result = await uploadAudioToRoblox({
      cookie: cookie.trim(),
      csrfToken,
      audioBuffer: buf,
      assetName,
      description,
      groupId,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

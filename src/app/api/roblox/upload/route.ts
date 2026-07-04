import { NextRequest, NextResponse } from "next/server";
import { uploadAudioToRoblox } from "@/lib/roblox-api";
import { readAudioFile } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const maxDuration = 180;

/** POST /api/roblox/upload
 * Body: {
 *   apiKey: string,
 *   userId: number,
 *   groupId?: number,
 *   fileName: string,        // processed file name in processed dir
 *   assetName: string,
 *   description?: string,
 * }
 * Uploads the processed audio to Roblox via Open Cloud Assets API and polls
 * the operation until the assetId is available.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { apiKey, userId, groupId, fileName, assetName, description } = body;

    if (!apiKey) return NextResponse.json({ ok: false, error: "API Key wajib diisi" }, { status: 400 });
    if (!userId) return NextResponse.json({ ok: false, error: "User ID wajib diisi" }, { status: 400 });
    if (!fileName) return NextResponse.json({ ok: false, error: "fileName wajib diisi" }, { status: 400 });
    if (!assetName) return NextResponse.json({ ok: false, error: "assetName wajib diisi" }, { status: 400 });

    const buf = await readAudioFile(fileName, "processed");
    if (!buf) {
      return NextResponse.json({ ok: false, error: "File audio yang diproses tidak ditemukan. Proses ulang audio terlebih dahulu." }, { status: 404 });
    }

    const result = await uploadAudioToRoblox({
      apiKey: apiKey.trim(),
      audioBuffer: buf,
      fileName: fileName.endsWith(".mp3") ? fileName : `${fileName}.mp3`,
      assetName,
      description,
      userId: Number(userId),
      groupId: groupId ? Number(groupId) : undefined,
    });

    return NextResponse.json(result, { status: result.ok ? 200 : 400 });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

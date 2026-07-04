import { NextRequest, NextResponse } from "next/server";
import { createAudioAsset } from "@/lib/roblox-api";
import { readAudioFile } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const maxDuration = 60;

/** POST /api/roblox/upload
 * Body: { apiKey, userId, groupId?, fileName, assetName, description? }
 * Creates the asset via Open Cloud API and returns immediately with operationId
 * (or assetId if completed synchronously). The frontend polls /api/roblox/status
 * for operation completion and moderation status.
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

    const result = await createAudioAsset({
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

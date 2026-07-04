import { NextRequest, NextResponse } from "next/server";
import { extractAudioFromUrl, saveUploadedFile } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST /api/audio/extract
 * Body: { url: string }  -> extract audio from YouTube/SoundCloud
 * OR multipart/form-data with field "file" -> upload local file
 */
export async function POST(req: NextRequest) {
  try {
    const contentType = req.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const form = await req.formData();
      const file = form.get("file") as File;
      if (!file) {
        return NextResponse.json({ error: "File tidak ditemukan" }, { status: 400 });
      }
      const allowed = [".mp3", ".wav", ".m4a", ".aac", ".ogg", ".flac", ".webm", ".opus"];
      const name = file.name.toLowerCase();
      const ok = allowed.some((ext) => name.endsWith(ext));
      if (!ok) {
        return NextResponse.json({ error: "Format file tidak didukung. Gunakan MP3, WAV, M4A, OGG, FLAC, dll." }, { status: 400 });
      }
      if (file.size > 100 * 1024 * 1024) {
        return NextResponse.json({ error: "Ukuran file melebihi 100MB" }, { status: 400 });
      }
      const result = await saveUploadedFile(file);
      return NextResponse.json(result, { status: result.ok ? 200 : 500 });
    }

    const body = await req.json();
    const url = body.url as string;
    if (!url) {
      return NextResponse.json({ error: "URL wajib diisi" }, { status: 400 });
    }
    const validDomains = ["youtube.com", "youtu.be", "soundcloud.com", "www.youtube.com", "m.youtube.com", "www.soundcloud.com"];
    let isSupported = false;
    try {
      const u = new URL(url);
      isSupported = validDomains.some((d) => u.hostname === d || u.hostname.endsWith("." + d));
    } catch {
      return NextResponse.json({ error: "URL tidak valid" }, { status: 400 });
    }
    if (!isSupported) {
      return NextResponse.json({ error: "Hanya mendukung URL dari YouTube atau SoundCloud" }, { status: 400 });
    }

    const result = await extractAudioFromUrl(url);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

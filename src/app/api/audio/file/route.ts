import { NextRequest, NextResponse } from "next/server";
import { readAudioFile, getAudioFileStat } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/audio/file?name=xxx&type=processed|upload
 * Streams audio file with range support.
 */
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const name = url.searchParams.get("name");
  const type = (url.searchParams.get("type") || "processed") as "upload" | "processed";
  if (!name) return NextResponse.json({ error: "name wajib diisi" }, { status: 400 });

  const stat = getAudioFileStat(name, type);
  if (!stat) return NextResponse.json({ error: "File tidak ditemukan" }, { status: 404 });

  const range = req.headers.get("range");
  const buf = await readAudioFile(name, type);
  if (!buf) return NextResponse.json({ error: "File tidak dapat dibaca" }, { status: 500 });

  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    if (m) {
      const start = m[1] ? parseInt(m[1]) : 0;
      const end = m[2] ? parseInt(m[2]) : stat.size - 1;
      const chunk = buf.subarray(start, end + 1);
      return new NextResponse(chunk, {
        status: 206,
        headers: {
          "Content-Type": "audio/mpeg",
          "Content-Range": `bytes ${start}-${end}/${stat.size}`,
          "Accept-Ranges": "bytes",
          "Content-Length": String(chunk.length),
          "Cache-Control": "no-cache",
        },
      });
    }
  }

  return new NextResponse(buf, {
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(stat.size),
      "Accept-Ranges": "bytes",
      "Cache-Control": "no-cache",
    },
  });
}

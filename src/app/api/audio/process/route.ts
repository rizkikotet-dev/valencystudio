import { NextRequest, NextResponse } from "next/server";
import { processAudioFile, type ProcessOptions } from "@/lib/audio-processor";

export const runtime = "nodejs";
export const maxDuration = 120;

/** POST /api/audio/process
 * Body: ProcessOptions { inputFile, speed, pitch, amplification }
 */
export async function POST(req: NextRequest) {
  try {
    const body = (await req.json()) as ProcessOptions;
    if (!body.inputFile) {
      return NextResponse.json({ error: "inputFile wajib diisi" }, { status: 400 });
    }
    const safe: ProcessOptions = {
      inputFile: body.inputFile,
      speed: clamp(body.speed ?? 1, 0.25, 4),
      pitch: clamp(body.pitch ?? 0, -12, 12),
      amplification: clamp(body.amplification ?? 0, -30, 30),
    };
    const result = await processAudioFile(safe);
    return NextResponse.json(result, { status: result.ok ? 200 : 500 });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

function clamp(v: number, min: number, max: number) {
  return Math.min(max, Math.max(min, v));
}

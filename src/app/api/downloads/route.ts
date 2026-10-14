import { NextResponse } from "next/server";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const downloadSchema = z.object({
  platform: z.enum(["windows", "macos", "linux"], {
    message: 'Invalid platform. Expected "windows", "macos" or "linux".',
  }),
});

interface PlatformClicks {
  windows: number;
  macos: number;
  linux: number;
  total: number;
}

export async function POST(req: Request) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json(
      { ok: false, error: "Invalid request body. Expected JSON." },
      { status: 400 },
    );
  }

  const parsed = downloadSchema.safeParse(body);
  if (!parsed.success) {
    const message =
      parsed.error.issues[0]?.message ??
      'Invalid platform. Expected "windows", "macos" or "linux".';
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  try {
    await db.downloadEvent.create({
      data: { platform: parsed.data.platform },
    });

    const grouped = await db.downloadEvent.groupBy({
      by: ["platform"],
      _count: { _all: true },
    });

    const clicks: PlatformClicks = { windows: 0, macos: 0, linux: 0, total: 0 };
    for (const row of grouped) {
      const count = row._count._all;
      if (row.platform === "windows") clicks.windows = count;
      else if (row.platform === "macos") clicks.macos = count;
      else if (row.platform === "linux") clicks.linux = count;
      clicks.total += count;
    }

    return NextResponse.json({ ok: true, clicks });
  } catch (error) {
    // Tracking must never break the download UX — report and stay at 200.
    const message =
      error instanceof Error ? error.message : "Download tracking is temporarily unavailable.";
    return NextResponse.json({ ok: false, error: message }, { status: 200 });
  }
}

import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/history — list all conversion/upload history (newest first) */
export async function GET() {
  try {
    const items = await db.audioUpload.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      include: { account: true },
    });
    return NextResponse.json({ ok: true, items });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message, items: [] }, { status: 500 });
  }
}

/** POST /api/history — save a conversion/upload record */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const created = await db.audioUpload.create({
      data: {
        sourceType: body.sourceType || "file",
        sourceUrl: body.sourceUrl || null,
        sourceTitle: body.sourceTitle || null,
        assetName: body.assetName || "Audio",
        description: body.description || null,
        originalFile: body.originalFile || "",
        processedFile: body.processedFile || null,
        duration: Number(body.duration) || 0,
        fileSize: Number(body.fileSize) || 0,
        speed: Number(body.speed) || 1,
        pitch: Number(body.pitch) || 0,
        amplification: Number(body.amplification) || 0,
        bassBoost: 0,
        reverb: 0,
        bypassMode: body.bypassMode || null,
        robloxAssetId: body.robloxAssetId || null,
        uploadStatus: body.uploadStatus || "pending",
        uploadError: body.uploadError || null,
        moderationStatus: body.moderationStatus || null,
        moderationReason: body.moderationReason || null,
        accountId: body.accountId || null,
      },
    });
    return NextResponse.json({ ok: true, item: created });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

/** PATCH /api/history?id=xxx — update moderation status of a record */
export async function PATCH(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id wajib diisi" }, { status: 400 });
    const body = await req.json();
    const updated = await db.audioUpload.update({
      where: { id },
      data: {
        moderationStatus: body.moderationStatus || null,
        moderationReason: body.moderationReason || null,
        uploadStatus: body.uploadStatus || undefined,
        robloxAssetId: body.robloxAssetId || undefined,
      },
    });
    return NextResponse.json({ ok: true, item: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

/** DELETE /api/history?id=xxx — delete a record */
export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get("id");
    if (!id) return NextResponse.json({ ok: false, error: "id wajib diisi" }, { status: 400 });
    await db.audioUpload.delete({ where: { id } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: (e as Error).message }, { status: 500 });
  }
}

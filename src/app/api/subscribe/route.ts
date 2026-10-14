import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { z } from "zod";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const subscribeSchema = z.object({
  // zod v4: normalize first, then validate the transformed value as an email.
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email({ message: "Please enter a valid email address." })),
});

function uniqueViolation(error: unknown): boolean {
  return error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002";
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

  const parsed = subscribeSchema.safeParse(body);
  if (!parsed.success) {
    const message = parsed.error.issues[0]?.message ?? "Please enter a valid email address.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }

  const email = parsed.data.email;

  try {
    await db.subscriber.upsert({
      where: { email },
      update: {}, // already subscribed — idempotent success
      create: { email },
    });
  } catch (error) {
    if (uniqueViolation(error)) {
      // Lost a race with a concurrent insert — treat as subscribed.
      try {
        const subscribers = await db.subscriber.count();
        return NextResponse.json({ ok: true, subscribers });
      } catch {
        return NextResponse.json(
          { ok: false, error: "Something went wrong. Try again." },
          { status: 500 },
        );
      }
    }
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }

  try {
    const subscribers = await db.subscriber.count();
    return NextResponse.json({ ok: true, subscribers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}

// Optional: let the frontend display the current subscriber count.
export async function GET() {
  try {
    const subscribers = await db.subscriber.count();
    return NextResponse.json({ subscribers });
  } catch {
    return NextResponse.json(
      { ok: false, error: "Something went wrong. Try again." },
      { status: 500 },
    );
  }
}

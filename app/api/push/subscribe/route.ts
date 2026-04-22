import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const body = z.object({
  endpoint: z.string().url().max(2048),
  keys: z.object({
    p256dh: z.string().min(1).max(512),
    auth: z.string().min(1).max(256),
  }),
  userAgent: z.string().max(512).optional(),
});

/**
 * Save or refresh a Push subscription for the signed-in user.
 * Idempotent — same endpoint updates in place.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid subscription." }, { status: 400 });
  }

  const data = parsed.data;

  await prisma.pushSubscription.upsert({
    where: { endpoint: data.endpoint },
    update: {
      userId: session.user.id,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent ?? null,
      lastUsed: new Date(),
    },
    create: {
      userId: session.user.id,
      endpoint: data.endpoint,
      p256dh: data.keys.p256dh,
      auth: data.keys.auth,
      userAgent: data.userAgent ?? null,
    },
  });

  // Default prefs on first subscribe if user has none yet.
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushPrefs: true },
  });
  if (!user?.pushPrefs) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        pushPrefs: {
          enabled: true,
          morning: true,
          midday: true,
          evening: true,
          quietStart: 22,
          quietEnd: 7,
        },
      },
    });
  }

  return NextResponse.json({ ok: true });
}

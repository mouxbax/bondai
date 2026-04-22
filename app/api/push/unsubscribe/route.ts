import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const body = z.object({
  endpoint: z.string().url().max(2048),
});

export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = body.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload." }, { status: 400 });
  }

  await prisma.pushSubscription
    .deleteMany({
      where: { endpoint: parsed.data.endpoint, userId: session.user.id },
    })
    .catch(() => {});

  return NextResponse.json({ ok: true });
}

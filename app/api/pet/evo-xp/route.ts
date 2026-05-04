import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/pet/evo-xp — fetch user's server-side EvoXP + account creation date.
 * Used on page load so localStorage can sync FROM the DB (source of truth).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { evoXp: true, createdAt: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({
    evoXp: user.evoXp ?? 0,
    accountCreated: user.createdAt.toISOString(),
  });
}

const syncSchema = z.object({
  evoXp: z.number().int().min(0),
});

/**
 * POST /api/pet/evo-xp — sync EvoXP from client localStorage to server DB.
 * Called after feeding so evolution progress persists server-side.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { evoXp } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { evoXp },
  });

  return NextResponse.json({ evoXp });
}

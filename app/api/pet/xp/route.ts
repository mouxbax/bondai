import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { xpToLevel } from "@/lib/gamification";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  totalXp: z.number().int().min(0),
});

/**
 * GET /api/pet/xp — fetch authoritative XP/level/score from server.
 * Used to hydrate the client on load so all devices stay in sync.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true, connectionScore: true },
  });

  if (!user) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const state = xpToLevel(user.xp);

  return NextResponse.json({
    xp: user.xp,
    connectionScore: user.connectionScore,
    ...state,
  });
}

/**
 * POST /api/pet/xp — sync XP from client localStorage to server DB.
 * Called after each awardXP() so leaderboard stays updated.
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

  const { totalXp } = parsed.data;
  const { level } = xpToLevel(totalXp);

  await prisma.user.update({
    where: { id: session.user.id },
    data: { xp: totalXp, level },
  });

  return NextResponse.json({ xp: totalXp, level });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/leaderboard — top 20 companions ranked by XP.
 * Returns the leaderboard + the current user's rank.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Top 20 by XP
  const top = await prisma.user.findMany({
    where: { xp: { gt: 0 } },
    orderBy: { xp: "desc" },
    take: 20,
    select: {
      id: true,
      name: true,
      image: true,
      xp: true,
      level: true,
      companionName: true,
      companionMood: true,
    },
  });

  // Current user's rank
  const me = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { xp: true, level: true, companionName: true, companionMood: true },
  });

  let myRank: number | null = null;
  if (me && me.xp > 0) {
    const usersAbove = await prisma.user.count({
      where: { xp: { gt: me.xp } },
    });
    myRank = usersAbove + 1;
  }

  return NextResponse.json({
    leaderboard: top.map((u, i) => ({
      rank: i + 1,
      name: u.name ?? "Anonymous",
      image: u.image,
      xp: u.xp,
      level: u.level,
      companionName: u.companionName,
      mood: u.companionMood,
      isMe: u.id === session.user.id,
    })),
    myRank,
    myXp: me?.xp ?? 0,
    myLevel: me?.level ?? 1,
  });
}

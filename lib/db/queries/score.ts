import type { ConnectionEventType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { clampScore } from "@/lib/score";

export async function addConnectionEvent(params: {
  userId: string;
  type: ConnectionEventType;
  pointsAwarded: number;
  note?: string | null;
  badgeKey?: string | null;
}) {
  const user = await prisma.user.findUniqueOrThrow({ where: { id: params.userId } });
  const next = clampScore(user.connectionScore + params.pointsAwarded);

  const [event] = await prisma.$transaction([
    prisma.connectionEvent.create({
      data: {
        userId: params.userId,
        type: params.type,
        pointsAwarded: params.pointsAwarded,
        note: params.note ?? null,
        badgeKey: params.badgeKey ?? null,
      },
    }),
    prisma.user.update({
      where: { id: params.userId },
      data: { connectionScore: next },
    }),
  ]);

  return { event, score: next };
}

export async function listRecentEvents(userId: string, take = 60) {
  return prisma.connectionEvent.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
    take,
  });
}

export async function countCheckins(userId: string): Promise<number> {
  return prisma.connectionEvent.count({
    where: { userId, type: "DAILY_CHECKIN" },
  });
}

export async function hasBadge(userId: string, badgeKey: string): Promise<boolean> {
  const n = await prisma.connectionEvent.count({
    where: { userId, badgeKey },
  });
  return n > 0;
}

export async function hasCoachingComplete(userId: string): Promise<boolean> {
  const n = await prisma.connectionEvent.count({
    where: { userId, type: "COACHING_COMPLETED" },
  });
  return n > 0;
}

export async function hasRealWorld(userId: string): Promise<boolean> {
  const n = await prisma.connectionEvent.count({
    where: { userId, type: "REAL_WORLD_INTERACTION" },
  });
  return n > 0;
}

export async function hasGoalCompleted(userId: string): Promise<boolean> {
  const n = await prisma.connectionEvent.count({
    where: { userId, type: "GOAL_COMPLETED" },
  });
  return n > 0;
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET  — return current streak info
 * POST — check in for today (idempotent)
 */

// Streak milestones that award coins
const MILESTONES: Record<number, number> = {
  3: 10,
  7: 25,
  14: 50,
  30: 150,
  60: 300,
  100: 500,
  365: 2000,
};

function isSameDay(a: Date, b: Date): boolean {
  return (
    a.getUTCFullYear() === b.getUTCFullYear() &&
    a.getUTCMonth() === b.getUTCMonth() &&
    a.getUTCDate() === b.getUTCDate()
  );
}

function isYesterday(last: Date, today: Date): boolean {
  const y = new Date(today);
  y.setUTCDate(y.getUTCDate() - 1);
  return isSameDay(last, y);
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const streak = await prisma.userStreak.findUnique({
    where: { userId: session.user.id },
  });

  return NextResponse.json({
    currentStreak: streak?.currentStreak ?? 0,
    longestStreak: streak?.longestStreak ?? 0,
    lastCheckInDate: streak?.lastCheckInDate?.toISOString() ?? null,
    checkedInToday: streak?.lastCheckInDate
      ? isSameDay(streak.lastCheckInDate, new Date())
      : false,
  });
}

export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const userId = session.user.id;

  const existing = await prisma.userStreak.findUnique({
    where: { userId },
  });

  // Already checked in today — return current state (idempotent)
  if (existing?.lastCheckInDate && isSameDay(existing.lastCheckInDate, now)) {
    return NextResponse.json({
      currentStreak: existing.currentStreak,
      longestStreak: existing.longestStreak,
      lastCheckInDate: existing.lastCheckInDate.toISOString(),
      checkedInToday: true,
      coinsAwarded: 0,
      milestone: null,
    });
  }

  let newStreak: number;

  if (!existing) {
    // First ever check-in
    newStreak = 1;
  } else if (existing.lastCheckInDate && isYesterday(existing.lastCheckInDate, now)) {
    // Consecutive day — increment
    newStreak = existing.currentStreak + 1;
  } else {
    // Missed a day — check for streak shield
    // TODO: check if user has a streak shield in inventory and consume it
    newStreak = 1;
  }

  const longestStreak = Math.max(newStreak, existing?.longestStreak ?? 0);

  // Check for milestone reward
  const milestoneCoins = MILESTONES[newStreak] ?? 0;
  const milestone = milestoneCoins > 0 ? newStreak : null;

  // Upsert streak + award coins in a transaction
  await prisma.$transaction([
    prisma.userStreak.upsert({
      where: { userId },
      create: {
        userId,
        currentStreak: newStreak,
        longestStreak,
        lastCheckInDate: now,
      },
      update: {
        currentStreak: newStreak,
        longestStreak,
        lastCheckInDate: now,
      },
    }),
    ...(milestoneCoins > 0
      ? [
          prisma.user.update({
            where: { id: userId },
            data: { coins: { increment: milestoneCoins } },
          }),
        ]
      : []),
  ]);

  return NextResponse.json({
    currentStreak: newStreak,
    longestStreak,
    lastCheckInDate: now.toISOString(),
    checkedInToday: true,
    coinsAwarded: milestoneCoins,
    milestone,
  });
}

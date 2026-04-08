import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  createConversation,
  findDailyCheckinForUtcDay,
} from "@/lib/db/queries/conversations";
import { addConnectionEvent, hasBadge } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";
import { startOfUtcDay } from "@/lib/utils";

/**
 * Example:
 * curl -X POST http://localhost:3000/api/checkin -H "Cookie: ..."
 */

function isYesterdayUtc(last: Date, todayStart: Date): boolean {
  const y = new Date(todayStart);
  y.setUTCDate(y.getUTCDate() - 1);
  return (
    last.getUTCFullYear() === y.getUTCFullYear() &&
    last.getUTCMonth() === y.getUTCMonth() &&
    last.getUTCDate() === y.getUTCDate()
  );
}

function isSameUtcDayAs(d: Date, dayStart: Date): boolean {
  return (
    d.getUTCFullYear() === dayStart.getUTCFullYear() &&
    d.getUTCMonth() === dayStart.getUTCMonth() &&
    d.getUTCDate() === dayStart.getUTCDate()
  );
}

export async function POST(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = startOfUtcDay(now);

  let convo = await findDailyCheckinForUtcDay(session.user.id, now);
  let isNew = false;

  if (!convo) {
    isNew = true;
    const title = `Check-in · ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
    await createConversation(session.user.id, "DAILY_CHECKIN", title, null);
    convo = await findDailyCheckinForUtcDay(session.user.id, now);
  }

  if (!convo) {
    return NextResponse.json({ error: "Failed to create check-in" }, { status: 500 });
  }

  const streakRow =
    (await prisma.userStreak.findUnique({ where: { userId: session.user.id } })) ??
    (await prisma.userStreak.create({
      data: { userId: session.user.id, currentStreak: 0, longestStreak: 0 },
    }));

  let current = streakRow.currentStreak;
  const last = streakRow.lastCheckInDate;

  if (!last || !isSameUtcDayAs(last, todayStart)) {
    if (last && isYesterdayUtc(last, todayStart)) {
      current = current + 1;
    } else if (!last) {
      current = 1;
    } else {
      current = 1;
    }
    const longest = Math.max(streakRow.longestStreak, current);
    await prisma.userStreak.update({
      where: { userId: session.user.id },
      data: { currentStreak: current, longestStreak: longest, lastCheckInDate: now },
    });

    if (current === 7 || current === 14 || current === 30) {
      await addConnectionEvent({
        userId: session.user.id,
        type: "STREAK_MILESTONE",
        pointsAwarded: 1,
        note: `${current}-day streak milestone`,
      });
    }
    if (current === 7) {
      const has = await hasBadge(session.user.id, BADGE_KEYS.WEEK_WARRIOR);
      if (!has) {
        await addConnectionEvent({
          userId: session.user.id,
          type: "BADGE_UNLOCKED",
          pointsAwarded: 0,
          note: "Week Warrior",
          badgeKey: BADGE_KEYS.WEEK_WARRIOR,
        });
      }
      await addConnectionEvent({
        userId: session.user.id,
        type: "STREAK_7_BONUS",
        pointsAwarded: 1,
        note: "7-day streak bonus",
      });
    }
  } else {
    current = streakRow.currentStreak;
  }

  return NextResponse.json({
    conversationId: convo.id,
    isNew,
    streak: current,
  });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

/**
 * Vercel Cron: Runs daily to identify users who need follow-up.
 * Currently marks crisis follow-ups as due and could be extended
 * for email reminders when Nodemailer is configured.
 *
 * Protected by CRON_SECRET env var.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // 1. Find crisis conversations that need follow-up today
  const crisisFollowUps = await prisma.conversation.findMany({
    where: {
      crisisFollowUpDueAt: { lte: now },
    },
    select: { id: true, userId: true },
  });

  // 2. For each, create a follow-up check-in conversation
  let followUpCount = 0;
  for (const convo of crisisFollowUps) {
    // Check if user already has a check-in today
    const existing = await prisma.conversation.findFirst({
      where: {
        userId: convo.userId,
        type: "DAILY_CHECKIN",
        createdAt: { gte: todayStart },
      },
    });
    if (!existing) {
      await prisma.conversation.create({
        data: {
          userId: convo.userId,
          title: "Follow-up check-in",
          type: "DAILY_CHECKIN",
        },
      });
      followUpCount++;
    }
    // Clear the follow-up flag
    await prisma.conversation.update({
      where: { id: convo.id },
      data: { crisisFollowUpDueAt: null },
    });
  }

  // 3. Find users with streaks at risk (last check-in was yesterday)
  const yesterday = new Date(now);
  yesterday.setUTCDate(yesterday.getUTCDate() - 1);
  yesterday.setUTCHours(0, 0, 0, 0);

  const streaksAtRisk = await prisma.userStreak.count({
    where: {
      currentStreak: { gt: 0 },
      lastCheckInDate: { gte: yesterday, lt: todayStart },
    },
  });

  return NextResponse.json({
    ok: true,
    timestamp: now.toISOString(),
    crisisFollowUps: followUpCount,
    streaksAtRisk,
  });
}

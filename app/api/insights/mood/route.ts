import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/insights/mood
 * Emotion tag counts grouped by day for the last 30 days.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const since = new Date();
  since.setDate(since.getDate() - 30);

  const messages = await prisma.message.findMany({
    where: {
      conversation: { userId: session.user.id },
      emotionTag: { not: null },
      createdAt: { gte: since },
    },
    select: { emotionTag: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const tags = ["HAPPY", "SAD", "ANXIOUS", "LONELY", "ANGRY", "NEUTRAL"] as const;
  const byDate: Record<string, Record<string, number>> = {};

  for (const m of messages) {
    const date = m.createdAt.toISOString().split("T")[0];
    if (!byDate[date]) {
      byDate[date] = {};
      for (const t of tags) byDate[date][t] = 0;
    }
    if (m.emotionTag) byDate[date][m.emotionTag]++;
  }

  const days = Object.entries(byDate)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, counts]) => ({ date, ...counts }));

  const totals: Record<string, number> = {};
  for (const t of tags) totals[t] = 0;
  for (const m of messages) {
    if (m.emotionTag) totals[m.emotionTag]++;
  }

  return NextResponse.json({ days, totals, count: messages.length });
}

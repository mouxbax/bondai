import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { listRecentEvents, countCheckins, hasBadge, hasCoachingComplete, hasRealWorld, hasGoalCompleted } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";
import { clampScore } from "@/lib/score";

/**
 * curl http://localhost:3000/api/score -H "Cookie: ..."
 */

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: { streak: true },
  });

  const events = await listRecentEvents(session.user.id, 80);
  const eventsAsc = [...events].sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());

  let running = 10;
  const history: { at: string; score: number }[] = [{ at: eventsAsc[0]?.createdAt.toISOString() ?? new Date().toISOString(), score: 10 }];
  for (const ev of eventsAsc) {
    running = clampScore(running + ev.pointsAwarded);
    history.push({ at: ev.createdAt.toISOString(), score: running });
  }
  if (history.length === 1) {
    history.push({ at: new Date().toISOString(), score: user.connectionScore });
  } else {
    history[history.length - 1] = { at: new Date().toISOString(), score: user.connectionScore };
  }

  const badgeSet = new Set<string>();
  for (const ev of events) {
    if (ev.badgeKey) badgeSet.add(ev.badgeKey);
  }

  const checkinCount = await countCheckins(session.user.id);
  if (checkinCount >= 5) badgeSet.add(BADGE_KEYS.OPENING_UP);
  if (await hasBadge(session.user.id, BADGE_KEYS.FIRST_STEP)) badgeSet.add(BADGE_KEYS.FIRST_STEP);
  if (await hasBadge(session.user.id, BADGE_KEYS.WEEK_WARRIOR)) badgeSet.add(BADGE_KEYS.WEEK_WARRIOR);
  if (await hasCoachingComplete(session.user.id)) badgeSet.add(BADGE_KEYS.BRAVE);
  if (await hasRealWorld(session.user.id)) badgeSet.add(BADGE_KEYS.OUT_THERE);
  if (await hasGoalCompleted(session.user.id)) badgeSet.add(BADGE_KEYS.GOAL_GETTER);
  if (user.connectionScore >= 50) badgeSet.add(BADGE_KEYS.SOCIAL_BUTTERFLY);

  return NextResponse.json({
    score: user.connectionScore,
    events: events.map((e) => ({
      id: e.id,
      type: e.type,
      note: e.note,
      pointsAwarded: e.pointsAwarded,
      badgeKey: e.badgeKey,
      createdAt: e.createdAt.toISOString(),
    })),
    streak: {
      current: user.streak?.currentStreak ?? 0,
      longest: user.streak?.longestStreak ?? 0,
      lastCheckInDate: user.streak?.lastCheckInDate?.toISOString() ?? null,
    },
    badges: Array.from(badgeSet),
    history,
  });
}

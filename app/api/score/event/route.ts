import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import type { ConnectionEventType } from "@prisma/client";
import { addConnectionEvent, hasBadge } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";
import { pointsForEvent } from "@/lib/score";
import { prisma } from "@/lib/db/prisma";

/**
 * curl -X POST http://localhost:3000/api/score/event -H "Content-Type: application/json" \
 *   -d '{"type":"REAL_WORLD_INTERACTION","note":"Coffee with Sam"}' -H "Cookie: ..."
 */

const bodySchema = z.object({
  type: z.enum([
    "ONBOARDING_COMPLETE",
    "DAILY_CHECKIN",
    "GOAL_COMPLETED",
    "REAL_WORLD_INTERACTION",
    "COACHING_COMPLETED",
    "STREAK_MILESTONE",
    "STREAK_7_BONUS",
    "CHECKIN_STREAK",
    "BADGE_UNLOCKED",
    "SCORE_ADJUSTMENT",
  ]),
  note: z.string().optional(),
});

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const type = parsed.data.type as ConnectionEventType;
  let pts = pointsForEvent(type);
  if (type === "SCORE_ADJUSTMENT") pts = 0;

  await addConnectionEvent({
    userId: session.user.id,
    type,
    pointsAwarded: pts,
    note: parsed.data.note ?? null,
  });

  if (type === "REAL_WORLD_INTERACTION") {
    const has = await hasBadge(session.user.id, BADGE_KEYS.OUT_THERE);
    if (!has) {
      await addConnectionEvent({
        userId: session.user.id,
        type: "BADGE_UNLOCKED",
        pointsAwarded: 0,
        note: "Out There",
        badgeKey: BADGE_KEYS.OUT_THERE,
      });
    }
  }

  if (type === "COACHING_COMPLETED") {
    const has = await hasBadge(session.user.id, BADGE_KEYS.BRAVE);
    if (!has) {
      await addConnectionEvent({
        userId: session.user.id,
        type: "BADGE_UNLOCKED",
        pointsAwarded: 0,
        note: "Brave",
        badgeKey: BADGE_KEYS.BRAVE,
      });
    }
  }

  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  if (user.connectionScore >= 50) {
    const b = await hasBadge(session.user.id, BADGE_KEYS.SOCIAL_BUTTERFLY);
    if (!b) {
      await addConnectionEvent({
        userId: session.user.id,
        type: "BADGE_UNLOCKED",
        pointsAwarded: 0,
        note: "Social Butterfly",
        badgeKey: BADGE_KEYS.SOCIAL_BUTTERFLY,
      });
    }
  }

  const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });

  return NextResponse.json({ score: finalUser.connectionScore });
}

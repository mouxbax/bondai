import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { deleteGoal, getGoal, updateGoal } from "@/lib/db/queries/goals";
import { prisma } from "@/lib/db/prisma";
import { addConnectionEvent, hasBadge } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";

const patchSchema = z.object({
  title: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  status: z.enum(["ACTIVE", "COMPLETED", "ABANDONED"]).optional(),
  targetDate: z.string().datetime().nullable().optional(),
});

export async function PATCH(
  req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const existing = await getGoal(session.user.id, id);
  if (!existing) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const data: Parameters<typeof updateGoal>[2] = {};
  if (parsed.data.title !== undefined) data.title = parsed.data.title;
  if (parsed.data.description !== undefined) data.description = parsed.data.description;
  if (parsed.data.status !== undefined) data.status = parsed.data.status;
  if (parsed.data.targetDate !== undefined) {
    data.targetDate = parsed.data.targetDate ? new Date(parsed.data.targetDate) : null;
  }

  if (parsed.data.status === "COMPLETED" && existing.status !== "COMPLETED") {
    await addConnectionEvent({
      userId: session.user.id,
      type: "GOAL_COMPLETED",
      pointsAwarded: 5,
      note: existing.title,
    });
    const got = await hasBadge(session.user.id, BADGE_KEYS.GOAL_GETTER);
    if (!got) {
      await addConnectionEvent({
        userId: session.user.id,
        type: "BADGE_UNLOCKED",
        pointsAwarded: 0,
        note: "Goal Getter",
        badgeKey: BADGE_KEYS.GOAL_GETTER,
      });
    }
    const userAfter = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    if (userAfter.connectionScore >= 50) {
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
    await updateGoal(session.user.id, id, { ...data, status: "COMPLETED" });
    const goal = await getGoal(session.user.id, id);
    const finalUser = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
    return NextResponse.json({ goal, score: finalUser.connectionScore });
  }

  await updateGoal(session.user.id, id, data);
  const goal = await getGoal(session.user.id, id);
  const user = await prisma.user.findUniqueOrThrow({ where: { id: session.user.id } });
  return NextResponse.json({ goal, score: user.connectionScore });
}

export async function DELETE(
  _req: Request,
  context: { params: Promise<{ id: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const { id } = await context.params;
  const res = await deleteGoal(session.user.id, id);
  if (res.count === 0) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({ ok: true });
}

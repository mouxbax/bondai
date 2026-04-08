import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { createConversation } from "@/lib/db/queries/conversations";
import { createGoal } from "@/lib/db/queries/goals";
import { addConnectionEvent, hasBadge } from "@/lib/db/queries/score";
import { BADGE_KEYS } from "@/lib/score";

const bodySchema = z.object({
  name: z.string().min(1),
  situations: z.array(z.string()).min(1),
  anxietyLevel: z.number().int().min(1).max(5),
  anxietyNote: z.string().optional(),
  goalTitle: z.string().min(1),
  goalDescription: z.string().min(1),
  voicePreferred: z.boolean(),
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

  const d = parsed.data;
  const memorySnippet = [d.anxietyNote?.trim(), `Situations: ${d.situations.join(", ")}`]
    .filter(Boolean)
    .join("\n");

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      name: d.name,
      onboardingComplete: true,
      onboardingSituations: d.situations,
      anxietyLevel: d.anxietyLevel,
      voicePreferred: d.voicePreferred,
      memorySnippet,
    },
  });

  await createGoal(session.user.id, {
    title: d.goalTitle,
    description: d.goalDescription,
  });

  const now = new Date();
  const title = `Check-in · ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`;
  const convo = await createConversation(session.user.id, "DAILY_CHECKIN", title, null);

  const firstBadge = await hasBadge(session.user.id, BADGE_KEYS.FIRST_STEP);
  if (!firstBadge) {
    await addConnectionEvent({
      userId: session.user.id,
      type: "ONBOARDING_COMPLETE",
      pointsAwarded: 10,
      note: "Onboarding complete",
      badgeKey: BADGE_KEYS.FIRST_STEP,
    });
  }

  return NextResponse.json({ conversationId: convo.id });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateCurrentMood, improveMood } from "@/lib/companion-mood";

export const dynamic = "force-dynamic";

/**
 * GET /api/pet/mood — returns current companion mood (with decay applied).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companionMood: true, lastInteraction: true, moodDecayRate: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentMood = calculateCurrentMood(
    user.companionMood,
    user.lastInteraction,
    user.moodDecayRate,
  );

  // Persist decayed mood if it changed
  if (currentMood !== user.companionMood) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { companionMood: currentMood },
    });
  }

  return NextResponse.json({ mood: currentMood });
}

/**
 * POST /api/pet/mood — record an interaction (feed, play, visit).
 * Improves mood by 1 level and resets lastInteraction.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companionMood: true, lastInteraction: true, moodDecayRate: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentMood = calculateCurrentMood(
    user.companionMood,
    user.lastInteraction,
    user.moodDecayRate,
  );
  const newMood = improveMood(currentMood);

  await prisma.user.update({
    where: { id: session.user.id },
    data: {
      companionMood: newMood,
      lastInteraction: new Date(),
    },
  });

  return NextResponse.json({ mood: newMood, improved: newMood !== currentMood });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyPlan, mondayOfWeekUTC } from "@/lib/ai/life-os-planner";
import type { LifeOsData } from "@/lib/life-os/types";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/life-os/generate
 * Generate (or regenerate) this week's plan from the saved Life OS profile.
 * Idempotent per (userId, weekStart) — overwrites existing week.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const profile = await prisma.lifeOsProfile.findUnique({
    where: { userId: session.user.id },
    select: { data: true },
  });
  if (!profile) {
    return NextResponse.json(
      { error: "Fill in your Life OS profile first." },
      { status: 400 },
    );
  }

  const weekStart = mondayOfWeekUTC(new Date());
  let plan;
  try {
    plan = await generateWeeklyPlan(profile.data as LifeOsData, weekStart);
  } catch (e) {
    return NextResponse.json(
      {
        error:
          e instanceof Error
            ? `Planner failed: ${e.message}`
            : "Planner failed. Try again in a minute.",
      },
      { status: 502 },
    );
  }

  const saved = await prisma.weeklyPlan.upsert({
    where: { userId_weekStart: { userId: session.user.id, weekStart } },
    create: { userId: session.user.id, weekStart, data: plan as unknown as Prisma.InputJsonValue },
    update: { data: plan as unknown as Prisma.InputJsonValue, createdAt: new Date() },
    select: { data: true, weekStart: true, createdAt: true },
  });

  return NextResponse.json({
    plan: saved.data,
    weekStart: saved.weekStart,
    createdAt: saved.createdAt,
  });
}

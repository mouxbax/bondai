import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyPlan, mondayOfWeekUTC } from "@/lib/ai/life-os-planner";
import type { LifeOsData } from "@/lib/life-os/types";
import type { Prisma } from "@prisma/client";
import {
  calculateCurrentEnergy,
  checkPlanCooldown,
  PLAN_GENERATION_COST,
} from "@/lib/energy";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * POST /api/life-os/generate
 * Generate (or regenerate) this week's plan from the saved Life OS profile.
 * Enforces 7-day cooldown and 50% energy cost.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch user energy + cooldown data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      energy: true,
      lastEnergyUpdate: true,
      lastPlanGeneratedAt: true,
    },
  });
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Check 7-day rolling cooldown
  const cooldown = checkPlanCooldown(user.lastPlanGeneratedAt);
  if (!cooldown.canGenerate) {
    return NextResponse.json(
      {
        error: "You can only generate a plan once every 7 days.",
        nextAvailableAt: cooldown.nextAvailableAt?.toISOString(),
      },
      { status: 429 },
    );
  }

  // Check energy
  const now = new Date();
  const currentEnergy = calculateCurrentEnergy(user.energy, user.lastEnergyUpdate, now);
  if (currentEnergy < PLAN_GENERATION_COST) {
    return NextResponse.json(
      {
        error: `Not enough energy. You need ${PLAN_GENERATION_COST}%, but you have ${currentEnergy}%.`,
        required: PLAN_GENERATION_COST,
        current: currentEnergy,
      },
      { status: 400 },
    );
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

  // Save plan + consume energy + set cooldown
  const [saved] = await Promise.all([
    prisma.weeklyPlan.upsert({
      where: { userId_weekStart: { userId: session.user.id, weekStart } },
      create: { userId: session.user.id, weekStart, data: plan as unknown as Prisma.InputJsonValue },
      update: { data: plan as unknown as Prisma.InputJsonValue, createdAt: new Date() },
      select: { data: true, weekStart: true, createdAt: true },
    }),
    prisma.user.update({
      where: { id: session.user.id },
      data: {
        energy: currentEnergy - PLAN_GENERATION_COST,
        lastEnergyUpdate: now,
        lastPlanGeneratedAt: now,
      },
    }),
  ]);

  return NextResponse.json({
    plan: saved.data,
    weekStart: saved.weekStart,
    createdAt: saved.createdAt,
    energy: currentEnergy - PLAN_GENERATION_COST,
  });
}

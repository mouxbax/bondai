import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import {
  calculateCurrentEnergy,
  checkPlanCooldown,
  MAX_ENERGY,
  PLAN_GENERATION_COST,
  PRACTICE_COST,
  BREATHING_RECHARGE,
} from "@/lib/energy";

export const dynamic = "force-dynamic";

/**
 * GET /api/energy — returns current energy level (with passive recharge applied)
 * and plan cooldown status.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

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

  const now = new Date();
  const currentEnergy = calculateCurrentEnergy(user.energy, user.lastEnergyUpdate, now);
  const cooldown = checkPlanCooldown(user.lastPlanGeneratedAt);

  // Persist recharged energy so we don't keep recalculating from stale base
  if (currentEnergy !== user.energy) {
    await prisma.user.update({
      where: { id: session.user.id },
      data: { energy: currentEnergy, lastEnergyUpdate: now },
    });
  }

  return NextResponse.json({
    energy: currentEnergy,
    maxEnergy: MAX_ENERGY,
    planCooldown: {
      canGenerate: cooldown.canGenerate,
      nextAvailableAt: cooldown.nextAvailableAt?.toISOString() ?? null,
    },
  });
}

const consumeSchema = z.object({
  action: z.enum(["plan_generation", "practice", "breathing"]),
});

/**
 * POST /api/energy — consume or recharge energy.
 * Body: { action: "plan_generation" | "practice" | "breathing" }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = consumeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

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

  const now = new Date();
  let currentEnergy = calculateCurrentEnergy(user.energy, user.lastEnergyUpdate, now);
  const { action } = parsed.data;

  // ─── Handle each action ────────────────────────────────────────────
  const updateData: Record<string, unknown> = { lastEnergyUpdate: now };

  if (action === "plan_generation") {
    // Check 7-day cooldown
    const cooldown = checkPlanCooldown(user.lastPlanGeneratedAt);
    if (!cooldown.canGenerate) {
      return NextResponse.json(
        {
          error: "Plan generation on cooldown",
          nextAvailableAt: cooldown.nextAvailableAt?.toISOString(),
        },
        { status: 429 },
      );
    }
    // Check energy
    if (currentEnergy < PLAN_GENERATION_COST) {
      return NextResponse.json(
        { error: "Not enough energy", required: PLAN_GENERATION_COST, current: currentEnergy },
        { status: 400 },
      );
    }
    currentEnergy -= PLAN_GENERATION_COST;
    updateData.lastPlanGeneratedAt = now;
  } else if (action === "practice") {
    if (currentEnergy < PRACTICE_COST) {
      return NextResponse.json(
        { error: "Not enough energy", required: PRACTICE_COST, current: currentEnergy },
        { status: 400 },
      );
    }
    currentEnergy -= PRACTICE_COST;
  } else if (action === "breathing") {
    currentEnergy = Math.min(MAX_ENERGY, currentEnergy + BREATHING_RECHARGE);
  }

  updateData.energy = currentEnergy;

  await prisma.user.update({
    where: { id: session.user.id },
    data: updateData,
  });

  return NextResponse.json({
    energy: currentEnergy,
    maxEnergy: MAX_ENERGY,
    action,
  });
}

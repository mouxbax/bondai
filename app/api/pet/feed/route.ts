import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateCurrentEnergy, MAX_ENERGY } from "@/lib/energy";
import { calculateCurrentMood, improveMood } from "@/lib/companion-mood";

export const dynamic = "force-dynamic";

const feedSchema = z.object({
  itemId: z.string(),
});

/**
 * POST /api/pet/feed — use a consumable item from inventory on the companion.
 * Decrements quantity and applies the item's effect (energy, mood).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = feedSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { itemId } = parsed.data;

  // Check inventory
  const inv = await prisma.petInventory.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
    include: { item: true },
  });

  if (!inv || inv.quantity <= 0) {
    return NextResponse.json({ error: "Item not in inventory" }, { status: 400 });
  }

  if (!inv.item.consumable) {
    return NextResponse.json({ error: "Item is not consumable" }, { status: 400 });
  }

  const effect = inv.item.effect as { energy?: number; moodBoost?: string; duration?: number } | null;
  const energyBoost = effect?.energy ?? 0;
  const now = new Date();

  // Transaction: decrement quantity + apply energy boost
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { energy: true, lastEnergyUpdate: true, companionMood: true, lastInteraction: true, moodDecayRate: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Block feeding if companion is already full
  const currentEnergy = calculateCurrentEnergy(user.energy, user.lastEnergyUpdate, now);
  if (currentEnergy >= MAX_ENERGY) {
    return NextResponse.json(
      { error: "full", message: "I'm full! Let's play instead!" },
      { status: 400 },
    );
  }

  await prisma.$transaction(async (tx) => {
    // Decrement inventory
    await tx.petInventory.update({
      where: { userId_itemId: { userId: session.user.id, itemId } },
      data: { quantity: { decrement: 1 } },
    });

    // Apply energy boost + mood improvement
    const currentMood = calculateCurrentMood(user.companionMood, user.lastInteraction, user.moodDecayRate, now);
    const newMood = improveMood(currentMood);

    await tx.user.update({
      where: { id: session.user.id },
      data: {
        ...(energyBoost > 0
          ? { energy: Math.min(MAX_ENERGY, currentEnergy + energyBoost), lastEnergyUpdate: now }
          : {}),
        companionMood: newMood,
        lastInteraction: now,
      },
    });
  });

  return NextResponse.json({
    success: true,
    item: inv.item.name,
    icon: inv.item.icon,
    ...(effect?.moodBoost ? { moodBoost: effect.moodBoost, duration: effect.duration } : {}),
    ...(energyBoost > 0 ? { energyRestored: energyBoost } : {}),
  });
}

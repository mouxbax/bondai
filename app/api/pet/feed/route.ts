import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { calculateCurrentMood, improveMood } from "@/lib/companion-mood";
import { EVO_XP_BY_RARITY } from "@/lib/evolution";

export const dynamic = "force-dynamic";

const feedSchema = z.object({
  itemId: z.string(),
});

/**
 * POST /api/pet/feed — use a consumable item from inventory on the companion.
 * Decrements quantity, gives EvoXP (for evolution), and improves mood.
 * Feeding does NOT restore energy — energy is only for plan generation.
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

  const effect = inv.item.effect as { evoXp?: number; moodBoost?: string; duration?: number } | null;
  const now = new Date();

  // Calculate EvoXP: use item effect if specified, otherwise use rarity default
  const evoXpGain = effect?.evoXp ?? EVO_XP_BY_RARITY[inv.item.rarity] ?? 5;

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { companionMood: true, lastInteraction: true, moodDecayRate: true, evoXp: true },
  });

  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  const currentMood = calculateCurrentMood(user.companionMood, user.lastInteraction, user.moodDecayRate, now);
  const newMood = improveMood(currentMood);

  await prisma.$transaction(async (tx) => {
    // Decrement inventory
    await tx.petInventory.update({
      where: { userId_itemId: { userId: session.user.id, itemId } },
      data: { quantity: { decrement: 1 } },
    });

    // Add EvoXP + improve mood + record interaction
    await tx.user.update({
      where: { id: session.user.id },
      data: {
        evoXp: { increment: evoXpGain },
        companionMood: newMood,
        lastInteraction: now,
      },
    });
  });

  return NextResponse.json({
    success: true,
    item: inv.item.name,
    icon: inv.item.icon,
    rarity: inv.item.rarity,
    evoXpGained: evoXpGain,
    newEvoXp: (user.evoXp ?? 0) + evoXpGain,
    ...(effect?.moodBoost ? { moodBoost: effect.moodBoost, duration: effect.duration } : {}),
  });
}

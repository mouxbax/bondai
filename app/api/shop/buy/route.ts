import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const buySchema = z.object({
  itemId: z.string(),
});

/**
 * POST /api/shop/buy — purchase an item from the shop.
 * Deducts coins and adds item to inventory.
 * Consumables go to inventory for later feeding (no instant energy/evoXP on buy).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = buySchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { itemId } = parsed.data;

  const [item, user] = await Promise.all([
    prisma.shopItem.findUnique({ where: { id: itemId } }),
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    }),
  ]);

  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (user.coins < item.price) {
    return NextResponse.json(
      { error: "Not enough coins", required: item.price, current: user.coins },
      { status: 400 },
    );
  }

  // For non-consumables, check if already owned
  if (!item.consumable) {
    const existing = await prisma.petInventory.findUnique({
      where: { userId_itemId: { userId: session.user.id, itemId } },
    });
    if (existing) {
      return NextResponse.json({ error: "Already owned" }, { status: 400 });
    }
  }

  await prisma.$transaction(async (tx) => {
    // Deduct coins
    await tx.user.update({
      where: { id: session.user.id },
      data: { coins: { decrement: item.price } },
    });

    // Add to inventory (upsert for consumables)
    if (item.consumable) {
      await tx.petInventory.upsert({
        where: { userId_itemId: { userId: session.user.id, itemId } },
        create: { userId: session.user.id, itemId, quantity: 1 },
        update: { quantity: { increment: 1 } },
      });
    } else {
      await tx.petInventory.create({
        data: { userId: session.user.id, itemId, quantity: 1 },
      });
    }
  });

  const effect = item.effect as { evoXp?: number; moodBoost?: string; duration?: number } | null;

  return NextResponse.json({
    success: true,
    item: item.name,
    coinsRemaining: user.coins - item.price,
    ...(effect?.moodBoost ? { moodBoost: effect.moodBoost } : {}),
  });
}

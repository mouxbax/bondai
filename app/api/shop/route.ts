import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/shop — returns shop catalog, user coins, and user inventory.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [user, items, inventory, equipped] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { coins: true },
    }),
    prisma.shopItem.findMany({ orderBy: [{ category: "asc" }, { price: "asc" }] }),
    prisma.petInventory.findMany({
      where: { userId: session.user.id },
      select: { itemId: true, quantity: true },
    }),
    prisma.petEquipped.findMany({
      where: { userId: session.user.id },
      select: { itemId: true, slot: true },
    }),
  ]);

  // Build inventory lookup
  const ownedMap: Record<string, number> = {};
  for (const inv of inventory) {
    ownedMap[inv.itemId] = inv.quantity;
  }

  const equippedMap: Record<string, string> = {};
  for (const eq of equipped) {
    equippedMap[eq.slot] = eq.itemId;
  }

  // Filter out seasonal items outside their availability window
  const now = new Date();
  const availableItems = items.filter((item) => {
    if (!item.seasonal) return true;
    if (item.availableFrom && now < new Date(item.availableFrom)) return false;
    if (item.availableUntil && now > new Date(item.availableUntil)) return false;
    return true;
  });

  return NextResponse.json({
    coins: user?.coins ?? 0,
    items: availableItems.map((item) => ({
      ...item,
      owned: ownedMap[item.id] ?? 0,
      equipped: Object.values(equippedMap).includes(item.id),
      // Include countdown for seasonal items
      ...(item.seasonal && item.availableUntil
        ? { expiresAt: item.availableUntil.toISOString() }
        : {}),
    })),
    equipped: equippedMap,
  });
}

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

  return NextResponse.json({
    coins: user?.coins ?? 0,
    items: items.map((item) => ({
      ...item,
      owned: ownedMap[item.id] ?? 0,
      equipped: Object.values(equippedMap).includes(item.id),
    })),
    equipped: equippedMap,
  });
}

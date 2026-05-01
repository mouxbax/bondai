import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/pet/inventory — returns ALL of the user's owned items.
 * Includes consumed items (qty=0) so they stay visible in the fridge/closet.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const inventory = await prisma.petInventory.findMany({
    where: { userId: session.user.id },
    include: {
      item: {
        select: {
          id: true,
          slug: true,
          name: true,
          description: true,
          category: true,
          icon: true,
          rarity: true,
          consumable: true,
          effect: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    items: inventory.map((inv) => ({
      inventoryId: inv.id,
      quantity: inv.quantity,
      ...inv.item,
      effect: inv.item.effect as { energy?: number; moodBoost?: string; duration?: number } | null,
    })),
  });
}

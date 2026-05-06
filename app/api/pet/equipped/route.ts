import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/pet/equipped — returns user's currently equipped items with full item details.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const equipped = await prisma.petEquipped.findMany({
    where: { userId: session.user.id },
    include: {
      item: {
        select: {
          id: true,
          slug: true,
          name: true,
          icon: true,
          rarity: true,
          category: true,
          effect: true,
        },
      },
    },
  });

  return NextResponse.json({
    equipped: equipped.map((e) => ({
      slot: e.slot,
      itemId: e.itemId,
      slug: e.item.slug,
      name: e.item.name,
      icon: e.item.icon,
      rarity: e.item.rarity,
      category: e.item.category,
      effect: e.item.effect,
    })),
  });
}

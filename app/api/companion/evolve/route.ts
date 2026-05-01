import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/companion/evolve — consume an Evolution Crystal from inventory.
 * Returns success if crystal was available and consumed.
 */
export async function POST() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Find the evolution crystal in the user's inventory
  const crystal = await prisma.petInventory.findFirst({
    where: {
      userId: session.user.id,
      item: { slug: "evo-crystal" },
      quantity: { gt: 0 },
    },
    include: { item: true },
  });

  if (!crystal) {
    return NextResponse.json(
      { error: "no_crystal", message: "You need an Evolution Crystal! Get one from the shop." },
      { status: 400 }
    );
  }

  // Consume one crystal
  await prisma.petInventory.update({
    where: { id: crystal.id },
    data: { quantity: { decrement: 1 } },
  });

  return NextResponse.json({ ok: true, message: "Evolution Crystal consumed! Your companion is evolving..." });
}

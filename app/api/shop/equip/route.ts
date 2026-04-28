import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const equipSchema = z.object({
  itemId: z.string(),
  slot: z.enum(["hat", "glasses", "background", "personality"]),
});

const unequipSchema = z.object({
  slot: z.enum(["hat", "glasses", "background", "personality"]),
});

/**
 * POST /api/shop/equip — equip an owned item.
 * Body: { itemId: string, slot: string }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = equipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { itemId, slot } = parsed.data;

  // Verify ownership
  const owned = await prisma.petInventory.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
  });
  if (!owned) {
    return NextResponse.json({ error: "Item not owned" }, { status: 400 });
  }

  // Upsert equipped (replaces previous item in same slot)
  await prisma.petEquipped.upsert({
    where: { userId_slot: { userId: session.user.id, slot } },
    create: { userId: session.user.id, itemId, slot },
    update: { itemId, equippedAt: new Date() },
  });

  return NextResponse.json({ success: true, slot, itemId });
}

/**
 * DELETE /api/shop/equip — unequip a slot.
 * Body: { slot: string }
 */
export async function DELETE(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = unequipSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  await prisma.petEquipped.deleteMany({
    where: { userId: session.user.id, slot: parsed.data.slot },
  });

  return NextResponse.json({ success: true });
}

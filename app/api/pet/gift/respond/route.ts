import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const respondSchema = z.object({
  giftId: z.string(),
  action: z.enum(["accept", "decline"]),
});

/**
 * POST /api/pet/gift/respond — accept or decline a gift.
 * Accept: adds item to receiver's inventory, marks gift as accepted.
 * Decline: returns item to sender's inventory, marks gift as declined.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = respondSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { giftId, action } = parsed.data;

  const gift = await prisma.gift.findUnique({
    where: { id: giftId },
    include: { item: true },
  });

  if (!gift) {
    return NextResponse.json({ error: "Gift not found" }, { status: 404 });
  }

  if (gift.receiverId !== session.user.id) {
    return NextResponse.json({ error: "Not your gift" }, { status: 403 });
  }

  if (gift.status !== "pending") {
    return NextResponse.json({ error: "Gift already responded to" }, { status: 400 });
  }

  await prisma.$transaction(async (tx) => {
    // Update gift status
    await tx.gift.update({
      where: { id: giftId },
      data: { status: action === "accept" ? "accepted" : "declined" },
    });

    if (action === "accept") {
      // Add to receiver's inventory (upsert)
      await tx.petInventory.upsert({
        where: { userId_itemId: { userId: session.user.id, itemId: gift.itemId } },
        create: {
          userId: session.user.id,
          itemId: gift.itemId,
          quantity: gift.quantity,
        },
        update: {
          quantity: { increment: gift.quantity },
        },
      });
    } else {
      // Return to sender
      await tx.petInventory.upsert({
        where: { userId_itemId: { userId: gift.senderId, itemId: gift.itemId } },
        create: {
          userId: gift.senderId,
          itemId: gift.itemId,
          quantity: gift.quantity,
        },
        update: {
          quantity: { increment: gift.quantity },
        },
      });
    }
  });

  return NextResponse.json({
    success: true,
    action,
    itemName: gift.item.name,
  });
}

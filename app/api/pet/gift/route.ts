import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const sendSchema = z.object({
  receiverEmail: z.string().email(),
  itemId: z.string(),
  quantity: z.number().int().min(1).max(10).default(1),
  message: z.string().max(200).optional(),
});

/**
 * POST /api/pet/gift — send an item from your inventory to another user.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = sendSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { receiverEmail, itemId, quantity, message } = parsed.data;

  // Find receiver
  const receiver = await prisma.user.findUnique({
    where: { email: receiverEmail },
    select: { id: true, name: true },
  });

  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (receiver.id === session.user.id) {
    return NextResponse.json({ error: "Can't gift yourself" }, { status: 400 });
  }

  // Check sender has the item
  const inv = await prisma.petInventory.findUnique({
    where: { userId_itemId: { userId: session.user.id, itemId } },
    include: { item: true },
  });

  if (!inv || inv.quantity < quantity) {
    return NextResponse.json({ error: "Not enough items" }, { status: 400 });
  }

  // Transaction: deduct from sender, create gift record
  await prisma.$transaction(async (tx) => {
    await tx.petInventory.update({
      where: { userId_itemId: { userId: session.user.id, itemId } },
      data: { quantity: { decrement: quantity } },
    });

    await tx.gift.create({
      data: {
        senderId: session.user.id,
        receiverId: receiver.id,
        itemId,
        quantity,
        message: message ?? null,
        status: "pending",
      },
    });
  });

  return NextResponse.json({
    success: true,
    receiverName: receiver.name,
    itemName: inv.item.name,
    quantity,
  });
}

/**
 * GET /api/pet/gift — get my gift inbox (pending + recent).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const gifts = await prisma.gift.findMany({
    where: { receiverId: session.user.id },
    include: {
      sender: { select: { name: true, image: true } },
      item: { select: { name: true, icon: true, rarity: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  // Also get sent gifts count
  const sentCount = await prisma.gift.count({
    where: { senderId: session.user.id },
  });

  return NextResponse.json({
    inbox: gifts.map((g) => ({
      id: g.id,
      senderName: g.sender.name,
      senderImage: g.sender.image,
      itemName: g.item.name,
      itemIcon: g.item.icon,
      itemRarity: g.item.rarity,
      quantity: g.quantity,
      message: g.message,
      status: g.status,
      createdAt: g.createdAt.toISOString(),
    })),
    sentCount,
  });
}

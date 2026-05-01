import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const nudgeSchema = z.object({
  receiverEmail: z.string().email(),
  message: z.string().max(200).optional(),
});

/**
 * POST /api/pet/nudge — send a nudge to a friend whose companion is lonely/sad.
 * Rate-limited to 3 nudges per receiver per day.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = nudgeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { receiverEmail, message } = parsed.data;

  // Find receiver
  const receiver = await prisma.user.findUnique({
    where: { email: receiverEmail },
    select: { id: true, name: true, companionMood: true },
  });

  if (!receiver) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  if (receiver.id === session.user.id) {
    return NextResponse.json({ error: "Can't nudge yourself" }, { status: 400 });
  }

  // Rate limit: 3 nudges to same person per day
  const dayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentNudges = await prisma.nudge.count({
    where: {
      senderId: session.user.id,
      receiverId: receiver.id,
      createdAt: { gte: dayAgo },
    },
  });

  if (recentNudges >= 3) {
    return NextResponse.json({ error: "Nudge limit reached (3/day)" }, { status: 429 });
  }

  await prisma.nudge.create({
    data: {
      senderId: session.user.id,
      receiverId: receiver.id,
      message: message ?? "Hey! Your companion misses you 🥺",
    },
  });

  return NextResponse.json({
    success: true,
    receiverName: receiver.name,
    receiverMood: receiver.companionMood,
  });
}

/**
 * GET /api/pet/nudge — get my received nudges (last 7 days).
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const nudges = await prisma.nudge.findMany({
    where: {
      receiverId: session.user.id,
      createdAt: { gte: weekAgo },
    },
    include: {
      sender: { select: { name: true, image: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 20,
  });

  return NextResponse.json({
    nudges: nudges.map((n) => ({
      id: n.id,
      senderName: n.sender.name,
      senderImage: n.sender.image,
      message: n.message,
      createdAt: n.createdAt.toISOString(),
    })),
  });
}

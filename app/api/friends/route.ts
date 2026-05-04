import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/friends — list accepted friends + pending requests
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;

  const friendships = await prisma.friendship.findMany({
    where: {
      OR: [{ userAId: uid }, { userBId: uid }],
    },
    include: {
      userA: { select: { id: true, name: true, image: true, xp: true, level: true, companionName: true, companionMood: true } },
      userB: { select: { id: true, name: true, image: true, xp: true, level: true, companionName: true, companionMood: true } },
    },
    orderBy: { updatedAt: "desc" },
  });

  const friends = friendships
    .filter((f) => f.status === "accepted")
    .map((f) => {
      const friend = f.userAId === uid ? f.userB : f.userA;
      return { id: f.id, friendshipId: f.id, ...friend };
    });

  const pendingIncoming = friendships
    .filter((f) => f.status === "pending" && f.userAId !== uid)
    .map((f) => ({ id: f.id, friendshipId: f.id, ...f.userA }));

  const pendingSent = friendships
    .filter((f) => f.status === "pending" && f.userAId === uid)
    .map((f) => ({ id: f.id, friendshipId: f.id, ...f.userB }));

  return NextResponse.json({ friends, pendingIncoming, pendingSent });
}

/**
 * POST /api/friends — send friend request by email
 * Body: { email: string }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const { email } = await req.json();

  if (!email || typeof email !== "string") {
    return NextResponse.json({ error: "Email required" }, { status: 400 });
  }

  const target = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!target) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }
  if (target.id === uid) {
    return NextResponse.json({ error: "Cannot add yourself" }, { status: 400 });
  }

  // Ensure consistent ordering (lower ID = userA)
  const [userAId, userBId] = [uid, target.id].sort();

  const existing = await prisma.friendship.findUnique({
    where: { userAId_userBId: { userAId, userBId } },
  });

  if (existing) {
    if (existing.status === "accepted") {
      return NextResponse.json({ error: "Already friends" }, { status: 400 });
    }
    if (existing.status === "pending") {
      return NextResponse.json({ error: "Request already pending" }, { status: 400 });
    }
    if (existing.status === "blocked") {
      return NextResponse.json({ error: "Cannot send request" }, { status: 400 });
    }
  }

  // userAId is the requester (current user is always the "sender" conceptually,
  // but we store with sorted IDs). We track who initiated via userAId = uid only
  // if uid < target.id, otherwise we flip logic in the GET handler.
  const friendship = await prisma.friendship.create({
    data: { userAId: uid < target.id ? uid : target.id, userBId: uid < target.id ? target.id : uid, status: "pending" },
  });

  return NextResponse.json({ ok: true, friendshipId: friendship.id });
}

/**
 * PATCH /api/friends — accept or decline a friend request
 * Body: { friendshipId: string, action: "accept" | "decline" }
 */
export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const { friendshipId, action } = await req.json();

  const friendship = await prisma.friendship.findUnique({ where: { id: friendshipId } });
  if (!friendship || (friendship.userAId !== uid && friendship.userBId !== uid)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  if (action === "accept") {
    await prisma.friendship.update({
      where: { id: friendshipId },
      data: { status: "accepted" },
    });
    return NextResponse.json({ ok: true, status: "accepted" });
  }

  if (action === "decline") {
    await prisma.friendship.delete({ where: { id: friendshipId } });
    return NextResponse.json({ ok: true, status: "removed" });
  }

  return NextResponse.json({ error: "Invalid action" }, { status: 400 });
}

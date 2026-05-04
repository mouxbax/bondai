import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/feed — activity feed from friends
 * Returns the last 30 activities from accepted friends, sorted by time.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;

  // Get friend IDs
  const friendships = await prisma.friendship.findMany({
    where: {
      status: "accepted",
      OR: [{ userAId: uid }, { userBId: uid }],
    },
    select: { userAId: true, userBId: true },
  });

  const friendIds = friendships.map((f) =>
    f.userAId === uid ? f.userBId : f.userAId
  );

  if (friendIds.length === 0) {
    return NextResponse.json({ activities: [], hasFriends: false });
  }

  const activities = await prisma.activityLog.findMany({
    where: {
      userId: { in: friendIds },
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          image: true,
          companionName: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
  });

  return NextResponse.json({
    activities: activities.map((a) => ({
      id: a.id,
      type: a.type,
      title: a.title,
      detail: a.detail,
      metadata: a.metadata,
      createdAt: a.createdAt.toISOString(),
      user: {
        id: a.user.id,
        name: a.user.name ?? "Anonymous",
        image: a.user.image,
        companionName: a.user.companionName,
      },
    })),
    hasFriends: true,
  });
}

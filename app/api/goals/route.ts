import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

/** GET — fetch all goals for the user */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const goals = await prisma.socialGoal.findMany({
    where: { userId: session.user.id },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });

  return NextResponse.json({ goals });
}

/** POST — create a new goal */
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, description, targetDate } = (await req.json()) as {
    title: string;
    description?: string;
    targetDate?: string;
  };

  if (!title?.trim()) {
    return NextResponse.json({ error: "Title required" }, { status: 400 });
  }

  const goal = await prisma.socialGoal.create({
    data: {
      userId: session.user.id,
      title: title.trim(),
      description: description?.trim() || "",
      targetDate: targetDate ? new Date(targetDate) : null,
    },
  });

  return NextResponse.json({ goal }, { status: 201 });
}

/** PATCH — update goal status */
export async function PATCH(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, status } = (await req.json()) as {
    id: string;
    status: "ACTIVE" | "COMPLETED" | "ABANDONED";
  };

  if (!id || !status) {
    return NextResponse.json({ error: "Missing id or status" }, { status: 400 });
  }

  const goal = await prisma.socialGoal.updateMany({
    where: { id, userId: session.user.id },
    data: {
      status,
      completedAt: status === "COMPLETED" ? new Date() : null,
    },
  });

  return NextResponse.json({ updated: goal.count });
}

import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET — fetch task completions for the current week
 * POST — toggle a task completion { day: "monday", taskIndex: 0, completed: true }
 *
 * Stores completions as JSON on the WeeklyPlan row (progressData field).
 * Shape: { monday: [true, false, true], tuesday: [false, false] }
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const plan = await prisma.weeklyPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, progressData: true, data: true },
  });

  if (!plan) {
    return NextResponse.json({ progress: {}, stats: null });
  }

  const progress = (plan.progressData as Record<string, boolean[]>) ?? {};
  const data = plan.data as { days?: { key: string; blocks: unknown[] }[] } | null;
  const stats = computeStats(progress, data);

  return NextResponse.json({ progress, stats });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { day, taskIndex, completed } = body as {
    day: string;
    taskIndex: number;
    completed: boolean;
  };

  if (!day || taskIndex == null) {
    return NextResponse.json({ error: "Missing day or taskIndex" }, { status: 400 });
  }

  const plan = await prisma.weeklyPlan.findFirst({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    select: { id: true, progressData: true, data: true },
  });

  if (!plan) {
    return NextResponse.json({ error: "No plan found" }, { status: 404 });
  }

  const progress = ((plan.progressData as Record<string, boolean[]>) ?? {}) as Record<string, boolean[]>;
  if (!progress[day]) progress[day] = [];

  // Expand array if needed
  while (progress[day].length <= taskIndex) {
    progress[day].push(false);
  }
  progress[day][taskIndex] = completed;

  await prisma.weeklyPlan.update({
    where: { id: plan.id },
    data: { progressData: progress },
  });

  const data = plan.data as { days?: { key: string; blocks: unknown[] }[] } | null;
  const stats = computeStats(progress, data);

  return NextResponse.json({ progress, stats });
}

function computeStats(
  progress: Record<string, boolean[]>,
  data: { days?: { key: string; blocks: unknown[] }[] } | null,
) {
  if (!data?.days) return { completed: 0, total: 0, percent: 0 };

  let total = 0;
  let completed = 0;

  for (const day of data.days) {
    const dayTasks = day.blocks?.length ?? 0;
    total += dayTasks;
    const dayProgress = progress[day.key] ?? [];
    completed += dayProgress.filter(Boolean).length;
  }

  return {
    completed,
    total,
    percent: total > 0 ? Math.round((completed / total) * 100) : 0,
  };
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { generateWeeklyPlan, mondayOfWeekUTC } from "@/lib/ai/life-os-planner";
import type { LifeOsData } from "@/lib/life-os/types";
import type { Prisma } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 300;

/**
 * Weekly cron — Sunday 18:00 UTC.
 * Regenerates the upcoming week's plan for every user with a Life OS profile.
 * Uses NEXT Monday (not the current week) so users wake up Monday with a fresh plan.
 */
export async function GET(req: Request) {
  const authHeader = req.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Next Monday = mondayOfWeekUTC(today) + 7 days.
  const nextMonday = mondayOfWeekUTC(new Date());
  nextMonday.setUTCDate(nextMonday.getUTCDate() + 7);

  const profiles = await prisma.lifeOsProfile.findMany({
    select: { userId: true, data: true },
  });

  let generated = 0;
  const errors: string[] = [];

  for (const p of profiles) {
    try {
      const plan = await generateWeeklyPlan(p.data as LifeOsData, nextMonday);
      await prisma.weeklyPlan.upsert({
        where: { userId_weekStart: { userId: p.userId, weekStart: nextMonday } },
        create: {
          userId: p.userId,
          weekStart: nextMonday,
          data: plan as unknown as Prisma.InputJsonValue,
        },
        update: { data: plan as unknown as Prisma.InputJsonValue, createdAt: new Date() },
      });
      generated++;
    } catch (e) {
      errors.push(`${p.userId}: ${e instanceof Error ? e.message : "unknown"}`);
    }
  }

  return NextResponse.json({
    ok: true,
    weekStart: nextMonday.toISOString(),
    profiles: profiles.length,
    generated,
    errors: errors.slice(0, 10),
  });
}

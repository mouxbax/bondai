import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { lifeOsSchema, type LifeOsData } from "@/lib/life-os/types";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET  /api/life-os  → { profile, latestPlan }
 * PUT  /api/life-os  → save profile (full replace with merged defaults)
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const [profile, latestPlan] = await Promise.all([
    prisma.lifeOsProfile.findUnique({
      where: { userId: session.user.id },
      select: { data: true, updatedAt: true },
    }),
    prisma.weeklyPlan.findFirst({
      where: { userId: session.user.id },
      orderBy: { weekStart: "desc" },
      select: { data: true, weekStart: true, createdAt: true },
    }),
  ]);
  return NextResponse.json({
    profile: (profile?.data ?? {}) as LifeOsData,
    updatedAt: profile?.updatedAt ?? null,
    latestPlan: latestPlan
      ? { data: latestPlan.data, weekStart: latestPlan.weekStart, createdAt: latestPlan.createdAt }
      : null,
  });
}

export async function PUT(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = lifeOsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid Life OS data", issues: parsed.error.issues.slice(0, 6) },
      { status: 400 },
    );
  }
  const data = parsed.data as LifeOsData;
  const saved = await prisma.lifeOsProfile.upsert({
    where: { userId: session.user.id },
    create: { userId: session.user.id, data },
    update: { data },
    select: { data: true, updatedAt: true },
  });
  return NextResponse.json({ profile: saved.data, updatedAt: saved.updatedAt });
}

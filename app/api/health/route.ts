import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET /api/health — diagnostic endpoint to test Prisma connection
 * and report any errors in full.
 */
export async function GET() {
  const checks: Record<string, unknown> = {
    timestamp: new Date().toISOString(),
    env: {
      DATABASE_URL: process.env.DATABASE_URL ? "SET" : "MISSING",
      DIRECT_URL: process.env.DIRECT_URL ? "SET" : "MISSING",
      AUTH_SECRET: process.env.AUTH_SECRET ? "SET" : "MISSING",
    },
  };

  // Test 1: basic Prisma connection
  try {
    const count = await prisma.user.count();
    checks.prisma = { status: "ok", userCount: count };
  } catch (err: unknown) {
    const e = err as Error;
    checks.prisma = {
      status: "error",
      name: e.name,
      message: e.message,
      stack: e.stack?.slice(0, 500),
    };
  }

  // Test 2: query with select (matching layout query)
  try {
    const user = await prisma.user.findFirst({
      select: {
        id: true,
        name: true,
        energy: true,
        lastEnergyUpdate: true,
        onboardingComplete: true,
        subscriptionStatus: true,
      },
    });
    checks.queryTest = { status: "ok", hasUser: !!user };
  } catch (err: unknown) {
    const e = err as Error;
    checks.queryTest = {
      status: "error",
      name: e.name,
      message: e.message,
    };
  }

  const hasError = Object.values(checks).some(
    (v) => typeof v === "object" && v !== null && "status" in v && (v as { status: string }).status === "error"
  );

  return NextResponse.json(checks, { status: hasError ? 500 : 200 });
}

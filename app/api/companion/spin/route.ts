import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * POST /api/companion/spin — deduct coins for a paid spin.
 * Free spins are client-side only (localStorage tracking).
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { cost } = (await req.json()) as { cost?: number };
  const spinCost = cost ?? 10;

  if (spinCost <= 0) {
    return NextResponse.json({ ok: true }); // free spin, no server cost
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  if (!user || user.coins < spinCost) {
    return NextResponse.json({ error: "Not enough coins" }, { status: 400 });
  }

  await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { decrement: spinCost } },
  });

  return NextResponse.json({ ok: true, coins: user.coins - spinCost });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";
import { COIN_REWARDS } from "@/lib/shop/items";

export const dynamic = "force-dynamic";

/**
 * GET /api/coins — get user's coin balance.
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { coins: true },
  });

  return NextResponse.json({ coins: user?.coins ?? 0 });
}

const rewardSchema = z.object({
  action: z.enum([
    "dailyCheckin",
    "coachingComplete",
    "goalComplete",
    "breathingSession",
  ]),
});

/**
 * POST /api/coins — award coins for completing an action.
 * Body: { action: string }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = rewardSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  }

  const amount = COIN_REWARDS[parsed.data.action];

  const user = await prisma.user.update({
    where: { id: session.user.id },
    data: { coins: { increment: amount } },
    select: { coins: true },
  });

  return NextResponse.json({
    coins: user.coins,
    earned: amount,
    action: parsed.data.action,
  });
}

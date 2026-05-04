import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const REFERRAL_REWARD_COINS = 50;

function generateCode(name: string | null): string {
  const prefix = (name ?? "AIAH").replace(/[^A-Z0-9]/gi, "").toUpperCase().slice(0, 5);
  const suffix = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${prefix}${suffix}`;
}

/**
 * GET /api/referral — get current user's referral code + stats
 */
export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { referralCode: true, coins: true },
  });

  // Generate referral code on first access
  if (!user?.referralCode) {
    const fullUser = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true },
    });
    let code = generateCode(fullUser?.name ?? null);
    // Ensure unique
    let attempts = 0;
    while (attempts < 5) {
      const exists = await prisma.user.findUnique({ where: { referralCode: code } });
      if (!exists) break;
      code = generateCode(fullUser?.name ?? null);
      attempts++;
    }
    user = await prisma.user.update({
      where: { id: session.user.id },
      data: { referralCode: code },
      select: { referralCode: true, coins: true },
    });
  }

  // Count referrals
  const referralCount = await prisma.user.count({
    where: { referredById: session.user.id },
  });

  return NextResponse.json({
    code: user!.referralCode,
    referralCount,
    rewardPerReferral: REFERRAL_REWARD_COINS,
    shareUrl: `https://aiah.app?ref=${user!.referralCode}`,
  });
}

/**
 * POST /api/referral — apply a referral code (new user entering a friend's code)
 * Body: { code: string }
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const uid = session.user.id;
  const { code } = await req.json();

  if (!code || typeof code !== "string") {
    return NextResponse.json({ error: "Code required" }, { status: 400 });
  }

  // Check if user already used a referral
  const me = await prisma.user.findUnique({
    where: { id: uid },
    select: { referredById: true, referralCode: true },
  });

  if (me?.referredById) {
    return NextResponse.json({ error: "Already used a referral code" }, { status: 400 });
  }

  // Can't use own code
  if (me?.referralCode === code.toUpperCase()) {
    return NextResponse.json({ error: "Cannot use your own code" }, { status: 400 });
  }

  // Find referrer
  const referrer = await prisma.user.findUnique({
    where: { referralCode: code.toUpperCase() },
    select: { id: true },
  });

  if (!referrer) {
    return NextResponse.json({ error: "Invalid code" }, { status: 404 });
  }

  // Apply referral: mark user as referred + reward both
  await prisma.$transaction([
    prisma.user.update({
      where: { id: uid },
      data: {
        referredById: referrer.id,
        coins: { increment: REFERRAL_REWARD_COINS },
      },
    }),
    prisma.user.update({
      where: { id: referrer.id },
      data: {
        coins: { increment: REFERRAL_REWARD_COINS },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    reward: REFERRAL_REWARD_COINS,
    message: `You and your friend both got ${REFERRAL_REWARD_COINS} coins!`,
  });
}

import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

/**
 * GET  /api/account  — return the current user's profile fields.
 * PATCH /api/account — update any subset of profile fields.
 */

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      timezone: true,
      anxietyLevel: true,
      age: true,
      sex: true,
      interests: true,
      likes: true,
      dislikes: true,
      bio: true,
      memorySnippet: true,
      createdAt: true,
      subscriptionPlan: true,
      subscriptionStatus: true,
    },
  });

  if (!user) {
    return NextResponse.json(
      { error: "Your account no longer exists. Sign out and create a new one." },
      { status: 404 },
    );
  }

  return NextResponse.json({ user });
}

const patchSchema = z.object({
  name: z.string().trim().min(1).max(80).optional(),
  city: z.string().trim().max(120).optional().nullable(),
  age: z.number().int().min(13).max(120).optional().nullable(),
  sex: z.string().trim().max(40).optional().nullable(),
  interests: z.array(z.string().trim().max(40)).max(20).optional(),
  likes: z.string().trim().max(500).optional().nullable(),
  dislikes: z.string().trim().max(500).optional().nullable(),
  bio: z.string().trim().max(1000).optional().nullable(),
  memorySnippet: z.string().trim().max(1000).optional().nullable(),
  anxietyLevel: z.number().int().min(0).max(10).optional().nullable(),
});

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = patchSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Invalid fields", issues: parsed.error.flatten() },
      { status: 400 },
    );
  }

  const updated = await prisma.user.update({
    where: { id: session.user.id },
    data: parsed.data,
    select: {
      id: true,
      name: true,
      email: true,
      city: true,
      age: true,
      sex: true,
      interests: true,
      likes: true,
      dislikes: true,
      bio: true,
      memorySnippet: true,
      anxietyLevel: true,
    },
  });

  return NextResponse.json({ user: updated });
}

/**
 * DELETE /api/account — permanently remove the current user.
 *
 * Cascades through Account, Session, Conversation, Message, SocialGoal,
 * ConnectionEvent, UserStreak, CrisisLog (all `onDelete: Cascade` in schema).
 * Stripe subscription cleanup is intentionally out of scope here — surface
 * a separate flow if you ever need to cancel paid subs at the same time.
 */
export async function DELETE() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await prisma.user.delete({ where: { id: session.user.id } });
  } catch (e) {
    // Already gone — treat as success so the client can still sign out cleanly.
    const code = (e as { code?: string })?.code;
    if (code !== "P2025") {
      return NextResponse.json(
        { error: "Could not delete your account. Please try again." },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ ok: true });
}

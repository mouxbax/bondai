import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

const syncSchema = z.object({
  evoXp: z.number().int().min(0),
});

/**
 * POST /api/pet/evo-xp — sync EvoXP from client localStorage to server DB.
 * Called after feeding so evolution progress persists server-side.
 */
export async function POST(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const parsed = syncSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  }

  const { evoXp } = parsed.data;

  await prisma.user.update({
    where: { id: session.user.id },
    data: { evoXp },
  });

  return NextResponse.json({ evoXp });
}

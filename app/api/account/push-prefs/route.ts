import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { prisma } from "@/lib/db/prisma";

const prefsSchema = z.object({
  enabled: z.boolean().optional(),
  morning: z.boolean().optional(),
  midday: z.boolean().optional(),
  afternoon: z.boolean().optional(),
  evening: z.boolean().optional(),
  night: z.boolean().optional(),
  quietStart: z.number().int().min(0).max(23).optional(),
  quietEnd: z.number().int().min(0).max(23).optional(),
});

const DEFAULTS = {
  enabled: true,
  morning: true,
  midday: true,
  afternoon: false,
  evening: true,
  night: false,
  quietStart: 22,
  quietEnd: 7,
};

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushPrefs: true },
  });
  const prefs = { ...DEFAULTS, ...((user?.pushPrefs as Record<string, unknown>) ?? {}) };
  return NextResponse.json({ prefs });
}

export async function PATCH(req: Request) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const json = await req.json().catch(() => null);
  const parsed = prefsSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
  }
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { pushPrefs: true },
  });
  const current = (user?.pushPrefs as Record<string, unknown>) ?? {};
  const next = { ...DEFAULTS, ...current, ...parsed.data };
  await prisma.user.update({
    where: { id: session.user.id },
    data: { pushPrefs: next },
  });
  return NextResponse.json({ prefs: next });
}

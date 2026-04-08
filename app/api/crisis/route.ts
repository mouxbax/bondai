import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import { CRISIS_RESOURCES } from "@/lib/ai/crisis";
import { prisma } from "@/lib/db/prisma";

/**
 * curl -X POST http://localhost:3000/api/crisis -H "Content-Type: application/json" \
 *   -d '{"conversationId":"...","severity":"high","keywords":["test"]}' -H "Cookie: ..."
 */

const bodySchema = z.object({
  conversationId: z.string().optional(),
  severity: z.enum(["low", "medium", "high"]),
  keywords: z.array(z.string()),
});

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  await prisma.crisisLog.create({
    data: {
      userId: session.user.id,
      conversationId: parsed.data.conversationId ?? null,
      severity: parsed.data.severity,
      keywords: parsed.data.keywords,
    },
  });

  return NextResponse.json({ resources: CRISIS_RESOURCES });
}

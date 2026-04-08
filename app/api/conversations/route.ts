import { NextResponse } from "next/server";
import { z } from "zod";
import { auth } from "@/auth";
import type { ConversationType } from "@prisma/client";
import {
  createConversation,
  findDailyCheckinForUtcDay,
  listConversationsForUser,
} from "@/lib/db/queries/conversations";

/**
 * List:
 * curl http://localhost:3000/api/conversations -H "Cookie: ..."
 *
 * Create:
 * curl -X POST http://localhost:3000/api/conversations -H "Content-Type: application/json" \
 *   -d '{"type":"GENERAL"}' -H "Cookie: ..."
 */

const createSchema = z.object({
  type: z.enum(["DAILY_CHECKIN", "SOCIAL_COACHING", "GENERAL", "CRISIS"]),
  scenarioId: z.string().optional(),
  title: z.string().optional(),
});

export async function GET(): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const rows = await listConversationsForUser(session.user.id);
  return NextResponse.json({
    conversations: rows.map((c) => ({
      id: c.id,
      title: c.title,
      type: c.type,
      scenarioId: c.scenarioId,
      updatedAt: c.updatedAt,
      lastMessagePreview: c.lastMessagePreview,
      unreadCount: c.unreadCount,
    })),
  });
}

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = createSchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const type = parsed.data.type as ConversationType;
  const now = new Date();

  if (type === "DAILY_CHECKIN") {
    const existing = await findDailyCheckinForUtcDay(session.user.id, now);
    if (existing) {
      return NextResponse.json({ conversationId: existing.id, existing: true });
    }
  }

  const title =
    parsed.data.title ??
    (type === "DAILY_CHECKIN"
      ? `Check-in · ${now.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
      : type === "SOCIAL_COACHING"
        ? "Social coaching"
        : type === "CRISIS"
          ? "Support chat"
          : "Conversation");

  const convo = await createConversation(session.user.id, type, title, parsed.data.scenarioId ?? null);

  return NextResponse.json({ conversationId: convo.id, existing: false });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { markConversationRead } from "@/lib/db/queries/conversations";
import { prisma } from "@/lib/db/prisma";

/**
 * GET /api/chat/:conversationId — load conversation + messages for the client.
 * Returns the last 100 messages (enough for scroll-back, fast load).
 */
export async function GET(
  _req: Request,
  context: { params: Promise<{ conversationId: string }> }
): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { conversationId } = await context.params;

  // Parallel: load conversation metadata + last 100 messages + mark read
  const [convo, messages] = await Promise.all([
    prisma.conversation.findFirst({
      where: { id: conversationId, userId: session.user.id },
    }),
    prisma.message.findMany({
      where: { conversationId },
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        role: true,
        content: true,
        createdAt: true,
        emotionTag: true,
        voiceUsed: true,
      },
    }),
    markConversationRead(conversationId, session.user.id),
  ]);

  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Reverse to chronological order
  messages.reverse();

  return NextResponse.json({
    conversation: {
      id: convo.id,
      title: convo.title,
      type: convo.type,
      scenarioId: convo.scenarioId,
      createdAt: convo.createdAt,
      updatedAt: convo.updatedAt,
      crisisFlaggedAt: convo.crisisFlaggedAt,
      crisisFollowUpDueAt: convo.crisisFollowUpDueAt,
    },
    messages,
  });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getConversationForUser, markConversationRead } from "@/lib/db/queries/conversations";

/**
 * Example:
 * curl http://localhost:3000/api/chat/<conversationId> -H "Cookie: ..."
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
  const convo = await getConversationForUser(conversationId, session.user.id);
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await markConversationRead(conversationId, session.user.id);

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
    messages: convo.messages.map((m) => ({
      id: m.id,
      role: m.role,
      content: m.content,
      createdAt: m.createdAt,
      emotionTag: m.emotionTag,
      voiceUsed: m.voiceUsed,
    })),
  });
}

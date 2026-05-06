import type { ConversationType } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import { startOfUtcDay } from "@/lib/utils";

export async function listConversationsForUser(userId: string) {
  const convos = await prisma.conversation.findMany({
    where: { userId },
    orderBy: { updatedAt: "desc" },
    include: {
      messages: {
        orderBy: { createdAt: "desc" },
        take: 1,
      },
    },
  });

  return convos.map((c) => {
    const last = c.messages[0];
    const unread =
      c.lastReadAt && last && last.role === "ASSISTANT" && last.createdAt > c.lastReadAt
        ? 1
        : last && last.role === "ASSISTANT" && !c.lastReadAt
          ? 1
          : 0;
    return {
      ...c,
      lastMessagePreview: last ? last.content.slice(0, 120) : null,
      unreadCount: unread,
    };
  });
}

export async function getConversationForUser(conversationId: string, userId: string) {
  return prisma.conversation.findFirst({
    where: { id: conversationId, userId },
    include: {
      // Only load the last 40 messages for context window.
      // Full history is loaded client-side via the GET endpoint.
      messages: { orderBy: { createdAt: "desc" }, take: 40 },
    },
  }).then((c) => {
    if (c) {
      // Reverse so messages are in chronological order
      c.messages.reverse();
    }
    return c;
  });
}

export async function createConversation(
  userId: string,
  type: ConversationType,
  title: string,
  scenarioId?: string | null
) {
  return prisma.conversation.create({
    data: {
      userId,
      type,
      title,
      scenarioId: scenarioId ?? null,
    },
  });
}

export async function touchConversation(conversationId: string) {
  return prisma.conversation.update({
    where: { id: conversationId },
    data: { updatedAt: new Date() },
  });
}

export async function markConversationRead(conversationId: string, userId: string) {
  return prisma.conversation.updateMany({
    where: { id: conversationId, userId },
    data: { lastReadAt: new Date() },
  });
}

export async function findDailyCheckinForUtcDay(userId: string, day: Date) {
  const start = startOfUtcDay(day);
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);

  return prisma.conversation.findFirst({
    where: {
      userId,
      type: "DAILY_CHECKIN",
      createdAt: { gte: start, lt: end },
    },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });
}

export async function countUserMessagesInConversation(conversationId: string): Promise<number> {
  return prisma.message.count({
    where: { conversationId, role: "USER" },
  });
}

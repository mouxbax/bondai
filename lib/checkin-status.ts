import { prisma } from "@/lib/db/prisma";
import { findDailyCheckinForUtcDay } from "@/lib/db/queries/conversations";

export async function userNeedsDailyCheckin(userId: string): Promise<boolean> {
  const now = new Date();
  const convo = await findDailyCheckinForUtcDay(userId, now);
  if (!convo) return true;
  const userMsgs = await prisma.message.count({
    where: { conversationId: convo.id, role: "USER" },
  });
  return userMsgs < 1;
}

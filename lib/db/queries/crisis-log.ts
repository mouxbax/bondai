import { prisma } from "@/lib/db/prisma";
import type { CrisisPayload } from "@/types";

/** Persist crisis classification from chat (privacy: no third-party alerts). */
export async function logCrisisEvent(
  userId: string,
  conversationId: string,
  crisis: CrisisPayload
): Promise<void> {
  await prisma.crisisLog.create({
    data: {
      userId,
      conversationId,
      severity: crisis.severity,
      keywords: crisis.keywords,
    },
  });
}

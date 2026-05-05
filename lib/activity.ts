import { prisma } from "@/lib/db/prisma";

export type ActivityType =
  | "streak"
  | "evolution"
  | "achievement"
  | "goal_completed"
  | "level_up"
  | "gift_sent";

/**
 * Log a user activity for the social feed.
 * Fire-and-forget — never throw.
 */
export async function logActivity(
  userId: string,
  type: ActivityType,
  title: string,
  detail?: string,
  metadata?: Record<string, unknown>,
): Promise<void> {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type,
        title,
        detail: detail ?? null,
        metadata: metadata ? (metadata as Record<string, string | number | boolean | null>) : undefined,
      },
    });
  } catch (e) {
    console.error("[activity] Failed to log:", e);
  }
}

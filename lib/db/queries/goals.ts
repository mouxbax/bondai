import type { SocialGoalStatus } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function listGoals(userId: string) {
  return prisma.socialGoal.findMany({
    where: { userId },
    orderBy: [{ status: "asc" }, { createdAt: "desc" }],
  });
}

export async function createGoal(
  userId: string,
  data: { title: string; description: string; targetDate?: Date | null }
) {
  return prisma.socialGoal.create({
    data: {
      userId,
      title: data.title,
      description: data.description,
      targetDate: data.targetDate ?? null,
    },
  });
}

export async function updateGoal(
  userId: string,
  goalId: string,
  data: { title?: string; description?: string; status?: SocialGoalStatus; targetDate?: Date | null }
) {
  return prisma.socialGoal.updateMany({
    where: { id: goalId, userId },
    data: {
      ...data,
      ...(data.status === "COMPLETED" ? { completedAt: new Date() } : {}),
    },
  });
}

export async function getGoal(userId: string, goalId: string) {
  return prisma.socialGoal.findFirst({
    where: { id: goalId, userId },
  });
}

export async function deleteGoal(userId: string, goalId: string) {
  return prisma.socialGoal.deleteMany({
    where: { id: goalId, userId },
  });
}

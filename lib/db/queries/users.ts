import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";

export async function getUserById(id: string) {
  return prisma.user.findUnique({
    where: { id },
    include: { streak: true },
  });
}

export async function getUserByEmail(email: string) {
  return prisma.user.findUnique({
    where: { email },
    include: { streak: true },
  });
}

export async function updateUserProfile(
  userId: string,
  data: {
    name?: string;
    onboardingComplete?: boolean;
    connectionScore?: number;
    timezone?: string | null;
    city?: string | null;
    anxietyLevel?: number | null;
    voicePreferred?: boolean;
    onboardingSituations?: Prisma.InputJsonValue;
    memorySnippet?: string | null;
  }
) {
  return prisma.user.update({
    where: { id: userId },
    data,
  });
}

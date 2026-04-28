import { prisma } from "@/lib/db/prisma";

export interface Nudge {
  id: string;
  type: "checkin" | "streak" | "goal" | "social" | "mood" | "coaching";
  title: string;
  message: string;
  action?: { label: string; href: string };
  priority: number; // 1-10, higher = more urgent
}

/**
 * Generate smart, contextual nudges for a user based on their behavior patterns.
 * Returns up to 3 most relevant nudges, ordered by priority.
 */
export async function generateNudges(userId: string): Promise<Nudge[]> {
  const nudges: Nudge[] = [];

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      streak: true,
      socialGoals: { where: { status: "ACTIVE" }, orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
  if (!user) return [];

  const now = new Date();
  const todayStart = new Date(now);
  todayStart.setUTCHours(0, 0, 0, 0);

  // 1. Check-in nudge - most important daily action
  const todayCheckin = await prisma.conversation.findFirst({
    where: { userId, type: "DAILY_CHECKIN", createdAt: { gte: todayStart } },
  });
  if (!todayCheckin) {
    const hour = now.getUTCHours();
    const timeOfDay = hour < 12 ? "morning" : hour < 17 ? "afternoon" : "evening";
    nudges.push({
      id: "daily-checkin",
      type: "checkin",
      title: `Good ${timeOfDay}`,
      message: "Take 2 minutes for your daily check-in - how are you really feeling today?",
      action: { label: "Start check-in", href: "/home" },
      priority: 10,
    });
  }

  // 2. Streak at risk
  const streak = user.streak;
  if (streak && streak.currentStreak > 0 && !todayCheckin) {
    nudges.push({
      id: "streak-risk",
      type: "streak",
      title: `${streak.currentStreak}-day streak at risk`,
      message: `You've been showing up for ${streak.currentStreak} days straight. Don't break the chain!`,
      action: { label: "Keep streak alive", href: "/home" },
      priority: 9,
    });
  }

  // 3. Streak milestone approaching
  if (streak && streak.currentStreak > 0) {
    const milestones = [7, 14, 21, 30, 60, 90];
    const nextMilestone = milestones.find((m) => m > streak.currentStreak);
    if (nextMilestone && nextMilestone - streak.currentStreak <= 2) {
      nudges.push({
        id: "streak-milestone",
        type: "streak",
        title: "Almost there!",
        message: `You're ${nextMilestone - streak.currentStreak} day${nextMilestone - streak.currentStreak > 1 ? "s" : ""} from a ${nextMilestone}-day streak milestone.`,
        priority: 7,
      });
    }
  }

  // 4. No active goals
  if (user.socialGoals.length === 0) {
    nudges.push({
      id: "no-goals",
      type: "goal",
      title: "Set a tiny goal",
      message: "Even small goals build momentum. What's one social thing you could try this week?",
      action: { label: "Add a goal", href: "/goals" },
      priority: 6,
    });
  }

  // 5. Stale goals - active goals older than 7 days with no recent events
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const staleGoals = user.socialGoals.filter(
    (g) => g.createdAt < weekAgo
  );
  if (staleGoals.length > 0) {
    nudges.push({
      id: "stale-goals",
      type: "goal",
      title: "Check in on your goals",
      message: `"${staleGoals[0].title}" has been active for a while. Ready to complete it or adjust?`,
      action: { label: "Review goals", href: "/goals" },
      priority: 5,
    });
  }

  // 6. Low life score encouragement
  if (user.connectionScore < 20) {
    nudges.push({
      id: "low-score",
      type: "social",
      title: "Every step counts",
      message: "Your life score grows with each check-in, goal, and action you complete. You're building something.",
      action: { label: "View score", href: "/score" },
      priority: 4,
    });
  }

  // 7. Haven't tried coaching
  const coachingCount = await prisma.conversation.count({
    where: { userId, type: "SOCIAL_COACHING" },
  });
  if (coachingCount === 0) {
    nudges.push({
      id: "try-coaching",
      type: "coaching",
      title: "Practice makes confident",
      message: "Try a coaching scenario - rehearse a tricky conversation in a safe space.",
      action: { label: "Start practicing", href: "/coaching" },
      priority: 3,
    });
  }

  // 8. Recent negative mood pattern
  const recentMessages = await prisma.message.findMany({
    where: {
      conversation: { userId },
      role: "USER",
      emotionTag: { in: ["SAD", "ANXIOUS", "LONELY"] },
      createdAt: { gte: new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000) },
    },
    select: { emotionTag: true },
    take: 10,
  });
  if (recentMessages.length >= 3) {
    nudges.push({
      id: "mood-pattern",
      type: "mood",
      title: "We see you",
      message: "You've been going through a lot lately. Talking about it can help - even with AIAH.",
      action: { label: "Check in now", href: "/home" },
      priority: 8,
    });
  }

  // Sort by priority (highest first) and return top 3
  return nudges
    .sort((a, b) => b.priority - a.priority)
    .slice(0, 3);
}

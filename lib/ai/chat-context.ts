import type { ConversationType, Message } from "@prisma/client";
import {
  DAILY_CHECKIN_PROMPT,
  GENERAL_COMPANION_PROMPT,
  SOCIAL_COACHING_PROMPT,
  buildMemoryContext,
} from "@/lib/ai/prompts";
import { getScenarioById } from "@/lib/coaching-scenarios";

export function buildSystemPrompt(params: {
  type: ConversationType;
  userName: string | null;
  city: string | null;
  memorySnippet: string | null;
  anxietyLevel: number | null;
  scenarioId: string | null;
  recentHistory: string;
  streak: number;
  activeGoalTitles: string[];
  recentUserLines: string[];
}): string {
  const memoryContext = buildMemoryContext({
    city: params.city,
    memorySnippet: params.memorySnippet,
    activeGoals: params.activeGoalTitles,
    recentUserLines: params.recentUserLines,
  });

  const displayName = params.userName?.trim() || "friend";

  switch (params.type) {
    case "DAILY_CHECKIN": {
      const lastUser = params.recentUserLines.at(-1);
      const lastMessage =
        lastUser ??
        (params.recentHistory.trim()
          ? `From our last check-in: ${params.recentHistory.slice(0, 500)}`
          : "Nothing specific on file yet — this may be their first check-in of the day.");
      return DAILY_CHECKIN_PROMPT(displayName, lastMessage, params.streak);
    }
    case "SOCIAL_COACHING": {
      const scenario = params.scenarioId ? getScenarioById(params.scenarioId) : undefined;
      const label = scenario
        ? `${scenario.title}. ${scenario.description}`
        : "General social coaching conversation.";
      const level = Math.min(5, Math.max(1, params.anxietyLevel ?? 3));
      return SOCIAL_COACHING_PROMPT(label, level);
    }
    case "CRISIS":
    case "GENERAL":
    default:
      return GENERAL_COMPANION_PROMPT(displayName, memoryContext);
  }
}

export function toOpenAIMessages(messages: Message[]): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}

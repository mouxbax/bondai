import type { ConversationType, Message } from "@prisma/client";
import {
  DAILY_CHECKIN_PROMPT,
  GENERAL_COMPANION_PROMPT,
  SOCIAL_COACHING_PROMPT,
  buildMemoryContext,
} from "@/lib/ai/prompts";
import { getScenarioById } from "@/lib/coaching-scenarios";

const MOOD_INSTRUCTIONS: Record<string, string> = {
  calm: "The user selected CALM. Match this energy: be gentle, unhurried, grounded. Speak softly and thoughtfully.",
  happy: "The user selected HAPPY. Match this energy: be upbeat, warm, celebrate wins. Light and bright tone.",
  focused: "The user selected FOCUSED. Match this energy: be direct, efficient, no fluff. Get to the point. Respect their flow state.",
  energetic: "The user selected ENERGIZED. Match this energy: be bold, enthusiastic, action-oriented. High tempo.",
  tender: "The user selected TENDER. Match this energy: be extra gentle, compassionate, patient. Handle with care.",
  anxious: "The user selected ANXIOUS. Match this energy: be calming, reassuring, grounding. Short sentences. No overwhelm.",
  sad: "The user selected LOW. Match this energy: be warm, validating, present. Don't try to fix — just be there.",
};

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
  runtimeContext?: {
    locationLabel?: string | null;
    localDateTime?: string | null;
    weatherSummary?: string | null;
  };
  mood?: string;
}): string {
  const memoryContext = buildMemoryContext({
    city: params.city,
    memorySnippet: params.memorySnippet,
    activeGoals: params.activeGoalTitles,
    recentUserLines: params.recentUserLines,
    runtimeContext: params.runtimeContext,
  });

  const displayName = params.userName?.trim() || "friend";
  const moodBlock = params.mood && MOOD_INSTRUCTIONS[params.mood]
    ? `\n\nMOOD CONTEXT:\n${MOOD_INSTRUCTIONS[params.mood]}`
    : "";

  switch (params.type) {
    case "DAILY_CHECKIN": {
      const lastUser = params.recentUserLines.at(-1);
      const lastMessage =
        lastUser ??
        (params.recentHistory.trim()
          ? `From our last check-in: ${params.recentHistory.slice(0, 500)}`
          : "Nothing specific on file yet - this may be their first check-in of the day.");
      return DAILY_CHECKIN_PROMPT(displayName, lastMessage, params.streak) + moodBlock;
    }
    case "SOCIAL_COACHING": {
      const scenario = params.scenarioId ? getScenarioById(params.scenarioId) : undefined;
      const label = scenario
        ? `${scenario.title}. ${scenario.description}`
        : "General practice session.";
      const level = Math.min(5, Math.max(1, params.anxietyLevel ?? 3));
      return SOCIAL_COACHING_PROMPT(label, level) + moodBlock;
    }
    case "CRISIS":
    case "GENERAL":
    default:
      return GENERAL_COMPANION_PROMPT(displayName, memoryContext) + moodBlock;
  }
}

export function toOpenAIMessages(messages: Message[]): Array<{ role: "user" | "assistant"; content: string }> {
  return messages.map((m) => ({
    role: m.role === "USER" ? "user" : "assistant",
    content: m.content,
  }));
}

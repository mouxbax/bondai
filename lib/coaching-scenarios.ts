import type { CoachingScenarioMeta } from "@/types";

export const COACHING_SCENARIOS: CoachingScenarioMeta[] = [
  {
    id: "neighbor",
    title: "Meeting your neighbor for the first time",
    description: "Practice a friendly hallway or elevator introduction that feels natural.",
    difficulty: 1,
    minutes: 8,
  },
  {
    id: "hangout",
    title: "Asking someone to hang out",
    description: "Invite someone to coffee, a walk, or a low-key plan without overthinking.",
    difficulty: 2,
    minutes: 10,
  },
  {
    id: "networking",
    title: "Networking at a work event",
    description: "Open a conversation, keep it flowing, and exit gracefully.",
    difficulty: 2,
    minutes: 12,
  },
  {
    id: "reconnect",
    title: "Reconnecting with an old friend",
    description: "Reach out warmly after time apart — no guilt, no pressure.",
    difficulty: 2,
    minutes: 10,
  },
  {
    id: "party",
    title: "Making conversation at a party",
    description: "Join a circle, add a comment, and stay curious without performing.",
    difficulty: 2,
    minutes: 10,
  },
  {
    id: "coffee-coworker",
    title: "Asking a coworker for coffee",
    description: "A simple invite that respects boundaries and busy schedules.",
    difficulty: 1,
    minutes: 8,
  },
  {
    id: "boundary",
    title: "Setting a boundary politely",
    description: "Say no (or not now) clearly while keeping respect intact.",
    difficulty: 3,
    minutes: 12,
  },
  {
    id: "ask-help",
    title: "Asking for help from someone",
    description: "Make a specific ask without minimizing your needs.",
    difficulty: 2,
    minutes: 10,
  },
];

export function getScenarioById(id: string): CoachingScenarioMeta | undefined {
  return COACHING_SCENARIOS.find((s) => s.id === id);
}

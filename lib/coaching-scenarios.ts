import type { CoachingScenarioMeta } from "@/types";

export const COACHING_SCENARIOS: CoachingScenarioMeta[] = [
  {
    id: "salary-negotiation",
    title: "Negotiating a raise or salary",
    description: "Practice presenting your value and handling pushback confidently.",
    difficulty: 3,
    minutes: 12,
  },
  {
    id: "job-interview",
    title: "Acing a job interview",
    description: "Rehearse common questions, tell your story, and handle curveballs.",
    difficulty: 2,
    minutes: 15,
  },
  {
    id: "client-pitch",
    title: "Pitching to a potential client",
    description: "Present your offer, handle objections, and close with confidence.",
    difficulty: 3,
    minutes: 12,
  },
  {
    id: "networking",
    title: "Networking at a work event",
    description: "Open a conversation, keep it flowing, and exit gracefully.",
    difficulty: 2,
    minutes: 12,
  },
  {
    id: "boundary",
    title: "Setting a boundary politely",
    description: "Say no (or not now) clearly while keeping respect intact.",
    difficulty: 2,
    minutes: 10,
  },
  {
    id: "difficult-conversation",
    title: "Having a difficult conversation",
    description: "Address a conflict with a colleague, friend, or partner constructively.",
    difficulty: 3,
    minutes: 12,
  },
  {
    id: "ask-help",
    title: "Asking for help or a favor",
    description: "Make a specific ask without minimizing your needs.",
    difficulty: 1,
    minutes: 8,
  },
  {
    id: "public-speaking",
    title: "Presenting to a group",
    description: "Practice your opening, pacing, and handling Q&A with composure.",
    difficulty: 3,
    minutes: 15,
  },
];

export function getScenarioById(id: string): CoachingScenarioMeta | undefined {
  return COACHING_SCENARIOS.find((s) => s.id === id);
}

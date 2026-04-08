import type {
  ConnectionEventType,
  ConversationType,
  EmotionTag,
  MessageRole,
  SocialGoalStatus,
} from "@prisma/client";

export type {
  ConnectionEventType,
  ConversationType,
  EmotionTag,
  MessageRole,
  SocialGoalStatus,
};

export interface CrisisPayload {
  isCrisis: boolean;
  severity: "low" | "medium" | "high";
  keywords: string[];
}

export interface EmotionResult {
  emotion: EmotionTag;
  confidence: number;
}

export interface CrisisResource {
  label: string;
  detail: string;
  href?: string;
}

export interface CoachingScenarioMeta {
  id: string;
  title: string;
  description: string;
  difficulty: 1 | 2 | 3;
  minutes: number;
}

export interface ChatStreamMeta {
  emotion?: EmotionTag | null;
  crisis?: CrisisPayload | null;
  done: boolean;
}

export interface ScoreApiResponse {
  score: number;
  events: Array<{
    id: string;
    type: ConnectionEventType;
    note: string | null;
    pointsAwarded: number;
    badgeKey: string | null;
    createdAt: string;
  }>;
  streak: {
    current: number;
    longest: number;
    lastCheckInDate: string | null;
  };
  badges: string[];
  history?: Array<{ at: string; score: number }>;
}

import { chatCompletionJson } from "./client";
import { CRISIS_DETECTION_PROMPT } from "./prompts";
import type { CrisisPayload, CrisisResource } from "@/types";

export async function detectCrisisFromText(text: string): Promise<CrisisPayload> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { isCrisis: false, severity: "low", keywords: [] };
  }

  if (!process.env.OPENROUTER_API_KEY) {
    return keywordCrisisFallback(trimmed);
  }

  try {
    const raw = await chatCompletionJson<{
      isCrisis?: boolean;
      severity?: string;
      signals?: string[];
      keywords?: string[];
      confidence?: number;
    }>(CRISIS_DETECTION_PROMPT, trimmed, { maxTokens: 200 });

    const severityRaw = typeof raw.severity === "string" ? raw.severity : "none";

    const signals = Array.isArray(raw.signals)
      ? raw.signals
      : Array.isArray(raw.keywords)
        ? raw.keywords
        : [];

    if (severityRaw === "high") {
      return { isCrisis: true, severity: "high", keywords: signals };
    }
    if (severityRaw === "medium") {
      return { isCrisis: true, severity: "medium", keywords: signals };
    }

    return { isCrisis: false, severity: "low", keywords: signals };
  } catch {
    return keywordCrisisFallback(trimmed);
  }
}

function keywordCrisisFallback(text: string): CrisisPayload {
  const t = text.toLowerCase();
  const keywords: string[] = [];
  if (/\b(kill myself|end my life|suicide|unalive)\b/.test(t)) keywords.push("self-harm language");
  if (/\b(can't go on|no point living|better off dead)\b/.test(t)) keywords.push("hopelessness");
  if (keywords.length >= 2) return { isCrisis: true, severity: "high", keywords };
  if (keywords.length === 1) return { isCrisis: true, severity: "medium", keywords };
  return { isCrisis: false, severity: "low", keywords: [] };
}

export const CRISIS_RESOURCES: CrisisResource[] = [
  {
    label: "International",
    detail: "Find free, confidential support in your country.",
    href: "https://findahelpline.com",
  },
  {
    label: "United States - 988",
    detail: "Suicide & Crisis Lifeline - call or text 988.",
  },
  {
    label: "United Kingdom - Samaritans",
    detail: "Call 116 123 (free, 24/7).",
  },
  {
    label: "Crisis Text Line",
    detail: "Text HOME to 741741 (US/Canada).",
  },
];

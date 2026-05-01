import { chatCompletionJson } from "./client";
import { EMOTION_DETECTION_PROMPT, isEmotionTag } from "./prompts";
import type { EmotionResult } from "@/types";

export async function detectEmotionFromText(text: string): Promise<EmotionResult> {
  const trimmed = text.trim();
  if (!trimmed) {
    return { emotion: "NEUTRAL", confidence: 0 };
  }

  if (!process.env.OPENAI_API_KEY) {
    return heuristicEmotion(trimmed);
  }

  try {
    const raw = await chatCompletionJson<{ emotion: string; confidence: number }>(
      EMOTION_DETECTION_PROMPT,
      trimmed,
      { maxTokens: 80 }
    );
    const emotion = isEmotionTag(raw.emotion) ? raw.emotion : "NEUTRAL";
    const confidence =
      typeof raw.confidence === "number" && !Number.isNaN(raw.confidence)
        ? Math.min(1, Math.max(0, raw.confidence))
        : 0.5;
    return { emotion, confidence };
  } catch {
    return heuristicEmotion(trimmed);
  }
}

function heuristicEmotion(text: string): EmotionResult {
  const t = text.toLowerCase();
  if (/\b(love|great|happy|excited|grateful|awesome)\b/.test(t)) return { emotion: "HAPPY", confidence: 0.4 };
  if (/\b(angry|furious|hate|annoyed)\b/.test(t)) return { emotion: "ANGRY", confidence: 0.4 };
  if (/\b(anxious|nervous|panic|worried|scared)\b/.test(t)) return { emotion: "ANXIOUS", confidence: 0.45 };
  if (/\b(lonely|alone|isolated|no friends)\b/.test(t)) return { emotion: "LONELY", confidence: 0.45 };
  if (/\b(sad|depressed|cry|down|blue)\b/.test(t)) return { emotion: "SAD", confidence: 0.4 };
  return { emotion: "NEUTRAL", confidence: 0.35 };
}

import { chatCompletionJson } from "@/lib/ai/client";
import { prisma } from "@/lib/db/prisma";

/**
 * Two-layer memory system.
 *
 * Layer 1 — rolling summary (User.memorySnippet): one short paragraph
 *   that evolves over time. Cheap, always fetched for every chat system prompt.
 *
 * Layer 2 — structured facts (UserMemory rows): discrete items categorized
 *   as preference/person/goal/struggle/routine/fact. Retrieved on demand
 *   (by recency or category) when we need richer context.
 *
 * Both are updated in one model call after a conversation turn completes.
 */

const SYSTEM = `You are a memory extractor for a companion app.
Given (a) an existing memory snippet and (b) a recent user message, output JSON:

{
  "snippet": "<updated rolling summary, <=500 chars, first-person-neutral>",
  "facts": [
    {"category": "preference|person|goal|struggle|routine|fact", "content": "<short fact>", "confidence": 0..1}
  ]
}

RULES:
- Output ONLY JSON.
- Only extract facts that are clearly supported by the user's text. If nothing substantive, return facts: [].
- Max 4 facts per call.
- Keep content short (<=140 chars per fact).
- Don't repeat what's already in the snippet verbatim.
- The snippet must feel like notes a thoughtful friend keeps — not a log.`;

interface MemoryExtractResult {
  snippet: string;
  facts: Array<{ category: string; content: string; confidence: number }>;
}

const ALLOWED_CATEGORIES = new Set([
  "preference",
  "person",
  "goal",
  "struggle",
  "routine",
  "fact",
]);

/**
 * Run memory extraction and persist both layers.
 * Called fire-and-forget from the chat route — never block the user reply on this.
 */
export async function updateMemoryFromTurn(params: {
  userId: string;
  conversationId: string;
  userMessage: string;
  assistantMessage?: string;
}): Promise<void> {
  const { userId, conversationId, userMessage, assistantMessage } = params;
  if (!userMessage || userMessage.trim().length < 8) return;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { memorySnippet: true },
  });
  const currentSnippet = user?.memorySnippet ?? "";

  const prompt = [
    `Existing memory snippet: ${currentSnippet || "(empty)"}`,
    `User said: "${userMessage.slice(0, 800)}"`,
    assistantMessage ? `I replied: "${assistantMessage.slice(0, 300)}"` : "",
    "Update.",
  ]
    .filter(Boolean)
    .join("\n");

  let result: MemoryExtractResult;
  try {
    result = await chatCompletionJson<MemoryExtractResult>(SYSTEM, prompt, { maxTokens: 420 });
  } catch {
    return; // silent — memory is best-effort
  }

  const nextSnippet = (result.snippet ?? "").trim().slice(0, 800);
  if (nextSnippet && nextSnippet !== currentSnippet) {
    await prisma.user
      .update({ where: { id: userId }, data: { memorySnippet: nextSnippet } })
      .catch(() => {});
  }

  const facts = Array.isArray(result.facts) ? result.facts.slice(0, 4) : [];
  for (const f of facts) {
    if (!f || typeof f.content !== "string") continue;
    const content = f.content.trim().slice(0, 240);
    if (content.length < 4) continue;
    const category = ALLOWED_CATEGORIES.has(f.category) ? f.category : "fact";
    const confidence = typeof f.confidence === "number" ? Math.max(0, Math.min(1, f.confidence)) : 0.7;

    // Dedupe: if we already stored a near-identical fact recently, just bump lastSeenAt.
    const existing = await prisma.userMemory.findFirst({
      where: {
        userId,
        category,
        content: { equals: content, mode: "insensitive" },
      },
      select: { id: true },
    });
    if (existing) {
      await prisma.userMemory
        .update({ where: { id: existing.id }, data: { lastSeenAt: new Date() } })
        .catch(() => {});
    } else {
      await prisma.userMemory
        .create({
          data: { userId, category, content, confidence, source: conversationId },
        })
        .catch(() => {});
    }
  }
}

/**
 * Read the top N most-recent structured facts for push / chat context building.
 */
export async function getRecentMemories(userId: string, limit = 8) {
  return prisma.userMemory.findMany({
    where: { userId },
    orderBy: { lastSeenAt: "desc" },
    take: limit,
  });
}

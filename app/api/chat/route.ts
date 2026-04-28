import { NextResponse } from "next/server";
import type OpenAI from "openai";
import { z } from "zod";
import { auth } from "@/auth";
import { detectCrisisFromText } from "@/lib/ai/crisis";
import { detectEmotionFromText } from "@/lib/ai/emotions";
import { FALLBACK_MODEL, PRIMARY_MODEL, getOpenAIClient } from "@/lib/ai/client";
import { buildSystemPrompt, toOpenAIMessages } from "@/lib/ai/chat-context";
import { updateMemoryFromTurn } from "@/lib/ai/memory";
import { prisma } from "@/lib/db/prisma";
import { countUserMessagesInConversation, getConversationForUser } from "@/lib/db/queries/conversations";
import { logCrisisEvent } from "@/lib/db/queries/crisis-log";
import { addConnectionEvent } from "@/lib/db/queries/score";
import { startOfNextUtcDay, startOfUtcDay } from "@/lib/utils";
import type { CrisisPayload } from "@/types";

/**
 * Example:
 * curl -N -X POST http://localhost:3000/api/chat \
 *   -H "Content-Type: application/json" \
 *   -H "Cookie: ...session..." \
 *   -d '{"conversationId":"...","content":"Hello","useVoice":false}'
 */

const bodySchema = z.object({
  conversationId: z.string().min(1),
  content: z.string().optional().default(""),
  useVoice: z.boolean().optional(),
  bootstrap: z.boolean().optional(),
  mood: z.string().trim().max(20).optional(),
  context: z
    .object({
      locationLabel: z.string().trim().max(120).optional(),
      localDateTime: z.string().trim().max(120).optional(),
      weatherSummary: z.string().trim().max(160).optional(),
    })
    .optional(),
});

const VOICE_STYLE_PROMPT = `
VOICE MODE OVERRIDE:
- Sound natural when read aloud.
- Keep responses concise (2-4 short sentences unless asked for depth).
- Avoid markdown, lists, and special formatting characters.
- Use conversational punctuation so text-to-speech sounds human.
- Ask at most one gentle follow-up question.
`.trim();

export async function POST(req: Request): Promise<Response> {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const json = await req.json().catch(() => null);
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid body" }, { status: 400 });
  }

  const { conversationId, content, useVoice, bootstrap, mood, context } = parsed.data;
  const trimmed = content.trim();

  if (!bootstrap && !trimmed) {
    return NextResponse.json({ error: "content required unless bootstrap" }, { status: 400 });
  }

  const convo = await getConversationForUser(conversationId, session.user.id);
  if (!convo) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const userRow = await prisma.user.findUniqueOrThrow({
    where: { id: session.user.id },
    include: {
      streak: true,
      socialGoals: { where: { status: "ACTIVE" }, take: 8 },
    },
  });

  const recentUserLines = convo.messages.filter((m) => m.role === "USER").map((m) => m.content);
  const recentAssistant = convo.messages.filter((m) => m.role === "ASSISTANT").slice(-3);
  const recentHistory = recentAssistant.map((m) => m.content).join("\n---\n");

  const userMessages = await countUserMessagesInConversation(conversationId);

  if (bootstrap) {
    if (convo.type !== "DAILY_CHECKIN") {
      return NextResponse.json({ error: "bootstrap only for daily check-in" }, { status: 400 });
    }
    if (userMessages > 0 || convo.messages.some((m) => m.role === "ASSISTANT")) {
      return NextResponse.json({ error: "conversation already started" }, { status: 400 });
    }
  }

  let emotionTag: Awaited<ReturnType<typeof detectEmotionFromText>>["emotion"] | null = null;
  let crisisResult: CrisisPayload = { isCrisis: false, severity: "low", keywords: [] };

  if (!bootstrap && trimmed) {
    crisisResult = await detectCrisisFromText(trimmed);
    if (crisisResult.isCrisis) {
      await logCrisisEvent(session.user.id, conversationId, crisisResult);
      await prisma.conversation.update({
        where: { id: conversationId },
        data: {
          crisisFlaggedAt: new Date(),
          crisisFollowUpDueAt: startOfNextUtcDay(),
        },
      });
    }
    const em = await detectEmotionFromText(trimmed);
    emotionTag = em.emotion;
    await prisma.message.create({
      data: {
        conversationId,
        role: "USER",
        content: trimmed,
        emotionTag: em.emotion,
        voiceUsed: Boolean(useVoice),
      },
    });
  }

  const streakCount = userRow.streak?.currentStreak ?? 0;
  const system = buildSystemPrompt({
    type: convo.type,
    userName: userRow.name,
    city: userRow.city,
    memorySnippet: userRow.memorySnippet,
    anxietyLevel: userRow.anxietyLevel,
    scenarioId: convo.scenarioId,
    recentHistory,
    streak: streakCount,
    activeGoalTitles: userRow.socialGoals.map((g) => g.title),
    recentUserLines,
    runtimeContext: context,
    mood: mood ?? undefined,
  });

  const prior = bootstrap ? [] : toOpenAIMessages(convo.messages);
  const historyForModel =
    bootstrap ? prior : [...prior, { role: "user" as const, content: trimmed }];

  const openaiMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
    { role: "system", content: useVoice ? `${system}\n\n${VOICE_STYLE_PROMPT}` : system },
    ...historyForModel,
  ];

  if (bootstrap) {
    openaiMessages.push({
      role: "user",
      content:
        "[System: This is the start of today's check-in. Send your opening message now - warm, specific, one great question. No meta.]",
    });
  }

  const encoder = new TextEncoder();
  let fullAssistant = "";

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (obj: Record<string, unknown>) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(obj)}\n\n`));
      };

      try {
        let client: OpenAI;
        try {
          client = getOpenAIClient();
        } catch {
          send({ type: "error", message: "AI is not configured. Set OPENAI_API_KEY." });
          controller.close();
          return;
        }
        const runStream = async (model: string) => {
          const completion = await client.chat.completions.create({
            model,
            messages: openaiMessages,
            stream: true,
            temperature: useVoice ? 0.55 : 0.7,
            max_tokens: useVoice ? 260 : 700,
          });
          for await (const chunk of completion) {
            const delta = chunk.choices[0]?.delta?.content;
            if (delta) {
              fullAssistant += delta;
              send({ type: "text", text: delta });
            }
          }
        };

        try {
          await runStream(useVoice ? FALLBACK_MODEL : PRIMARY_MODEL);
        } catch (streamErr) {
          console.error("[CHAT] primary model failed, trying fallback:", streamErr);
          await runStream(useVoice ? PRIMARY_MODEL : FALLBACK_MODEL);
        }

        await prisma.message.create({
          data: {
            conversationId,
            role: "ASSISTANT",
            content: fullAssistant,
            emotionTag: null,
            voiceUsed: false,
          },
        });

        await prisma.conversation.update({
          where: { id: conversationId },
          data: { updatedAt: new Date() },
        });

        // Fire-and-forget memory extraction. Never blocks the reply.
        if (!bootstrap && trimmed && fullAssistant.length > 0) {
          void updateMemoryFromTurn({
            userId: session.user.id,
            conversationId,
            userMessage: trimmed,
            assistantMessage: fullAssistant,
          }).catch(() => {});
        }

        if (bootstrap && convo.type === "DAILY_CHECKIN" && fullAssistant.length > 0) {
          const dayStart = startOfUtcDay();
          const dayEnd = new Date(dayStart);
          dayEnd.setUTCDate(dayEnd.getUTCDate() + 1);
          const already = await prisma.connectionEvent.findFirst({
            where: {
              userId: session.user.id,
              type: "DAILY_CHECKIN",
              createdAt: { gte: dayStart, lt: dayEnd },
            },
          });
          if (!already) {
            await addConnectionEvent({
              userId: session.user.id,
              type: "DAILY_CHECKIN",
              pointsAwarded: 2,
              note: "Daily check-in opening",
            });
          }
        }

        send({
          type: "meta",
          done: true,
          emotion: emotionTag,
          crisis: crisisResult.isCrisis ? crisisResult : null,
        });
        controller.close();
      } catch (e) {
        send({
          type: "error",
          message: e instanceof Error ? e.message : "Chat failed",
        });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

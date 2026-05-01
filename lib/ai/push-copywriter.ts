import { FALLBACK_MODEL, getOpenAIClient } from "@/lib/ai/client";

export type NudgeSlot = "morning" | "midday" | "afternoon" | "evening" | "night";

export interface NudgeContext {
  userName?: string | null;
  localHour: number;
  slot: NudgeSlot;
  memorySnippet?: string | null;
  recentMood?: string | null;
  activeGoals?: string[];
  streakDays?: number;
  city?: string | null;
  // Free-form "what the user has told us recently" — the last 2-3 things they said.
  recentLines?: string[];
}

export interface NudgeCopy {
  title: string;
  body: string;
}

const SYSTEM_PROMPT = `You write short push notifications from AIAH — a warm, present companion app.

RULES (strict):
- Write ONE notification only, as JSON: {"title":"...","body":"..."}.
- title: 2-5 words. No generic greetings like "Hi!" or "Hey there!".
- body: 1-2 sentences, max 140 characters. Feels like a friend texting.
- Reference something specific about the user (mood, what they mentioned, streak, weather, time of day).
- Never mention features ("open AIAH", "log your mood", "track your streak"). Be human.
- Never prescribe ("you should", "you need to"). Invite ("want to...", "curious how...").
- Never assume — if context is thin, ask a gentle open question.
- Vary tone by slot:
  morning → soft, encouraging, forward-looking
  midday → curious, playful, light check-in on their day
  afternoon → grounding, mid-energy
  evening → reflective, warm, slowing down
  night → tender, closing, no new asks
- Never mention specific activities (gym, workout, meeting) unless the user just mentioned them.
- No emojis unless it genuinely adds warmth — max 1.
- Never output anything but the JSON object.`;

function buildUserPrompt(ctx: NudgeContext): string {
  const bits: string[] = [];
  bits.push(`Slot: ${ctx.slot} (local hour ${ctx.localHour})`);
  if (ctx.userName) bits.push(`Name: ${ctx.userName}`);
  if (ctx.city) bits.push(`City: ${ctx.city}`);
  if (ctx.recentMood) bits.push(`Most recent mood: ${ctx.recentMood}`);
  if (typeof ctx.streakDays === "number" && ctx.streakDays > 0) {
    bits.push(`Current streak: ${ctx.streakDays} days`);
  }
  if (ctx.activeGoals && ctx.activeGoals.length > 0) {
    bits.push(`Active goals: ${ctx.activeGoals.slice(0, 3).join("; ")}`);
  }
  if (ctx.memorySnippet) {
    bits.push(`What I remember about them: ${ctx.memorySnippet.slice(0, 600)}`);
  }
  if (ctx.recentLines && ctx.recentLines.length > 0) {
    bits.push(
      `Last things they said: ${ctx.recentLines
        .slice(-3)
        .map((l) => `"${l.slice(0, 200)}"`)
        .join(" | ")}`,
    );
  }
  bits.push(`\nWrite the notification as JSON only.`);
  return bits.join("\n");
}

/**
 * Generate one personalized push notification for a user + slot.
 * Falls back to a soft generic line if the model hiccups.
 */
export async function writeNudge(ctx: NudgeContext): Promise<NudgeCopy> {
  const fallback = fallbackCopy(ctx);
  let client;
  try {
    client = getOpenAIClient();
  } catch {
    return fallback;
  }

  try {
    const res = await client.chat.completions.create({
      model: FALLBACK_MODEL, // cheap model is fine for short copy
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: buildUserPrompt(ctx) },
      ],
      temperature: 0.85,
      max_tokens: 180,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    const obj = JSON.parse(text) as { title?: unknown; body?: unknown };
    const title =
      typeof obj.title === "string" && obj.title.trim() ? obj.title.trim().slice(0, 60) : fallback.title;
    const body =
      typeof obj.body === "string" && obj.body.trim() ? obj.body.trim().slice(0, 180) : fallback.body;
    return { title, body };
  } catch {
    return fallback;
  }
}

function fallbackCopy(ctx: NudgeContext): NudgeCopy {
  const name = ctx.userName?.split(" ")[0] ?? "you";
  switch (ctx.slot) {
    case "morning":
      return { title: "Morning", body: `A soft start to the day, ${name}. How are you landing?` };
    case "midday":
      return { title: "Mid-day", body: `Curious — how's the day going so far?` };
    case "afternoon":
      return { title: "Afternoon", body: `Quick breath. What's the energy like right now?` };
    case "evening":
      return { title: "Evening", body: `Easing toward the end of the day. What's on your mind?` };
    default:
      return { title: "Tonight", body: `Here if you want to close the day with me.` };
  }
}

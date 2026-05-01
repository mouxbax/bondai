import OpenAI from "openai";

// ── OpenAI direct client (primary — GPT-4o) ──────────────────────────
const openaiKey = process.env.OPENAI_API_KEY ?? "";

export const PRIMARY_MODEL = "gpt-4o";
export const FALLBACK_MODEL = "gpt-4o-mini";

export function getOpenAIClient(): OpenAI {
  if (!openaiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }
  return new OpenAI({ apiKey: openaiKey });
}

export async function chatCompletionJson<T>(
  system: string,
  user: string,
  options?: { model?: string; maxTokens?: number }
): Promise<T> {
  const client = getOpenAIClient();
  const model = options?.model ?? PRIMARY_MODEL;
  const maxTokens = options?.maxTokens ?? 256;

  async function run(m: string): Promise<T> {
    const res = await client.chat.completions.create({
      model: m,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
      temperature: 0.2,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
    });
    const text = res.choices[0]?.message?.content ?? "{}";
    return JSON.parse(text) as T;
  }

  try {
    return await run(model);
  } catch {
    return await run(FALLBACK_MODEL);
  }
}
